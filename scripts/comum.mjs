// comum.mjs — utilitários compartilhados pelos scripts de coleta

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Desfaz entidades HTML (títulos de feed, href de <link>)
export const decodificarEntidades = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&'); // por último, para não decodificar duas vezes

// Minúsculas, sem acento e sem pontuação: "Vai-Vai" → "vai vai", "X-9" → "x 9"
export const normalizar = (s) => s
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
