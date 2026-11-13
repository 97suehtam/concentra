import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

// Navegação por hash (#/grade): basta para poucas telas e funciona em hospedagem estática.
// A página da escola leva o slug junto: #/escola/vai-vai
//
// A troca de tela passa por transicao(): com a View Transitions API (Chrome, Safari 18+) a tela
// desliza conforme a direção (abrir escola = frente, voltar = volta, abas = lado). Sem a API,
// ou com "reduzir movimento", a troca é direta. A rolagem de cada tela é lembrada para a volta.
export const ROTAS = ['desfiles', 'grade', 'noticias', 'ingressos', 'chegar', 'perfil', 'escola', 'galera', 'privacidade'] as const
export type Rota = (typeof ROTAS)[number]
export type Transicao = 'frente' | 'volta' | 'lado' | 'noite-frente' | 'noite-volta'

type DocumentoComTransicao = Document & {
  startViewTransition?: (mudar: () => void) => { ready: Promise<void>; finished: Promise<void> }
}

export const temTransicao = typeof document !== 'undefined' && 'startViewTransition' in document

let hash = window.location.hash
const ouvintes = new Set<() => void>()
const rolagem = new Map<string, number>()
window.history.scrollRestoration = 'manual'

function partes() {
  return hash.replace(/^#\/?/, '').split('/')
}

function rotaAtual(): Rota {
  const [r, slug] = partes() as [Rota, string?]
  if (r === 'escola') return slug ? 'escola' : 'desfiles'
  return ROTAS.includes(r) ? r : 'desfiles'
}

const assinar = (ouvinte: () => void) => {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export function useRota() {
  return useSyncExternalStore(assinar, rotaAtual)
}

// Slug da escola aberta (só faz sentido na rota 'escola')
export function useSlugEscola() {
  return useSyncExternalStore(assinar, () => (partes()[0] === 'escola' ? decodeURIComponent(partes()[1] ?? '') : ''))
}

// Roda `mudar` dentro de uma View Transition. `data-transicao` no <html> diz ao CSS qual animação usar
// (e fica até a próxima troca: a cascata das listas não se repete ao voltar).
export function transicao(tipo: Transicao, mudar: () => void) {
  document.documentElement.dataset.transicao = tipo
  const doc = document as DocumentoComTransicao
  if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return mudar()
  // A transição só chama `mudar` no próximo quadro pintado. Se a página não pinta (aba em segundo
  // plano, app minimizado no meio do toque), a troca ficaria pendurada: depois de 400 ms ela é aplicada
  // direto, e a chamada atrasada da transição vira inofensiva.
  let feito = false
  const umaVez = () => { if (!feito) { feito = true; mudar() } }
  const reserva = window.setTimeout(umaVez, 400)
  const vt = doc.startViewTransition(() => { window.clearTimeout(reserva); umaVez() })
  // Duas trocas seguidas (toque duplo) fazem o navegador pular a primeira transição. A troca em si
  // acontece igual; só as promessas rejeitam, e sem estes catch viram erro vermelho no console.
  vt.ready.catch(() => {})
  vt.finished.catch(() => {})
}

// Troca de tela: o React renderiza na hora (flushSync) e só então a rolagem é ajustada,
// para a View Transition capturar a tela nova já no lugar certo
function aplicar(novo: string, restaurar: boolean) {
  hash = novo
  flushSync(() => ouvintes.forEach((o) => o()))
  window.scrollTo(0, restaurar ? (rolagem.get(novo) ?? 0) : 0)
}

// A tela só troca dentro da transição (um quadro depois do toque). Para toques rápidos e "voltar"
// no meio do caminho não se atropelarem:
// - `pedido`: destino ainda não aplicado (comparar só com `hash` ignoraria o último toque);
// - a URL muda na hora do toque, então o voltar do navegador sempre sabe onde a pessoa está;
// - `geracao`: cada troca tem um número; se outra troca ou um "voltar" vier antes, a antiga é descartada.
let pedido: string | null = null
let geracao = 0

function navegar(novo: string, tipo: Transicao) {
  if (novo === (pedido ?? hash)) {
    if (!pedido) window.scrollTo({ top: 0, behavior: 'smooth' }) // tocar na aba atual sobe a tela
    return
  }
  if (!pedido) rolagem.set(hash, window.scrollY)
  pedido = novo
  const minha = ++geracao
  window.history.pushState(null, '', novo)
  transicao(tipo, () => {
    if (minha !== geracao) return
    pedido = null
    aplicar(novo, false)
  })
}

export function irPara(rota: Exclude<Rota, 'escola'>) {
  navegar(`#/${rota}`, 'lado')
}

export function irParaEscola(slug: string) {
  navegar(`#/escola/${encodeURIComponent(slug)}`, 'frente')
}

// Troca a URL sem criar histórico (ex.: limpar o #error=... do link mágico)
export function substituirRota(novo: string) {
  window.history.replaceState(null, '', window.location.pathname + novo)
  hash = novo
  ouvintes.forEach((o) => o())
}

// Botão voltar do navegador/celular (e o history.back() do botão "Voltar").
// O hashchange chega logo depois do popstate, antes da transição começar: `destino` evita aplicar duas vezes.
let destino: string | null = null
window.addEventListener('popstate', (e) => {
  // Voltar cancela qualquer troca ainda não aplicada (e tem o seu próprio número)
  const minha = ++geracao
  pedido = null
  if (window.location.hash === hash) return
  rolagem.set(hash, window.scrollY)
  const novo = (destino = window.location.hash)
  // Gesto de voltar do iPhone/Android: o navegador já animou a troca. Animar de novo daria um "slide duplo".
  if ((e as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition) {
    document.documentElement.dataset.transicao = 'volta'
    destino = null
    return aplicar(novo, true)
  }
  transicao('volta', () => {
    destino = null
    if (minha === geracao) aplicar(novo, true)
  })
})

// Hash editado à mão na barra de endereço
window.addEventListener('hashchange', () => {
  if (window.location.hash !== hash && window.location.hash !== destino) aplicar(window.location.hash, false)
})
