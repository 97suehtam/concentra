import { ChevronRight, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { irParaEscola } from '@/hooks/use-rota'
import { CORES_VIVAS } from '@/lib/app'
import { cn } from '@/lib/utils'
import type { Desfile } from '@/lib/supabase'

// Card de uma escola na noite: posição num bloco colorido + enredo + coração
export function CardEscola({
  desfile: d,
  favorita,
  doCoracao = false,
  aoFavoritar,
  indice = 0,
}: {
  desfile: Desfile
  favorita: boolean
  doCoracao?: boolean
  aoFavoritar: (botao: HTMLButtonElement) => void
  indice?: number // posição na lista, para a entrada em cascata
}) {
  const cor = CORES_VIVAS[(d.ordem - 1) % CORES_VIVAS.length]

  return (
    <article
      style={{ '--i': indice } as React.CSSProperties}
      className={cn(
        // Encolhe de leve ao tocar no nome (abrir a escola), não no coração
        'flex items-stretch gap-3 rounded-3xl bg-card p-2 pr-3 ring-1 ring-border transition-[transform,scale,box-shadow] duration-300 ease-mola has-[>button:first-of-type:active]:scale-[0.98]',
        favorita && 'ring-2 ring-lima',
        doCoracao && 'ring-2 ring-rosa shadow-[0_0_28px_-8px] shadow-rosa/70',
      )}
    >
      {/* Mesmo nome de transição do bloco na página da escola: ao abrir, um vira o outro */}
      <div
        className={cn('vt-ordem flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-tinta', cor)}
        style={{ viewTransitionName: `ordem-${d.escolas.slug}` }}
      >
        <span className="font-heading text-2xl leading-none font-bold">{d.ordem}º</span>
        <span className="text-[10px] font-medium uppercase">a entrar</span>
      </div>

      {/* Nome e enredo abrem a página da escola; o coração fica separado */}
      <button
        type="button"
        onClick={() => irParaEscola(d.escolas.slug)}
        className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-2xl py-1.5 text-left"
      >
        <h3 className="flex items-center gap-1 text-base font-bold">
          <span className="truncate">{d.escolas.nome}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </h3>
        {d.enredo_titulo ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{d.enredo_titulo}</p>
        ) : (
          <p className="text-sm text-muted-foreground/70 italic">Enredo a divulgar</p>
        )}
        <div className="mt-1 flex flex-wrap gap-1">
          {doCoracao && <Badge className="bg-rosa text-tinta">💖 sua escola</Badge>}
          {d.horario_previsto && <Badge variant="secondary">{d.horario_previsto.slice(0, 5)}</Badge>}
          {d.carnavalesco && <Badge variant="outline" className="max-w-full truncate">{d.carnavalesco}</Badge>}
          {d.enredo_titulo && !d.verificado && (
            <Badge variant="outline" className="text-muted-foreground" title="Veio de agregador, ainda não conferido no canal da escola">
              a confirmar
            </Badge>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => aoFavoritar(e.currentTarget)}
        aria-pressed={favorita}
        aria-label={favorita ? `Tirar ${d.escolas.nome} da minha grade` : `Pôr ${d.escolas.nome} na minha grade`}
        className={cn(
          'flex size-11 shrink-0 items-center justify-center self-center rounded-full transition-colors',
          favorita ? 'bg-lima text-tinta' : 'bg-muted text-muted-foreground hover:text-foreground',
        )}
      >
        <Heart className={cn('size-5', favorita && 'fill-current')} />
      </button>
    </article>
  )
}
