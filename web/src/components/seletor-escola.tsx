import { Check, Search, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useMemo, useRef, useState } from 'react'
import { useConsulta } from '@/hooks/use-consulta'
import { CORES_VIVAS } from '@/lib/app'
import { consultarNoites, formatarData, type Noite } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Bottom sheet para escolher uma escola: sobe com mola, tem busca (sem acento) e as escolas
// agrupadas por grupo, com a posição e a noite de cada uma. Fecha arrastando a alça para baixo.
// Usa o Dialog do Radix por baixo: foco preso, Esc e leitor de tela funcionam de graça.

type Item = { slug: string; nome: string; ordem: number; grupo: string; data: string }

const ORDEM_GRUPOS = ['Especial', 'Acesso I', 'Acesso II']
const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function SeletorEscola({
  aberto,
  aoMudarAberto,
  valor,
  aoEscolher,
  titulo = 'Escola do coração',
}: {
  aberto: boolean
  aoMudarAberto: (aberto: boolean) => void
  valor: string | null
  aoEscolher: (slug: string | null) => void
  titulo?: string
}) {
  const noites = useConsulta<Noite[]>(consultarNoites)
  const [busca, setBusca] = useState('')

  // Todas as escolas de 2027, uma vez cada, agrupadas por grupo (o Especial tem duas noites)
  const grupos = useMemo(() => {
    if (noites.status !== 'ok') return []
    const itens: Item[] = noites.dados.flatMap((n) =>
      n.desfiles.map((d) => ({ slug: d.escolas.slug, nome: d.escolas.nome, ordem: d.ordem, grupo: n.grupos.nome, data: n.data })))
    const termo = normalizar(busca.trim())
    const filtrados = termo ? itens.filter((i) => normalizar(i.nome).includes(termo)) : itens
    return ORDEM_GRUPOS
      .map((g) => ({ grupo: g, itens: filtrados.filter((i) => i.grupo === g).sort((a, b) => a.data.localeCompare(b.data) || a.ordem - b.ordem) }))
      .filter((g) => g.itens.length > 0)
  }, [noites, busca])

  // Todo jeito de fechar passa aqui: a próxima abertura começa com a busca limpa
  function fechar() {
    aoMudarAberto(false)
    setBusca('')
  }

  function escolher(slug: string | null) {
    aoEscolher(slug)
    fechar()
  }

  // Arrastar para fechar: a folha segue o dedo; soltou longe ou rápido, fecha; senão volta
  const folha = useRef<HTMLDivElement>(null)
  const arrasto = useRef<{ y: number; t: number; dy: number } | null>(null)

  function comecarArrasto(e: React.PointerEvent) {
    if (matchMedia('(min-width: 1024px)').matches) return // no desktop é janela, não folha
    // Toque no ✕ não é arrasto: capturar o ponteiro aqui mandaria o clique para o cabeçalho, não para o botão
    if ((e.target as Element).closest('button')) return
    arrasto.current = { y: e.clientY, t: performance.now(), dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (folha.current) folha.current.style.transition = 'none'
  }
  function arrastar(e: React.PointerEvent) {
    if (!arrasto.current || !folha.current) return
    const dy = Math.max(0, e.clientY - arrasto.current.y)
    arrasto.current.dy = dy
    folha.current.style.transform = `translateY(${dy}px)`
  }
  function soltar() {
    const a = arrasto.current
    arrasto.current = null
    const f = folha.current
    if (!a || !f) return
    const velocidade = a.dy / (performance.now() - a.t) // px/ms
    f.style.transition = 'transform 320ms var(--ease-mola)'
    // Arrastou longe, ou deu um peteleco rápido (com um mínimo de distância, para um raspão não fechar)
    if (a.dy > 120 || (velocidade > 0.6 && a.dy > 60)) {
      f.style.transform = 'translateY(100%)'
      // Fecha com a folha já embaixo (o Radix desmonta ela, levando junto o estilo inline)
      setTimeout(fechar, 200)
    } else {
      f.style.transform = ''
    }
  }

  let indice = 0 // para a cascata atravessar os grupos

  return (
    <DialogPrimitive.Root open={aberto} onOpenChange={(a) => (a ? aoMudarAberto(true) : fechar())}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-open:duration-300 data-closed:animate-out data-closed:fade-out-0 data-closed:duration-200" />
        <DialogPrimitive.Content
          ref={folha}
          aria-describedby={undefined}
          // Não foca a busca ao abrir: no celular isso abriria o teclado por cima da lista
          onOpenAutoFocus={(e) => { e.preventDefault(); folha.current?.focus() }}
          className="folha fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85svh] w-full max-w-md flex-col rounded-t-[2rem] border-t bg-popover shadow-[0_-24px_60px_-12px] shadow-black/70 outline-none"
        >
          {/* Alça e cabeçalho: área de arrastar */}
          <div
            className="flex cursor-grab touch-none flex-col items-center gap-3 px-5 pt-3 pb-2 active:cursor-grabbing lg:cursor-auto lg:pt-5"
            onPointerDown={comecarArrasto}
            onPointerMove={arrastar}
            onPointerUp={soltar}
            onPointerCancel={soltar}
          >
            <span className="h-1.5 w-12 rounded-full bg-muted-foreground/40 lg:hidden" aria-hidden="true" />
            <div className="flex w-full items-center justify-between">
              <DialogPrimitive.Title className="font-heading text-xl font-bold">{titulo} 💖</DialogPrimitive.Title>
              <DialogPrimitive.Close className="flex size-9 items-center justify-center rounded-full bg-muted transition-transform active:scale-90" aria-label="Fechar">
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="px-5 pb-3">
            <label className="flex h-12 items-center gap-2 rounded-2xl bg-background px-4 ring-1 ring-border focus-within:ring-2 focus-within:ring-rosa">
              <Search className="size-4 text-muted-foreground" />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar escola"
                className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="Buscar escola"
              />
              {busca && (
                <button type="button" onClick={() => setBusca('')} className="text-muted-foreground" aria-label="Limpar busca">
                  <X className="size-4" />
                </button>
              )}
            </label>
          </div>

          <div className="cascata flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {!busca && (
              <Opcao
                indice={indice++}
                selecionada={valor == null}
                aoTocar={() => escolher(null)}
                marcador={<span className="text-xl">🤷</span>}
                nome="Ainda não escolhi"
              />
            )}
            {grupos.map((g) => (
              <section key={g.grupo} aria-label={g.grupo} style={{ '--i': indice++ } as React.CSSProperties}>
                <h3 className="sticky top-0 z-10 bg-popover/95 px-2 pt-4 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur">
                  {g.grupo === 'Especial' ? 'Grupo Especial' : g.grupo} · {g.itens.length}
                </h3>
                {g.itens.map((i) => (
                  <Opcao
                    key={i.slug}
                    selecionada={valor === i.slug}
                    aoTocar={() => escolher(i.slug)}
                    marcador={
                      <span className={cn('flex size-10 items-center justify-center rounded-xl font-heading font-bold text-tinta', CORES_VIVAS[(i.ordem - 1) % CORES_VIVAS.length])}>
                        {i.ordem}º
                      </span>
                    }
                    nome={i.nome}
                    detalhe={formatarData(i.data, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  />
                ))}
              </section>
            ))}
            {noites.status === 'ok' && grupos.length === 0 && (
              <p className="px-2 py-10 text-center text-sm text-muted-foreground">Nenhuma escola com “{busca}” 🤔</p>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Opcao({ selecionada, aoTocar, marcador, nome, detalhe, indice }: {
  selecionada: boolean
  aoTocar: () => void
  marcador: React.ReactNode
  nome: string
  detalhe?: string
  indice?: number
}) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      aria-pressed={selecionada}
      style={indice != null ? ({ '--i': indice } as React.CSSProperties) : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-[background-color,transform,scale] duration-200 ease-mola active:scale-[0.98]',
        selecionada ? 'bg-rosa/15' : 'hover:bg-muted',
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center">{marcador}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{nome}</span>
        {detalhe && <span className="block text-xs text-muted-foreground first-letter:uppercase">Desfila {detalhe}</span>}
      </span>
      {selecionada && (
        <span className="flex size-7 items-center justify-center rounded-full bg-rosa text-tinta animate-in zoom-in-50">
          <Check className="size-4" />
        </span>
      )}
    </button>
  )
}
