// Envia um e-mail avulso (HTML de emails/) pelo Resend, um por destinatário (ninguém vê o e-mail dos outros).
// Uso: node --env-file=.env scripts/enviar-email.mjs <arquivo.html> <destinatarios.txt> "<assunto>" [--enviar]
// Sem --enviar, só mostra quantos e-mails sairiam (ensaio). A chave fica em RESEND_API_KEY no .env (fora do git).
import { readFileSync } from 'node:fs'

const [html, lista, assunto] = process.argv.slice(2)
const enviar = process.argv.includes('--enviar')
const { RESEND_API_KEY } = process.env
if (!html || !lista || !assunto) throw new Error('Uso: enviar-email.mjs <arquivo.html> <destinatarios.txt> "<assunto>" [--enviar]')
if (!RESEND_API_KEY) throw new Error('Defina RESEND_API_KEY no .env')

const corpo = readFileSync(html, 'utf8').replace(/^<!--[\s\S]*?-->\s*/, '') // tira o comentário de cabeçalho
const destinatarios = [...new Set(readFileSync(lista, 'utf8').split(/\s+/).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)))]

console.log(`${destinatarios.length} destinatário(s), assunto: ${assunto}${enviar ? '' : ' (ensaio, nada enviado)'}`)
if (!enviar) process.exit(0)

let ok = 0
for (const para of destinatarios) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Concentra <nao-responda@concentra-carnaval.com>',
      reply_to: process.env.EMAIL_RESPOSTA || undefined, // para onde vão as respostas ("sair")
      to: [para],
      subject: assunto,
      html: corpo,
    }),
  })
  const j = await r.json().catch(() => ({}))
  if (r.ok) ok++
  else console.error(`falhou para um destinatário: ${r.status} ${j.message ?? ''}`)
  await new Promise((res) => setTimeout(res, 600)) // o plano grátis aceita 2 por segundo
}
console.log(`${ok} de ${destinatarios.length} enviado(s)`)
