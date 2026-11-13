import { inject, pageview, type BeforeSendEvent } from '@vercel/analytics'

// Métricas de uso pelo Vercel Web Analytics: visitas, telas mais vistas, origem (LinkedIn, WhatsApp...),
// país, aparelho e navegador. Sem cookies e sem dado pessoal (não pede consentimento). Só em produção.
//
// O app navega por hash (#/escola/vai-vai), que o script da Vercel não enxerga: a contagem automática
// fica desligada e cada troca de tela é enviada aqui como página (/escola/vai-vai).
const ligado = import.meta.env.PROD
let ultima = ''

// Nunca manda o hash nem a query: o link mágico do login volta com #access_token=... na URL
function limpar(evento: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(evento.url)
  url.hash = ''
  url.search = ''
  return { ...evento, url: url.toString() }
}

export function iniciarMetricas() {
  if (ligado) inject({ disableAutoTrack: true, beforeSend: limpar })
}

export function registrarTela(rota: string, slug: string) {
  const path = rota === 'escola' ? `/escola/${slug}` : `/${rota}`
  if (!ligado || path === ultima) return
  ultima = path
  // route agrupa todas as escolas numa linha só no painel; path mostra cada uma
  pageview({ route: rota === 'escola' ? '/escola/[slug]' : path, path })
}
