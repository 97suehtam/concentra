#!/usr/bin/env node
// testar-fontes.mjs — descobre e testa feeds/APIs das fontes do Carnaval SP
// e grava o melhor endpoint de cada uma na tabela `fontes` do Supabase.
//
// Uso:
//   npm i @supabase/supabase-js
//   node testar-fontes.mjs --dry-run        # só testa e gera relatorio-fontes.json
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node testar-fontes.mjs
//
// Requer Node 18+.

import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';
import { sleep, decodificarEntidades } from './comum.mjs';

const DRY = process.argv.includes('--dry-run');
const UA = 'CarnavalSP-App/0.1 (projeto pessoal; teste de feeds)';
const TIMEOUT_MS = 12_000;
const PAUSA_MS = 500; // educado com os servidores

// `nome` precisa bater com a tabela fontes. Candidatos são palpites;
// a descoberta automática (Link header do WP + <link rel="alternate">) completa.
const FONTES = [
  { nome: 'Liga-SP', url: 'https://ligasp.com.br/',
    candidatos: ['/wp-json/wp/v2/posts?per_page=5', '/feed/'] },
  { nome: 'SASP – Central do Carnaval 2027', url: 'https://sasp.com.br/',
    candidatos: ['/wp-json/wp/v2/posts?per_page=5', '/feed/'] },
  // O caminho público é /blog/..., mas o feed da categoria fica em /category/...
  // robots.txt bloqueia /wp-json/, então só RSS.
  { nome: 'SRzd – Carnaval SP', url: 'https://srzd.com/blog/carnaval/sao-paulo/',
    candidatos: ['/category/carnaval/sao-paulo/feed/'] },
  { nome: 'Canal do Carnaval', url: 'https://canaldocarnaval.com.br/',
    candidatos: ['/wp-json/wp/v2/posts?per_page=5', '/feed/'] },
  // /sao-paulo/feed é noticiário geral da cidade. A tag carnaval é nacional (muito Rio),
  // então o coletor precisa filtrar por nome de escola. robots.txt bloqueia /wp-json/.
  { nome: 'Metrópoles SP', url: 'https://www.metropoles.com/sao-paulo',
    candidatos: ['/tag/carnaval/feed'] },
  { nome: 'Wikipedia PT', url: 'https://pt.wikipedia.org/',
    candidatos: ['/w/api.php?action=query&list=search&srsearch=Carnaval%20de%20S%C3%A3o%20Paulo&srlimit=5&format=json'] },
];


async function get(url) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'application/json, application/rss+xml, application/atom+xml, application/xml, text/html;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, headers: res.headers, body, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === 'TimeoutError' ? 'timeout' : e.message, ms: Date.now() - t0 };
  }
}

// Descobre endpoints a partir da home: REST do WordPress e feeds RSS/Atom anunciados no HTML
async function descobrir(url) {
  const r = await get(url);
  const achados = [];
  if (!r.ok) return { status: r.status, erro: r.error, achados };

  const link = r.headers.get('link') || '';
  const wp = link.match(/<([^>]+)>;\s*rel="https:\/\/api\.w\.org\/"/);
  if (wp) {
    const raiz = wp[1];
    achados.push(raiz.includes('rest_route=')
      ? raiz.replace(/rest_route=\/?$/, 'rest_route=/wp/v2/posts') + '&per_page=5'
      : new URL('wp/v2/posts?per_page=5', raiz.endsWith('/') ? raiz : raiz + '/').href);
  }

  for (const m of r.body.matchAll(/<link[^>]+>/gi)) {
    const tag = m[0];
    if (/rel=["']alternate["']/i.test(tag) && /type=["']application\/(rss|atom)\+xml["']/i.test(tag)) {
      const href = tag.match(/href=["']([^"']+)["']/i);
      // href vem do HTML: desfazer entidades antes de montar a URL (&amp; → &)
      if (href) achados.push(new URL(decodificarEntidades(href[1]), url).href);
    }
  }
  return { status: r.status, wordpress: Boolean(wp), achados };
}

function classificar(r) {
  if (!r.ok) return { tipo: 'falha', detalhe: r.error || `HTTP ${r.status}` };
  const ct = r.headers.get('content-type') || '';
  const b = r.body.trimStart();

  if (ct.includes('json') || b.startsWith('[') || b.startsWith('{')) {
    try {
      const j = JSON.parse(b);
      if (Array.isArray(j) && j[0]?.date && j[0]?.link)
        return { tipo: 'wp_rest', itens: j.length, maisRecente: j[0].date, exemplo: j[0].title?.rendered };
      if (j?.query?.search)
        return { tipo: 'mediawiki_api', itens: j.query.search.length, exemplo: j.query.search[0]?.title };
      return { tipo: 'json_desconhecido' };
    } catch {
      return { tipo: 'falha', detalhe: 'JSON inválido' };
    }
  }

  if (/^<\?xml|^<rss|^<feed/i.test(b) || ct.includes('xml')) {
    const itens = (b.match(/<item[\s>]|<entry[\s>]/gi) || []).length;
    const data = b.match(/<pubDate>([^<]+)<\/pubDate>|<updated>([^<]+)<\/updated>/i);
    const titulo = b.match(/<(?:item|entry)[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    return { tipo: 'rss', itens, maisRecente: data?.[1] || data?.[2], exemplo: titulo?.[1]?.trim() };
  }

  return { tipo: 'html', detalhe: 'Respondeu HTML, não é feed' };
}

// Preferência: REST do WP (mais rico: categorias, tags, mídia) > MediaWiki > RSS
const PRIORIDADE = { wp_rest: 0, mediawiki_api: 1, rss: 2 };

const relatorio = [];
for (const f of FONTES) {
  process.stdout.write(`→ ${f.nome} ... `);
  const desc = await descobrir(f.url);
  const urls = [...new Set([...f.candidatos.map((c) => new URL(c, f.url).href), ...desc.achados])];

  const testes = [];
  for (const u of urls) {
    const r = await get(u);
    testes.push({ url: u, ms: r.ms, ...classificar(r) });
    await sleep(PAUSA_MS);
  }

  const melhor = testes
    .filter((t) => t.tipo in PRIORIDADE && t.itens > 0)
    .sort((a, b) => PRIORIDADE[a.tipo] - PRIORIDADE[b.tipo])[0] || null;

  relatorio.push({ nome: f.nome, home: desc, testes, melhor });
  console.log(melhor ? `${melhor.tipo} ✓` : 'sem feed (scraping/manual)');
}

console.table(relatorio.map((r) => ({
  fonte: r.nome,
  home: r.home.status || r.home.erro,
  wordpress: r.home.wordpress ? 'sim' : 'não',
  metodo: r.melhor?.tipo ?? 'scraping',
  itens: r.melhor?.itens ?? 0,
  mais_recente: r.melhor?.maisRecente ?? '—',
})));

await writeFile('relatorio-fontes.json', JSON.stringify(relatorio, null, 2));
console.log('Relatório completo: relatorio-fontes.json');

if (DRY) {
  console.log('dry-run: nada gravado no Supabase.');
  process.exit(0);
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou rode com --dry-run).');
  process.exit(1);
}

// Service role: a tabela fontes só tem policy de leitura pública
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const agora = new Date().toISOString();

for (const r of relatorio) {
  const { data, error } = await sb
    .from('fontes')
    .update({
      metodo_coleta: r.melhor?.tipo ?? 'scraping',
      endpoint: r.melhor?.url ?? null,
      ultimo_teste: { home: r.home, testes: r.testes },
      ultimo_teste_em: agora,
    })
    .eq('nome', r.nome)
    .select('id');

  if (error) console.error(`✗ ${r.nome}: ${error.message}`);
  else if (!data.length) console.warn(`! ${r.nome}: não existe na tabela fontes`);
  else console.log(`✓ ${r.nome} atualizada`);
}
