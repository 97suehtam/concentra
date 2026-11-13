// Gera sql/006_historia_escolas.sql a partir da curadoria (scripts/dados/historia-escolas.mjs)
// e das páginas encontradas por npm run wikipedia (wikipedia-escolas.json).
import { readFileSync, writeFileSync } from 'node:fs'
import { HISTORIA } from './dados/historia-escolas.mjs'

const wikipedia = JSON.parse(readFileSync('wikipedia-escolas.json', 'utf8'))
const fonte = Object.fromEntries(wikipedia.map((e) => [e.slug, e.pagina?.url ?? null]))

const texto = (v) => (v == null ? 'null' : `'${String(v).replaceAll("'", "''")}'`)
const lista = (v) => (v?.length ? `array[${v.map(texto).join(', ')}]` : 'null')

const linhas = Object.entries(HISTORIA).map(([slug, h]) =>
  `  (${texto(slug)}, ${h.fundacao ? `date ${texto(h.fundacao)}` : 'null::date'}, ${texto(h.bairro ?? null)}, ${lista(h.cores)}::text[], ` +
  `${texto(h.site ?? null)}, ${texto(h.historia)}, ${h.historia ? texto(fonte[slug]) : 'null'})`)

const sql = `-- "Sobre a escola": resumos autorais a partir da Wikipedia PT (CC BY-SA), com a página como fonte.
-- Gerado por scripts/gerar-sql-historia.mjs em ${new Date().toISOString().slice(0, 10)}. Só preenche o que está vazio
-- (coalesce), para não apagar nada curado à mão depois.
update escolas e set
  fundacao           = coalesce(e.fundacao, v.fundacao),
  bairro             = coalesce(e.bairro, v.bairro),
  cores              = coalesce(e.cores, v.cores),
  site_url           = coalesce(e.site_url, v.site),
  historia_md        = coalesce(e.historia_md, v.historia),
  historia_fonte_url = coalesce(e.historia_fonte_url, v.fonte)
from (values
${linhas.join(',\n')}
) as v(slug, fundacao, bairro, cores, site, historia, fonte)
where e.slug = v.slug;
`
writeFileSync('sql/006_historia_escolas.sql', sql)
console.log(`sql/006_historia_escolas.sql: ${linhas.length} escolas`)
