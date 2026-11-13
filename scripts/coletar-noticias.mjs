#!/usr/bin/env node
// coletar-noticias.mjs — lê os endpoints confirmados em `fontes`, coleta as notícias
// e grava em `noticias`, associando às escolas citadas em `noticias_escolas`.
//
// Copyright: guarda só título, URL e data. O `resumo` fica vazio para ser escrito
// à mão (resumo autoral); o texto e a descrição da matéria nunca são salvos.
//
// Uso (Node 20.6+ por causa do --env-file):
//   node --env-file=.env scripts/coletar-noticias.mjs --dry-run   # lê com a chave pública, grava noticias-coletadas.json
//   node --env-file=.env scripts/coletar-noticias.mjs             # grava no Supabase (precisa da service role key)

import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';
import { sleep, decodificarEntidades, normalizar } from './comum.mjs';

const DRY = process.argv.includes('--dry-run');
const UA = 'CarnavalSP-App/0.1 (projeto pessoal; coletor de notícias)';
const TIMEOUT_MS = 15_000;
const PAUSA_MS = 500;
const POR_PAGINA = 20; // substitui o per_page=5 do endpoint de teste

// Fontes que misturam outros carnavais (sobretudo o Rio): só entra notícia
// que cite uma escola de SP ou o carnaval paulistano.
const FILTRAR_SP = new Set(['Canal do Carnaval', 'Metrópoles SP']);
const CONTEXTO_SP = /\b(carnaval (de )?(sp|sao paulo)|carnaval paulist\w*|anhembi|liga ?sp|samba paulist\w*)\b/;

// Como cada escola aparece nos títulos. O nome oficial já entra automaticamente;
// aqui vão só apelidos que não colidem com escolas de outras cidades
// (por isso não há "Mocidade", "Imperatriz" ou "Unidos" soltos).
const APELIDOS = {
  'vai-vai': ['vai vai'],
  'barroca-zona-sul': ['barroca'],
  'camisa-verde-e-branco': ['camisa verde'],
  'gavioes-da-fiel': ['gavioes'],
  'estrela-do-terceiro-milenio': ['terceiro milenio'],
  'x-9-paulistana': ['x 9', 'x9'],
  'dom-bosco-de-itaquera': ['dom bosco'],
  'unidos-do-peruche': ['peruche'],
  'nene-de-vila-matilde': ['nene'],
};

// ---------- Supabase ----------
const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const chave = DRY ? (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY) : SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !chave) {
  console.error(DRY
    ? 'Defina SUPABASE_URL e SUPABASE_ANON_KEY (veja o .env).'
    : 'Para gravar, defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou rode com --dry-run).');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, chave, { auth: { persistSession: false } });

const { data: fontes, error: errFontes } = await sb
  .from('fontes')
  .select('id, nome, metodo_coleta, endpoint')
  .eq('ativo', true)
  .in('metodo_coleta', ['wp_rest', 'rss'])
  .not('endpoint', 'is', null)
  .order('id');
const { data: escolas, error: errEscolas } = await sb.from('escolas').select('id, nome, slug');
if (errFontes || errEscolas) {
  console.error('Erro lendo o Supabase:', (errFontes || errEscolas).message);
  process.exit(1);
}

const padroesEscola = escolas.map((e) => ({
  id: e.id,
  slug: e.slug,
  termos: [normalizar(e.nome), ...(APELIDOS[e.slug] || [])],
}));

// Casa termos como palavras inteiras ("nene" não pega "nenem")
function escolasCitadas(texto) {
  const t = ` ${normalizar(texto)} `;
  return padroesEscola.filter((p) => p.termos.some((termo) => t.includes(` ${termo} `)));
}

// ---------- Coleta ----------
async function get(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json, application/rss+xml, application/xml;q=0.9' },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Tira parâmetros de rastreio e o fragmento, para a URL servir de chave única
function limparUrl(u) {
  const url = new URL(u);
  url.hash = '';
  for (const p of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/.test(p)) url.searchParams.delete(p);
  return url.href;
}

const limparTexto = (s) => decodificarEntidades(s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '')).trim();

async function lerWpRest(endpoint) {
  const url = new URL(endpoint);
  url.searchParams.set('per_page', String(POR_PAGINA));
  url.searchParams.set('_fields', 'link,title,date_gmt');
  const posts = JSON.parse(await get(url.href));
  return posts.map((p) => ({
    titulo: limparTexto(p.title.rendered),
    url: p.link,
    publicada_em: p.date_gmt ? `${p.date_gmt}Z` : null,
    categorias: [],
  }));
}

async function lerRss(endpoint) {
  const xml = await get(endpoint);
  return [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map(([item]) => {
    const tag = (nome) => item.match(new RegExp(`<${nome}[^>]*>([\\s\\S]*?)</${nome}>`, 'i'))?.[1];
    const data = tag('pubDate');
    return {
      titulo: limparTexto(tag('title') || ''),
      url: limparTexto(tag('link') || ''),
      publicada_em: data ? new Date(data).toISOString() : null,
      // As categorias do RSS ajudam a achar a escola quando o título não a cita
      categorias: [...item.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) => limparTexto(m[1])),
    };
  });
}

const coletadas = [];
const resumoFontes = [];
for (const f of fontes) {
  process.stdout.write(`→ ${f.nome} ... `);
  let itens;
  try {
    itens = f.metodo_coleta === 'wp_rest' ? await lerWpRest(f.endpoint) : await lerRss(f.endpoint);
  } catch (e) {
    console.log(`falhou (${e.name === 'TimeoutError' ? 'timeout' : e.message})`);
    resumoFontes.push({ fonte: f.nome, lidas: 0, mantidas: 0, com_escola: 0, erro: e.message });
    continue;
  }

  let mantidas = 0, comEscola = 0;
  for (const it of itens) {
    if (!it.titulo || !it.url) continue;
    const texto = [it.titulo, ...it.categorias].join(' | ');
    const citadas = escolasCitadas(texto);
    if (FILTRAR_SP.has(f.nome) && !citadas.length && !CONTEXTO_SP.test(` ${normalizar(texto)} `)) continue;

    coletadas.push({
      fonte_id: f.id,
      fonte: f.nome,
      titulo: it.titulo,
      url: limparUrl(it.url),
      publicada_em: it.publicada_em,
      escolas: citadas.map((c) => ({ id: c.id, slug: c.slug })),
    });
    mantidas++;
    if (citadas.length) comEscola++;
  }
  resumoFontes.push({ fonte: f.nome, lidas: itens.length, mantidas, com_escola: comEscola });
  console.log(`${mantidas}/${itens.length} mantidas`);
  await sleep(PAUSA_MS);
}

// A mesma matéria pode vir de duas fontes; fica a primeira
const porUrl = new Map();
for (const n of coletadas) if (!porUrl.has(n.url)) porUrl.set(n.url, n);
const noticias = [...porUrl.values()];

console.table(resumoFontes);
await writeFile('noticias-coletadas.json', JSON.stringify(noticias, null, 2));
console.log(`${noticias.length} notícias únicas → noticias-coletadas.json`);

if (DRY) {
  console.log('dry-run: nada gravado no Supabase.');
  process.exit(0);
}

// ---------- Gravação ----------
// Upsert por URL: rodar de novo atualiza título/data e não duplica.
// `resumo` não é enviado, então o que já foi escrito à mão é preservado.
const { data: gravadas, error: errNoticias } = await sb
  .from('noticias')
  .upsert(noticias.map(({ fonte_id, titulo, url, publicada_em }) => ({ fonte_id, titulo, url, publicada_em })),
    { onConflict: 'url' })
  .select('id, url');
if (errNoticias) {
  console.error('✗ noticias:', errNoticias.message);
  process.exit(1);
}

const idPorUrl = new Map(gravadas.map((g) => [g.url, g.id]));
const vinculos = noticias.flatMap((n) => n.escolas.map((e) => ({ noticia_id: idPorUrl.get(n.url), escola_id: e.id })));
if (vinculos.length) {
  const { error } = await sb.from('noticias_escolas')
    .upsert(vinculos, { onConflict: 'noticia_id,escola_id', ignoreDuplicates: true });
  if (error) console.error('✗ noticias_escolas:', error.message);
}

const coletaOk = resumoFontes.filter((r) => !r.erro).map((r) => r.fonte);
const { error: errFonte } = await sb.from('fontes')
  .update({ ultima_coleta: new Date().toISOString() })
  .in('nome', coletaOk);
if (errFonte) console.error('✗ fontes.ultima_coleta:', errFonte.message);

console.log(`✓ ${gravadas.length} notícias gravadas, ${vinculos.length} vínculos com escolas.`);
