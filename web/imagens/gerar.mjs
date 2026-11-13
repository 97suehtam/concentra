// Gera os PNG de public/. Rode de dentro de web/: node imagens/gerar.mjs
// - Ícones: direto do SVG com o resvg (tamanho exato, sem navegador).
// - og.png: o HTML tem fontes e emojis, então é fotografado pelo Edge (ou Chrome) em modo headless.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const pasta = import.meta.dirname
const saida = path.resolve(pasta, '../public')

// ---------- Ícones ----------
const icone = readFileSync(path.join(pasta, 'icone.svg'), 'utf8')
for (const [png, lado] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  const imagem = new Resvg(icone, { fitTo: { mode: 'width', value: lado } }).render().asPng()
  writeFileSync(path.join(saida, png), imagem)
  console.log(`public/${png} (${lado}x${lado})`)
}

// ---------- Imagem de compartilhamento ----------
const NAVEGADORES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
]
const navegador = NAVEGADORES.find(existsSync)
if (!navegador) throw new Error('Edge ou Chrome não encontrado')

const og = path.join(saida, 'og.png')
rmSync(og, { force: true })
execFileSync(navegador, [
  '--headless=new',
  // Perfil novo a cada vez: com um perfil já em uso (o seu Edge aberto, ou um headless
  // que ficou de uma rodada anterior), o Edge repassa a chamada e não gera nada
  `--user-data-dir=${mkdtempSync(path.join(os.tmpdir(), 'concentra-imagens-'))}`,
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--virtual-time-budget=3000', // espera as fontes carregarem
  '--window-size=1200,630',
  `--screenshot=${og}`,
  pathToFileURL(path.join(pasta, 'og.html')).href,
], { stdio: 'ignore' })
// No Windows o msedge.exe pode devolver o controle antes de gravar: espera até 20 s
const limite = Date.now() + 20_000
while (!existsSync(og) && Date.now() < limite) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250)
if (!existsSync(og)) throw new Error('O navegador não gerou o og.png. Rode de novo.')
console.log('public/og.png (1200x630)')
