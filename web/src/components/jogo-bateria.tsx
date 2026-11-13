import { Share2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { desbloquear } from '@/hooks/use-perfil'
import { NOME_APP } from '@/lib/app'
import { criarArmazenamento } from '@/lib/armazenamento'
import { SomDaBateria } from '@/lib/bateria-som'
import {
  COMPASSO, CONTAGEM, SEMICOLCHEIA, formatarNota, montarPartitura, notaDaApuracao, type Nota, type Pista, type Trecho,
} from '@/lib/bateria-ritmo'
import { soltarConfete } from '@/lib/confete'
import { cn } from '@/lib/utils'

// "Assume a Bateria": jogo de ritmo de ~1 minuto. As batidas caem nas três pistas
// (surdo, caixa, tamborim) e a pessoa toca quando chegam na linha. Na paradinha,
// a bateria para: quem tocar perde o combo. No fim, a nota sai no estilo da apuração.

export const recordeBateria = criarArmazenamento<{ nota: number | null; pontos: number }>('concentra:bateria', { nota: null, pontos: 0 })

const PISTAS = [
  { nome: 'Surdo', cor: '--lima', tecla: ['a', 'j', 'arrowleft'] },
  { nome: 'Caixa', cor: '--rosa', tecla: ['s', 'k', 'arrowdown'] },
  { nome: 'Tamborim', cor: '--ceu', tecla: ['d', 'l', 'arrowright'] },
] as const

const JANELA_PERFEITO = 0.05
const JANELA_BOM = 0.12
const ANTECEDENCIA = 1.5 // segundos que a nota leva do topo até a linha

type Resultado = { nota: number; pontos: number; precisao: number; comboMax: number; paradinhaLimpa: boolean; recorde: boolean }

export function JogoBateria({ aoFechar }: { aoFechar: () => void }) {
  const [fase, setFase] = useState<'pronto' | 'jogando' | 'fim'>('pronto')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [placar, setPlacar] = useState({ pontos: 0, combo: 0 })
  const canvas = useRef<HTMLCanvasElement>(null)
  const jogo = useRef<ReturnType<typeof criarJogo> | null>(null)

  const terminar = useCallback((r: Omit<Resultado, 'recorde'>) => {
    const anterior = recordeBateria.atual()
    const recorde = r.pontos > anterior.pontos
    if (recorde) recordeBateria.definir({ nota: r.nota, pontos: r.pontos })
    setResultado({ ...r, recorde })
    setFase('fim')
    if (r.nota === 10) {
      soltarConfete(null, { quantidade: 30, emojis: ['🔟', '🥁', '🎉', '✨'] })
      desbloquear('nota-dez')
    }
    if (r.paradinhaLimpa) desbloquear('paradinha')
  }, [])

  function comecar() {
    if (!canvas.current) return
    jogo.current?.parar()
    setPlacar({ pontos: 0, combo: 0 })
    jogo.current = criarJogo(canvas.current, { aoPlacar: setPlacar, aoTerminar: terminar })
    setFase('jogando')
  }

  function fechar() {
    jogo.current?.parar()
    jogo.current = null
    aoFechar()
  }

  // Teclado no computador: A S D (ou J K L, ou setas); Esc fecha
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') return fechar()
      if (e.repeat) return
      const pista = PISTAS.findIndex((p) => (p.tecla as readonly string[]).includes(e.key.toLowerCase()))
      if (pista >= 0) { e.preventDefault(); jogo.current?.tocar(pista as Pista) }
    }
    window.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', tecla)
      document.body.style.overflow = ''
      jogo.current?.parar()
    }
    // fechar muda a cada render, mas só lê refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function compartilhar() {
    if (!resultado) return
    const texto = `Tirei nota ${formatarNota(resultado.nota)} comandando a bateria no ${NOME_APP} 🥁 Duvido você! https://concentra-carnaval.com`
    try {
      if (navigator.share) await navigator.share({ text: texto })
      else { await navigator.clipboard.writeText(texto); toast('Copiado! Cola no grupo 📋') }
    } catch { /* cancelou */ }
  }

  // Portal no <body>: o <main> é uma camada própria (view-transition-name) e prenderia o z-50 dentro
  // dela, deixando o menu de baixo por cima dos botões do jogo
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-modal="true" aria-label="Jogo Assume a Bateria">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-heading text-lg font-bold">Assume a Bateria</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {placar.pontos.toLocaleString('pt-BR')} pts · combo {placar.combo}
            </p>
          </div>
          <Button size="icon" variant="secondary" className="rounded-full" onClick={fechar} aria-label="Sair do jogo">
            <X />
          </Button>
        </div>

        <div className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-[2rem] bg-card ring-1 ring-border">
          <canvas ref={canvas} className="absolute inset-0 size-full" aria-hidden="true" />

          {fase === 'pronto' && (
            <div className="absolute inset-0 flex flex-col items-center gap-3 overflow-y-auto bg-card/95 p-6 text-center [justify-content:safe_center]">
              <span className="text-5xl" aria-hidden="true">🥁</span>
              <h2 className="text-2xl font-bold">O mestre te chamou!</h2>
              <ul className="flex max-w-72 flex-col gap-1.5 text-sm text-muted-foreground">
                <li>Toque cada instrumento quando a batida chegar na linha.</li>
                <li>🤫 Quando o apito tocar comprido, é <b className="text-foreground">paradinha</b>: não toque nada!</li>
                <li>Bater fora do tempo atravessa o samba e zera o combo.</li>
                <li>Depois da paradinha, cada acerto vale em dobro.</li>
              </ul>
              <Button size="lg" className="mt-2 h-12 rounded-full px-8" onClick={comecar}>Bora!</Button>
              <p className="text-xs text-muted-foreground">🔔 Tira o celular do modo silencioso e aumenta o som · no computador: A S D</p>
            </div>
          )}

          {fase === 'fim' && resultado && (
            <div className="absolute inset-0 flex flex-col items-center gap-3 overflow-y-auto bg-card/95 p-6 text-center animate-in fade-in zoom-in-95 [justify-content:safe_center]">
              <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Quesito bateria</p>
              <p className={cn('font-heading text-7xl font-bold', resultado.nota === 10 ? 'text-lima' : 'text-foreground')}>
                {formatarNota(resultado.nota)}
              </p>
              <p className="text-lg font-bold">
                {resultado.nota === 10 ? 'Dez! Nota dez! 🔟' : resultado.nota >= 9.8 ? 'Quase perfeito!' : resultado.nota >= 9.5 ? 'Segurou o ritmo!' : 'Bora pro ensaio técnico 😅'}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {resultado.pontos.toLocaleString('pt-BR')} pts · {Math.round(resultado.precisao * 100)}% de acerto · combo máx. {resultado.comboMax}
              </p>
              {resultado.recorde && <p className="rounded-full bg-amarelo px-3 py-1 text-sm font-bold text-tinta">🏆 Novo recorde!</p>}
              {resultado.paradinhaLimpa && <p className="text-sm">🤫 Paradinha perfeita</p>}
              <div className="mt-2 flex gap-2">
                <Button size="lg" className="h-12 rounded-full px-6" onClick={comecar}>De novo</Button>
                <Button size="lg" variant="secondary" className="h-12 rounded-full px-5" onClick={compartilhar}>
                  <Share2 data-icon="inline-start" /> Desafiar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Os pads ficam embaixo, onde o polegar alcança */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PISTAS.map((p, i) => (
            <button
              key={p.nome}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); jogo.current?.tocar(i as Pista) }}
              disabled={fase !== 'jogando'}
              className="flex h-20 touch-none [@media(min-height:700px)]:h-24 flex-col items-center justify-center gap-1 rounded-3xl font-bold text-tinta transition-transform select-none active:scale-95 disabled:opacity-40"
              style={{ background: `var(${p.cor})` }}
              aria-label={p.nome}
            >
              <span className="text-xs uppercase">{p.nome}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ---------- Motor do jogo (fora do React: roda a 60 fps desenhando no canvas) ----------
function criarJogo(
  tela: HTMLCanvasElement,
  { aoPlacar, aoTerminar }: { aoPlacar: (p: { pontos: number; combo: number }) => void; aoTerminar: (r: Omit<Resultado, 'recorde'>) => void },
) {
  const som = new SomDaBateria()
  const { notas, paradinhas, duracao } = montarPartitura()
  const inicio = som.agora + 0.3
  const cores = PISTAS.map((p) => getComputedStyle(document.documentElement).getPropertyValue(p.cor).trim() || '#c6f432')
  const ctx = tela.getContext('2d')!

  let pontos = 0, combo = 0, comboMax = 0, furouParadinha = false
  let proximoChocalho = 0 // índice da próxima semicolcheia agendada
  let quadro = 0
  let encerrado = false
  const toques = [0, 0, 0] // último toque por pista (para o brilho)
  const avisos: { texto: string; t: number; pista: number }[] = []

  // Agenda o apito da contagem (3 curtos + 1 longo) e o das paradinhas (um compasso antes)
  for (let i = 0; i < 4; i++) som.apito(inicio + i * (COMPASSO / 4), i === 3 ? 0.35 : 0.12)
  for (const p of paradinhas) som.apito(inicio + p.inicio - COMPASSO / 4, 0.5)

  const tempo = () => som.agora - inicio
  const emParadinha = (t: number, folga = 0) => paradinhas.some((p: Trecho) => t >= p.inicio - folga && t < p.fim)

  function tocar(pista: Pista) {
    if (encerrado) return
    const t = tempo()
    som.tocar(pista)
    toques[pista] = t
    navigator.vibrate?.(12)

    if (emParadinha(t, 0.05)) {
      furouParadinha = true
      combo = 0
      avisos.push({ texto: 'Furou a paradinha!', t, pista })
      aoPlacar({ pontos, combo })
      return
    }

    // A nota mais próxima, ainda não tocada, nessa pista
    let alvo: Nota | undefined
    for (const n of notas) {
      if (n.pista !== pista || n.acerto) continue
      if (Math.abs(n.t - t) <= JANELA_BOM && (!alvo || Math.abs(n.t - t) < Math.abs(alvo.t - t))) alvo = n
      if (n.t - t > JANELA_BOM) break
    }
    // Tocar sem batida "atravessa" o samba: quebra o combo (senão bater sem parar compensaria)
    if (!alvo) {
      if (combo > 0) { combo = 0; aoPlacar({ pontos, combo }) }
      avisos.push({ texto: 'Atravessou!', t, pista })
      return
    }

    const perfeito = Math.abs(alvo.t - t) <= JANELA_PERFEITO
    alvo.acerto = perfeito ? 'perfeito' : 'bom'
    combo++
    comboMax = Math.max(comboMax, combo)
    const multiplicador = Math.min(3, 1 + Math.floor(combo / 10) * 0.5) * (alvo.dobro ? 2 : 1)
    pontos += Math.round((perfeito ? 100 : 50) * multiplicador)
    avisos.push({ texto: perfeito ? 'Perfeito!' : 'Boa!', t, pista })
    aoPlacar({ pontos, combo })
  }

  function desenhar() {
    if (encerrado) return
    const t = tempo()

    // Notas que passaram da linha sem toque viram erro
    for (const n of notas) {
      if (n.t > t - JANELA_BOM) break
      if (!n.acerto) {
        n.acerto = 'errou'
        if (combo > 0) { combo = 0; aoPlacar({ pontos, combo }) }
      }
    }

    // Chocalho de fundo, agendado um pouco à frente (para de tocar na paradinha)
    while (CONTAGEM + proximoChocalho * SEMICOLCHEIA < t + 0.12) {
      const quando = CONTAGEM + proximoChocalho * SEMICOLCHEIA
      if (quando < duracao && !emParadinha(quando)) som.chocalho(inicio + quando, proximoChocalho % 4 === 0)
      proximoChocalho++
    }

    // Canvas na resolução do aparelho
    const dpr = window.devicePixelRatio || 1
    const w = tela.clientWidth, h = tela.clientHeight
    if (tela.width !== Math.round(w * dpr)) { tela.width = Math.round(w * dpr); tela.height = Math.round(h * dpr) }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const largura = w / 3
    const linha = h - 56
    const raio = Math.min(largura * 0.3, 30)
    const velocidade = (linha + raio) / ANTECEDENCIA

    // Pistas, linha de acerto e brilho do toque
    for (let i = 0; i < 3; i++) {
      const x = largura * i + largura / 2
      const brilho = Math.max(0, 1 - (t - toques[i]) / 0.15)
      ctx.globalAlpha = 0.06 + brilho * 0.2
      ctx.fillStyle = cores[i]
      ctx.fillRect(largura * i + 4, 0, largura - 8, h)
      ctx.globalAlpha = 1
      ctx.lineWidth = 3
      ctx.strokeStyle = cores[i]
      ctx.beginPath()
      ctx.arc(x, linha, raio + 4 + brilho * 6, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Notas caindo
    for (const n of notas) {
      if (n.t - t > ANTECEDENCIA) break
      if (n.acerto === 'perfeito' || n.acerto === 'bom') continue
      const y = linha - (n.t - t) * velocidade
      if (y < -raio || y > h + raio) continue
      ctx.globalAlpha = n.acerto === 'errou' ? 0.25 : 1
      ctx.fillStyle = cores[n.pista]
      ctx.beginPath()
      ctx.arc(largura * n.pista + largura / 2, y, raio, 0, Math.PI * 2)
      ctx.fill()
      if (n.dobro) {
        ctx.fillStyle = '#1a1d14'
        ctx.font = `bold ${raio * 0.7}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('×2', largura * n.pista + largura / 2, y)
      }
    }
    ctx.globalAlpha = 1

    // Aviso de paradinha
    const aviso = paradinhas.find((p) => t >= p.inicio - COMPASSO / 4 && t < p.fim)
    if (aviso) {
      ctx.fillStyle = '#fafafa'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(t < aviso.inicio ? '🤫 Paradinha...' : '🤫 PARADINHA!', w / 2, h * 0.35)
    } else if (t < 0.4 + CONTAGEM && t >= 0) {
      const n = Math.min(4, Math.floor(t / (COMPASSO / 4)) + 1)
      ctx.fillStyle = '#fafafa'
      ctx.font = 'bold 56px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(t < CONTAGEM ? String(n) : 'Vai!', w / 2, h * 0.35)
    }

    // "Perfeito!", "Boa!" subindo da pista
    for (const a of avisos) {
      const idade = t - a.t
      if (idade > 0.6) continue
      ctx.globalAlpha = 1 - idade / 0.6
      ctx.fillStyle = a.texto.startsWith('Furou') || a.texto.startsWith('Atravessou') ? '#ff8a8a' : '#fafafa'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(a.texto, a.texto.startsWith('Furou') ? w / 2 : largura * a.pista + largura / 2, linha - raio - 18 - idade * 60)
    }
    ctx.globalAlpha = 1
    while (avisos.length && t - avisos[0].t > 0.6) avisos.shift()

    // Barra de progresso no topo
    ctx.fillStyle = cores[0]
    ctx.fillRect(0, 0, w * Math.min(1, Math.max(0, t / duracao)), 4)

    if (t > duracao + 0.5) return finalizar()
    quadro = requestAnimationFrame(desenhar)
  }

  function finalizar() {
    encerrado = true
    const perfeitos = notas.filter((n) => n.acerto === 'perfeito').length
    const bons = notas.filter((n) => n.acerto === 'bom').length
    const precisao = (perfeitos + bons * 0.6) / notas.length
    aoTerminar({ nota: notaDaApuracao(precisao), pontos, precisao, comboMax, paradinhaLimpa: !furouParadinha })
    setTimeout(() => som.fechar(), 500)
  }

  // Saiu do app: o relógio do áudio para junto e nada se perde
  function visibilidade() {
    if (document.hidden) void som.ctx.suspend()
    else if (!encerrado) void som.ctx.resume()
  }
  document.addEventListener('visibilitychange', visibilidade)
  quadro = requestAnimationFrame(desenhar)

  return {
    tocar,
    parar() {
      if (!encerrado) { encerrado = true; som.fechar() }
      cancelAnimationFrame(quadro)
      document.removeEventListener('visibilitychange', visibilidade)
    },
  }
}
