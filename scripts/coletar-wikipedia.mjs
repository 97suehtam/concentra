// Coleta, para cada escola, a página da Wikipedia PT e os dados estruturados do Wikidata
// (fundação, site oficial, Instagram, YouTube). Grava wikipedia-escolas.json para revisão:
// nada vai para o banco sem aprovação. O texto da Wikipedia (CC BY-SA) serve de base
// para um resumo autoral; a página fica como fonte em historia_fonte_url.
//
// Uso: npm run wikipedia   (lê as escolas com a chave publicável)
import { writeFileSync } from 'node:fs'
import { sleep } from './comum.mjs'

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env
const UA = 'ConcentraCarnavalSP/0.1 (https://concentra-carnaval.com; 97suehtam@gmail.com)'

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

const escolas = await (await fetch(`${SUPABASE_URL}/rest/v1/escolas?select=id,nome,slug&order=id`, {
  headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
})).json()

const WP = 'https://pt.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*'
const GENERICAS = /^(Lista|Carnaval|Liga|Escola de samba$|Resultados)/

// Pega o valor de uma propriedade do Wikidata (o primeiro, ou só o preferido)
function valor(claims, prop) {
  const lista = claims?.[prop] ?? []
  const c = lista.find((x) => x.rank === 'preferred') ?? lista.find((x) => x.rank !== 'deprecated')
  const v = c?.mainsnak?.datavalue?.value
  if (v == null) return null
  if (typeof v === 'string') return v
  if (v.time) return v.time.replace(/^\+/, '').slice(0, 10) // "+1950-01-01T00:00:00Z"
  if (v.id) return v.id
  return null
}

const saida = []
for (const e of escolas) {
  // 1) Título exato: "Nome (escola de samba)" e depois "Nome" (sem desambiguação)
  // 2) Senão, a busca, descartando listas e páginas genéricas
  let titulo = null
  for (const tentativa of [`${e.nome} (escola de samba)`, e.nome]) {
    const q = await json(`${WP}&action=query&redirects=1&prop=pageprops&titles=${encodeURIComponent(tentativa)}`)
    const p = q.query.pages[0]
    if (!p.missing && p.pageprops?.disambiguation === undefined) { titulo = p.title; break }
  }
  const busca = await json(`${WP}&action=query&list=search&srlimit=5&srsearch=${encodeURIComponent(`${e.nome} escola de samba São Paulo`)}`)
  const candidatos = busca.query.search.map((s) => s.title)
  titulo ??= candidatos.find((t) => !GENERICAS.test(t)) ?? null

  let pagina = null
  if (titulo) {
    const q = await json(`${WP}&action=query&prop=extracts|pageprops|info&inprop=url&explaintext=1&exsectionformat=plain&redirects=1&titles=${encodeURIComponent(titulo)}`)
    const p = q.query.pages[0]
    pagina = { titulo: p.title, url: p.fullurl, wikidata: p.pageprops?.wikibase_item ?? null, texto: (p.extract ?? '').slice(0, 6000) }
  }

  let wikidata = null
  if (pagina?.wikidata) {
    const w = await json(`https://www.wikidata.org/wiki/Special:EntityData/${pagina.wikidata}.json`)
    const claims = w.entities[pagina.wikidata].claims
    wikidata = {
      fundacao: valor(claims, 'P571'),
      site: valor(claims, 'P856'),
      instagram: valor(claims, 'P2003'),
      youtube: valor(claims, 'P2397'),
    }
  }

  saida.push({ id: e.id, nome: e.nome, slug: e.slug, candidatos, pagina, wikidata })
  console.log(`${e.nome} → ${pagina?.titulo ?? '(nada)'}${wikidata?.site ? ` · ${wikidata.site}` : ''}`)
  await sleep(300) // educado com a API
}

writeFileSync('wikipedia-escolas.json', JSON.stringify(saida, null, 2))
console.log(`\n${saida.length} escolas em wikipedia-escolas.json`)
