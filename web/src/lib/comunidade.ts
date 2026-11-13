import { useCallback, useEffect, useState } from 'react'
import { useSessao } from '@/lib/sessao'
import { supabase } from '@/lib/supabase'

// Comunidade (etapa 1, sql/007 a 009): perfil público opcional, conexões, bloqueio e denúncia.
// Diferente do resto do perfil, estes dados só existem na nuvem: exigem login.
// As regras de quem vê quem estão no banco (RLS): o app só pede, o banco decide.

export type MeuPerfilComunidade = {
  usuario: string | null
  bio: string | null
  foto_path: string | null
  foto_status: 'pendente' | 'aprovada' | 'recusada' | null
  noites: number[]
  setor: string | null
  procura_galera: boolean
  maior_18_em: string | null
  publico: boolean
  escola_coracao_id?: number | null // só leitura aqui: quem grava é lib/sessao.ts
}

export type Pessoa = {
  id: string
  nome: string | null
  usuario: string
  bio: string | null
  foto_path: string | null
  foto_status: string | null
  escola_coracao_id: number | null
  tipo_folia: string | null
  noites: number[]
  setor: string | null
  procura_galera: boolean
  conquistas: string[]
}

export type Conexao = { de: string; para: string; status: 'pendente' | 'aceita' }

export const USUARIO_VALIDO = /^[a-z0-9_.]{3,20}$/

export const MOTIVOS_DENUNCIA = {
  assedio: 'Assédio ou ofensa',
  foto_impropria: 'Foto imprópria',
  perfil_falso: 'Perfil falso',
  menor_de_idade: 'Parece menor de 18',
  golpe: 'Golpe ou spam',
  outro: 'Outro motivo',
} as const
export type MotivoDenuncia = keyof typeof MOTIVOS_DENUNCIA

const CAMPOS_MEUS = 'usuario, bio, foto_path, foto_status, noites, setor, procura_galera, maior_18_em, publico, escola_coracao_id'
const CAMPOS_PESSOA = 'id, nome, usuario, bio, foto_path, foto_status, escola_coracao_id, tipo_folia, noites, setor, procura_galera, conquistas'

// ---------- Meu perfil na comunidade ----------
export function useMeuPerfilComunidade() {
  const sessao = useSessao()
  const [perfil, setPerfil] = useState<MeuPerfilComunidade | null>(null)
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    if (!sessao) { setPerfil(null); setCarregando(false); return }
    const { data } = await supabase.from('perfis').select(CAMPOS_MEUS).eq('id', sessao.user.id).maybeSingle()
    setPerfil((data as MeuPerfilComunidade | null) ?? {
      usuario: null, bio: null, foto_path: null, foto_status: null, noites: [], setor: null,
      procura_galera: false, maior_18_em: null, publico: false,
    })
    setCarregando(false)
  }, [sessao])

  useEffect(() => { void recarregar() }, [recarregar])

  // Salva só os campos da comunidade (o resto do perfil é sincronizado por lib/sessao.ts)
  async function salvar(mudanca: Partial<MeuPerfilComunidade>) {
    if (!sessao) return 'Entre na sua conta primeiro.'
    const { error } = await gravarPerfil(sessao.user.id, mudanca)
    if (error) return traduzirErro(error)
    await recarregar()
    return null
  }

  return { perfil, carregando, salvar, recarregar, sessao }
}

// Atualiza a linha do perfil; só insere se ela ainda não existir.
// Não usar upsert aqui: o Postgres confere as regras (CHECK) na linha que *seria inserida*
// antes de ver que ela já existe. Um upsert com { publico: true } chega sem o @ e sem a
// declaração de 18+, e a regra publico_exige_18_e_usuario barra mesmo com tudo preenchido.
async function gravarPerfil(userId: string, mudanca: Partial<MeuPerfilComunidade>) {
  const { data, error } = await supabase.from('perfis').update(mudanca).eq('id', userId).select('id')
  if (error || data.length > 0) return { error }
  return supabase.from('perfis').insert({ id: userId, ...mudanca })
}

function traduzirErro(e: { code?: string; message: string }) {
  if (e.code === '23505') return 'Esse @ já é de outra pessoa. Tenta outro.'
  if (e.code === '23514' && e.message.includes('usuario_formato')) return 'O @ aceita só letras minúsculas, números, ponto e _ (3 a 20).'
  if (e.code === '23514' && e.message.includes('publico_exige')) return 'Para ficar público, declare que tem 18+ e escolha um @.'
  return 'Não deu para salvar agora. Tenta de novo.'
}

// ---------- Foto ----------
// Reduz para 512px em JPEG antes de subir: carrega rápido e não guarda a foto original (nem o EXIF/GPS dela)
async function reduzir(arquivo: File) {
  const bitmap = await createImageBitmap(arquivo)
  const lado = 512
  const escala = Math.min(1, lado / Math.min(bitmap.width, bitmap.height))
  const largura = Math.round(bitmap.width * escala), altura = Math.round(bitmap.height * escala)
  // Corta no centro, quadrado
  const canvas = document.createElement('canvas')
  const final = Math.min(largura, altura)
  canvas.width = final
  canvas.height = final
  canvas.getContext('2d')!.drawImage(bitmap, (final - largura) / 2, (final - altura) / 2, largura, altura)
  return new Promise<Blob>((ok, falha) => canvas.toBlob((b) => (b ? ok(b) : falha(new Error('imagem'))), 'image/jpeg', 0.85))
}

export async function enviarFoto(userId: string, arquivo: File, anterior: string | null) {
  if (!arquivo.type.startsWith('image/')) return 'Escolha uma imagem.'
  let imagem: Blob
  try { imagem = await reduzir(arquivo) } catch { return 'Não deu para ler essa imagem.' }
  const caminho = `${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage.from('avatares').upload(caminho, imagem, { contentType: 'image/jpeg' })
  if (error) return 'Não deu para enviar a foto.'
  // O banco põe a foto nova em análise sozinho (gatilho perfis_regras)
  const { error: erroPerfil } = await gravarPerfil(userId, { foto_path: caminho })
  if (erroPerfil) return 'A foto subiu, mas não deu para ligar ao perfil.'
  if (anterior) await supabase.storage.from('avatares').remove([anterior])
  return null
}

export async function removerFoto(userId: string, atual: string) {
  await gravarPerfil(userId, { foto_path: null })
  await supabase.storage.from('avatares').remove([atual])
}

// Links temporários (1 h): o bucket é privado e o banco decide quais fotos cada um pode ver
export async function linksDasFotos(caminhos: string[]) {
  const unicos = [...new Set(caminhos.filter(Boolean))]
  if (!unicos.length) return {}
  const { data } = await supabase.storage.from('avatares').createSignedUrls(unicos, 3600)
  return Object.fromEntries((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl])) as Record<string, string>
}

// ---------- Galera ----------
export async function buscarGalera(meuId: string) {
  const [pessoas, conexoes] = await Promise.all([
    supabase.from('perfis').select(CAMPOS_PESSOA).neq('id', meuId).order('publico_em', { ascending: false }).limit(200),
    supabase.from('conexoes').select('de, para, status'),
  ])
  if (pessoas.error || conexoes.error) throw new Error('Não deu para carregar a galera.')
  return { pessoas: pessoas.data as Pessoa[], conexoes: conexoes.data as Conexao[] }
}

// Pedidos de conexão esperando resposta (para o selo do atalho na Home)
export async function contarPedidos(meuId: string) {
  const { count } = await supabase.from('conexoes').select('de', { count: 'exact', head: true }).eq('para', meuId).eq('status', 'pendente')
  return count ?? 0
}

export const pedirConexao =(meuId: string, para: string) => supabase.from('conexoes').insert({ de: meuId, para })
export const aceitarConexao = (de: string) => supabase.rpc('aceitar_conexao', { quem_pediu: de })
export const desfazerConexao = (a: string, b: string) =>
  supabase.from('conexoes').delete().or(`and(de.eq.${a},para.eq.${b}),and(de.eq.${b},para.eq.${a})`)
export const bloquear = (meuId: string, outro: string) => supabase.from('bloqueios').insert({ quem: meuId, bloqueado: outro })
export const denunciar = (meuId: string, outro: string, motivo: MotivoDenuncia, detalhe: string) =>
  supabase.from('denuncias').insert({ autor: meuId, denunciado: outro, motivo, detalhe: detalhe.trim() || null })

// ---------- LGPD: baixar meus dados e excluir a conta ----------
export async function baixarMeusDados(userId: string, email: string | undefined) {
  const [perfil, favoritos, conexoes, bloqueios] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', userId).maybeSingle(),
    supabase.from('favoritos').select('escola_id, criado_em'),
    supabase.from('conexoes').select('*'),
    supabase.from('bloqueios').select('*'),
  ])
  const dados = {
    gerado_em: new Date().toISOString(),
    conta: { id: userId, email },
    perfil: perfil.data,
    favoritos: favoritos.data,
    conexoes: conexoes.data,
    bloqueios: bloqueios.data,
    observacao: 'Ingressos guardados e preferências locais ficam só no seu aparelho e não estão neste arquivo.',
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'concentra-meus-dados.json' })
  a.click()
  URL.revokeObjectURL(url)
}

export async function excluirConta() {
  const { error } = await supabase.functions.invoke('excluir-conta', { method: 'POST' })
  if (error) return 'Não deu para excluir agora. Tenta de novo em instantes.'
  await supabase.auth.signOut()
  return null
}
