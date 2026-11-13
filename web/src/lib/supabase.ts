import { createClient } from '@supabase/supabase-js'

// Só a chave publicável vai para o front. Escrita usa a service role, fora daqui.
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  // Fluxo implícito: o link mágico funciona mesmo aberto em outro navegador (app de e-mail).
  // O PKCE exigiria abrir no mesmo navegador em que o login foi pedido.
  auth: { flowType: 'implicit', persistSession: true, detectSessionInUrl: true },
})

export type Escola = { id: number; nome: string; slug: string }

export type Desfile = {
  ordem: number
  horario_previsto: string | null
  enredo_titulo: string | null
  carnavalesco: string | null
  verificado: boolean
  escolas: Escola
}

export type Noite = {
  id: number
  data: string
  grupos: { nome: string }
  desfiles: Desfile[]
}

export type Noticia = {
  id: number
  titulo: string
  url: string
  publicada_em: string | null
  fontes: { nome: string }
  noticias_escolas: { escolas: Escola }[]
}

export type Ingresso = {
  id: number
  noite_id: number
  setor: string
  preco_inteira: number | null
  operadora: string | null
  url_compra: string | null
  status: 'em_breve' | 'a_venda' | 'esgotado' | null
}

// Página da escola: dado perene + o desfile de 2027 + notícias que citam a escola
export type EscolaDetalhe = Escola & {
  bairro: string | null
  fundacao: string | null
  cores: string[] | null
  site_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  historia_md: string | null
  historia_fonte_url: string | null
  ultimo_samba_titulo: string | null
  ultimo_samba_ano: number | null
  ultimo_samba_spotify_url: string | null
  desfiles: (Omit<Desfile, 'escolas'> & {
    enredo_sinopse_url: string | null
    samba_titulo: string | null
    samba_audio_url: string | null
    samba_video_url: string | null
    samba_letra_url: string | null
    fonte_url: string | null
    noites: Pick<Noite, 'id' | 'data' | 'grupos'>
  })[]
  noticias_escolas: { noticias: Omit<Noticia, 'noticias_escolas'> }[]
}

// ---------- Consultas (funções estáveis, para o cache do useConsulta) ----------
export const consultarNoites = () =>
  supabase
    .from('noites')
    .select('id, data, grupos(nome), desfiles(ordem, horario_previsto, enredo_titulo, carnavalesco, verificado, escolas(id, nome, slug))')
    .order('data')
    .order('ordem', { referencedTable: 'desfiles' })

export const consultarNoticias = () =>
  supabase
    .from('noticias')
    .select('id, titulo, url, publicada_em, fontes(nome), noticias_escolas(escolas(id, nome, slug))')
    .order('publicada_em', { ascending: false })
    .limit(40)

export const consultarEscolas = () => supabase.from('escolas').select('id, nome, slug').order('nome')

// Uma função por slug, sempre a mesma: o useConsulta guarda o resultado por função
const consultasDeEscola = new Map<string, () => PromiseLike<{ data: unknown; error: { message: string } | null }>>()
export function consultarEscola(slug: string) {
  let consulta = consultasDeEscola.get(slug)
  if (!consulta) {
    consulta = () =>
      supabase
        .from('escolas')
        .select(`id, nome, slug, bairro, fundacao, cores, site_url, instagram_url, youtube_url, historia_md, historia_fonte_url,
          ultimo_samba_titulo, ultimo_samba_ano, ultimo_samba_spotify_url,
          desfiles(ordem, horario_previsto, enredo_titulo, enredo_sinopse_url, carnavalesco, samba_titulo, samba_audio_url,
            samba_video_url, samba_letra_url, fonte_url, verificado,
            noites(id, data, grupos(nome))),
          noticias_escolas(noticias(id, titulo, url, publicada_em, fontes(nome)))`)
        .eq('slug', slug)
        .maybeSingle()
    consultasDeEscola.set(slug, consulta)
  }
  return consulta
}

export const consultarIngressos = () =>
  supabase.from('ingressos').select('id, noite_id, setor, preco_inteira, operadora, url_compra, status').order('noite_id').order('setor')

// ---------- Formatação ----------
// `data` vem como 'AAAA-MM-DD': formatar em UTC evita voltar um dia no fuso de SP
export function formatarData(data: string, opcoes: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', ...opcoes }).format(new Date(data))
}

// "Acesso II · sáb 30/01"
export function rotuloNoite(n: Pick<Noite, 'data' | 'grupos'>) {
  const dia = formatarData(n.data, { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.,', '')
  return `${n.grupos.nome} · ${dia}`
}
