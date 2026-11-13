import type { Session } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { favoritos } from '@/hooks/use-favoritos'
import { perfilLocal, type Perfil } from '@/hooks/use-perfil'
import { irPara, substituirRota } from '@/hooks/use-rota'
import { supabase } from '@/lib/supabase'

// Login é opcional. Sem ele, perfil e grade ficam só no aparelho.
// Com ele, o aparelho continua sendo a fonte da tela e a nuvem recebe uma cópia:
// ao entrar, junta o que tem nos dois lados; depois, cada mudança local sobe.

let sessao: Session | null = null
let sincronizado = false
let favoritosNaNuvem = new Set<string>()
let idPorSlug = new Map<string, number>()
const ouvintes = new Set<() => void>()

// O link mágico volta com #access_token=... na URL; o supabase-js lê e limpa sozinho
const veioDoLink = window.location.hash.includes('access_token')

// Link vencido ou já usado volta com #error=...&error_code=otp_expired: avisa e limpa a URL
if (/[#&]error=/.test(window.location.hash)) {
  const expirado = window.location.hash.includes('otp_expired')
  substituirRota('#/perfil')
  setTimeout(() => toast.error(expirado ? 'Esse link já foi usado ou venceu.' : 'Não deu para entrar por esse link.', {
    description: 'Peça um novo aqui no Perfil. Cada link vale uma vez só, por 1 hora.',
  }))
}

supabase.auth.onAuthStateChange((evento, nova) => {
  sessao = nova
  ouvintes.forEach((o) => o())
  if (!nova) {
    sincronizado = false
    favoritosNaNuvem = new Set()
    return
  }
  // Fora do callback: chamar o Supabase dentro dele pode travar a troca de sessão
  if (evento === 'SIGNED_IN' || evento === 'INITIAL_SESSION') setTimeout(() => void sincronizar(nova.user.id))
})

export function useSessao() {
  return useSyncExternalStore(
    (o) => { ouvintes.add(o); return () => ouvintes.delete(o) },
    () => sessao,
  )
}

export async function entrar(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Volta para a raiz do app (sem hash): a URL precisa estar liberada em Auth > URL Configuration
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  })
  return error?.message ?? null
}

export async function sair() {
  await supabase.auth.signOut()
  toast('Você saiu. Seus dados continuam neste aparelho.')
}

async function sincronizar(userId: string) {
  const [perfilRes, favRes, escolasRes] = await Promise.all([
    supabase.from('perfis').select('nome, escola_coracao_id, tipo_folia, conquistas').eq('id', userId).maybeSingle(),
    supabase.from('favoritos').select('escola_id').eq('user_id', userId),
    supabase.from('escolas').select('id, slug'),
  ])
  if (perfilRes.error || favRes.error || escolasRes.error) {
    toast.error('Não deu para sincronizar com a nuvem agora.')
    return
  }

  idPorSlug = new Map(escolasRes.data.map((e) => [e.slug, e.id]))
  const slugPorId = new Map(escolasRes.data.map((e) => [e.id, e.slug]))
  const remoto = perfilRes.data
  const local = perfilLocal.atual()

  // Junta os dois lados: o que já está na nuvem vence nos campos únicos, listas somam
  const juntado: Partial<Perfil> = {
    nome: remoto?.nome || local.nome || '',
    escolaCoracao: (remoto?.escola_coracao_id && slugPorId.get(remoto.escola_coracao_id)) || local.escolaCoracao || null,
    tipoFolia: remoto?.tipo_folia ?? local.tipoFolia ?? null,
    conquistas: [...new Set([...(remoto?.conquistas ?? []), ...(local.conquistas ?? [])])],
  }
  const remotos = favRes.data.map((f) => slugPorId.get(f.escola_id)).filter((s): s is string => Boolean(s))
  const todos = [...new Set([...favoritos.atual(), ...remotos])]

  favoritosNaNuvem = new Set(remotos)
  sincronizado = true
  perfilLocal.definir((p) => ({ ...p, ...juntado }))
  favoritos.definir(todos) // dispara o envio dos que só estavam no aparelho
  await enviarPerfil()

  if (veioDoLink) {
    irPara('perfil')
    toast('Pronto, você entrou! ☁️', { description: 'Sua grade agora vai junto em qualquer aparelho.' })
  }
}

async function enviarPerfil() {
  if (!sessao || !sincronizado) return
  const p = perfilLocal.atual()
  const { error } = await supabase.from('perfis').upsert({
    id: sessao.user.id,
    nome: p.nome || null,
    escola_coracao_id: p.escolaCoracao ? idPorSlug.get(p.escolaCoracao) ?? null : null,
    tipo_folia: p.tipoFolia,
    conquistas: p.conquistas,
    atualizado_em: new Date().toISOString(),
  })
  if (error) console.error('perfil:', error.message)
}

async function enviarFavoritos() {
  if (!sessao || !sincronizado) return
  const atuais = new Set(favoritos.atual())
  const novos = [...atuais].filter((s) => !favoritosNaNuvem.has(s))
  const removidos = [...favoritosNaNuvem].filter((s) => !atuais.has(s))
  favoritosNaNuvem = atuais
  const userId = sessao.user.id
  const ids = (slugs: string[]) => slugs.map((s) => idPorSlug.get(s)).filter((i): i is number => i != null)

  const [a, b] = await Promise.all([
    novos.length
      ? supabase.from('favoritos').upsert(ids(novos).map((escola_id) => ({ user_id: userId, escola_id })), { ignoreDuplicates: true })
      : null,
    removidos.length ? supabase.from('favoritos').delete().eq('user_id', userId).in('escola_id', ids(removidos)) : null,
  ])
  if (a?.error || b?.error) console.error('favoritos:', (a?.error ?? b?.error)?.message)
}

// Perfil muda em rajadas (digitando o nome): espera parar antes de subir
let espera: ReturnType<typeof setTimeout> | undefined
perfilLocal.assinar(() => {
  clearTimeout(espera)
  espera = setTimeout(() => void enviarPerfil(), 800)
})
favoritos.assinar(() => void enviarFavoritos())
