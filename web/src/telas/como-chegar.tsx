import { ChevronDown, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { MapaAnhembi } from '@/components/mapa-anhembi'
import { Sobretitulo, Titulo } from '@/components/titulo'
import { Button } from '@/components/ui/button'
import { usePerfil } from '@/hooks/use-perfil'
import {
  ANHEMBI, FONTE_TRANSPORTE, LINKS_ROTA, MAPA_COMPLETO, ROTAS_ATE_O_ANHEMBI, type Rota,
} from '@/lib/como-chegar'
import { cn } from '@/lib/utils'

export function TelaComoChegar() {
  const { perfil } = usePerfil()
  const [aberta, setAberta] = useState<string | null>('tiete')

  async function copiarEndereco() {
    try {
      await navigator.clipboard.writeText(`${ANHEMBI.nome}, ${ANHEMBI.endereco}`)
      toast('Endereço copiado 📍')
    } catch {
      toast.error('Não deu para copiar.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Sobretitulo>Sem perrengue até a avenida</Sobretitulo>
        <Titulo antes="Bora pro" destaque="Anhembi" cor="bg-ceu" />
      </div>

      {/* Desktop: mapa e dicas à esquerda, rotas à direita */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-6">
      <section aria-label="Mapa" className="overflow-hidden rounded-[2rem] bg-card ring-1 ring-border">
        <MapaAnhembi className="h-64 w-full lg:h-80" />
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-bold">{ANHEMBI.nome}</p>
            <p className="text-sm text-muted-foreground">{ANHEMBI.endereco}</p>
          </div>
          <Button size="icon" variant="secondary" className="shrink-0 rounded-full" onClick={copiarEndereco} aria-label="Copiar endereço">
            <Copy />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          <LinkApp href={LINKS_ROTA.googleTransporte} rotulo="Maps" emoji="🗺️" />
          <LinkApp href={LINKS_ROTA.waze} rotulo="Waze" emoji="🚙" />
          <LinkApp href={LINKS_ROTA.uber} rotulo="Uber" emoji="🚕" />
        </div>
      </section>

      {perfil.tipoFolia && <DicasDoPerfil tipo={perfil.tipoFolia} />}
      </div>

      <section aria-labelledby="titulo-rotas" className="flex flex-col gap-3">
        <h2 id="titulo-rotas" className="text-xl font-bold">Opções de ida</h2>
        {ROTAS_ATE_O_ANHEMBI.map((r) => (
          <CardRota key={r.id} rota={r} aberta={aberta === r.id} aoAlternar={() => setAberta(aberta === r.id ? null : r.id)} />
        ))}
        <p className="text-xs text-muted-foreground">
          Baseado na operação especial do carnaval passado. A de 2027 ainda não foi divulgada: confira antes de sair.{' '}
          <a href={FONTE_TRANSPORTE.url} target="_blank" rel="noopener noreferrer" className="underline">
            Fonte: {FONTE_TRANSPORTE.rotulo}
          </a>
          {' · '}
          <a href={MAPA_COMPLETO} target="_blank" rel="noopener noreferrer" className="underline">mapa completo</a>
        </p>
      </section>
      </div>
    </div>
  )
}

function LinkApp({ href, rotulo, emoji }: { href: string; rotulo: string; emoji: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-muted text-sm font-medium transition-colors hover:bg-secondary"
    >
      <span aria-hidden="true">{emoji}</span> {rotulo}
      <ExternalLink className="size-3 text-muted-foreground" />
    </a>
  )
}

function CardRota({ rota: r, aberta, aoAlternar }: { rota: Rota; aberta: boolean; aoAlternar: () => void }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
      <button type="button" onClick={aoAlternar} aria-expanded={aberta} className="flex w-full items-center gap-3 p-3 text-left">
        <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl', r.cor)} aria-hidden="true">
          {r.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{r.titulo}</span>
          <span className="block text-sm text-muted-foreground">{r.resumo}</span>
        </span>
        <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-mola', aberta && 'rotate-180')} />
      </button>
      {/* Altura animada: a grade vai de 0fr a 1fr e o conteúdo acompanha (sem medir em JS) */}
      <div
        className={cn('grid transition-[grid-template-rows,opacity] duration-300 ease-mola motion-reduce:transition-none', aberta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
        inert={!aberta}
      >
        <div className="overflow-hidden">
          <ol className="flex flex-col gap-2 px-4 pb-4">
            {r.passos.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                <span className="pt-0.5">{p}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  )
}

// Dicas gerais conforme o "tipo de folião" do perfil (sem regras específicas do evento)
function DicasDoPerfil({ tipo }: { tipo: 'primeira_vez' | 'veterano' | 'desfila' }) {
  const dicas = {
    primeira_vez: {
      titulo: 'Primeira vez? Anota aí 🙋',
      itens: [
        'Combine um ponto de encontro com a galera: o sinal do celular costuma sofrer com tanta gente junta.',
        'Confira no ingresso o seu setor e o portão de entrada antes de sair de casa.',
        'Saia com a bateria do celular cheia: o ingresso e a volta dependem dele.',
      ],
    },
    veterano: {
      titulo: 'Você já é de casa 😎',
      itens: ['Mesmo assim, confira as linhas especiais de 2027 quando saírem: a operação muda de ano para ano.'],
    },
    desfila: {
      titulo: 'Vai desfilar! 💃',
      itens: [
        'Quem desfila entra pela concentração, não pela arquibancada: confirme com a sua ala o horário e o ponto de encontro.',
        'Leve a fantasia protegida e chegue com folga. A escola não espera.',
      ],
    },
  }[tipo]

  return (
    <section className="flex flex-col gap-2 rounded-[2rem] bg-lima p-5 text-tinta">
      <h2 className="text-lg font-bold">{dicas.titulo}</h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
        {dicas.itens.map((d) => <li key={d}>{d}</li>)}
      </ul>
    </section>
  )
}
