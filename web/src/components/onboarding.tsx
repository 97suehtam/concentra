import { ArrowRight, CalendarHeart, MapPin, Newspaper, Ticket } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TIPOS_FOLIA, usePerfil, type TipoFolia } from '@/hooks/use-perfil'
import { NOME_APP } from '@/lib/app'
import { soltarConfete } from '@/lib/confete'
import { cn } from '@/lib/utils'

const TOTAL = 3

// Primeira abertura: apresenta o app, pergunta o nome e o "tipo de folião".
// Tudo opcional: dá para pular, e depois editar no perfil.
export function Onboarding() {
  const { perfil, atualizar } = usePerfil()
  const [passo, setPasso] = useState(1)
  const [nome, setNome] = useState(perfil.nome)

  function concluir(tipoFolia: TipoFolia | null) {
    atualizar({ nome: nome.trim().slice(0, 40), tipoFolia, onboardingFeito: true })
    soltarConfete(null, { quantidade: 24 })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background" role="dialog" aria-modal="true" aria-label={`Boas-vindas ao ${NOME_APP}`}>
      <div className="mx-auto flex min-h-svh max-w-md flex-col gap-6 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <Pontos passo={passo} />
          {passo < TOTAL && (
            <button type="button" onClick={() => concluir(null)} className="text-sm text-muted-foreground hover:text-foreground">
              Pular
            </button>
          )}
        </div>

        <div key={passo} className="flex flex-1 flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {passo === 1 && <Boasvindas />}
          {passo === 2 && (
            <section className="flex flex-1 flex-col gap-5">
              <span className="text-6xl" aria-hidden="true">👋</span>
              <h1 className="text-4xl leading-tight font-bold">Como a gente te chama?</h1>
              <p className="text-muted-foreground">Só para deixar o app com a sua cara. Fica neste aparelho.</p>
              <Input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setPasso(3)}
                placeholder="Seu nome ou apelido"
                maxLength={40}
                className="h-14 rounded-2xl px-4 text-lg"
                aria-label="Seu nome ou apelido"
              />
            </section>
          )}
          {passo === 3 && (
            <section className="flex flex-1 flex-col gap-5">
              <span className="text-6xl" aria-hidden="true">🎭</span>
              <h1 className="text-4xl leading-tight font-bold">
                {nome.trim() ? `${nome.trim().split(' ')[0]}, qual é a sua` : 'Qual é a sua'} no Anhembi?
              </h1>
              <p className="text-muted-foreground">A gente ajusta as dicas para você.</p>
              {/* Cartão branco com opções em pílula, como o "How do you feel?" da referência */}
              <div className="flex flex-col gap-2 rounded-[2rem] bg-foreground p-4 text-background">
                {(Object.keys(TIPOS_FOLIA) as TipoFolia[]).map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => concluir(t)}
                    className={cn(
                      'flex h-14 items-center gap-3 rounded-full px-5 text-left font-semibold transition-transform active:scale-95',
                      ['bg-lima text-tinta', 'bg-tinta text-foreground', 'bg-lavanda text-tinta'][i],
                    )}
                  >
                    <span className="text-xl" aria-hidden="true">{TIPOS_FOLIA[t].emoji}</span>
                    {TIPOS_FOLIA[t].rotulo}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {passo < TOTAL && (
          <Button
            size="lg"
            onClick={() => setPasso((p) => p + 1)}
            className="h-14 justify-between rounded-full bg-foreground pr-1.5 pl-6 text-base text-background hover:bg-foreground/90"
          >
            {passo === 1 ? 'Bora começar!' : nome.trim() ? 'Continuar' : 'Prefiro não dizer'}
            <span className="flex size-11 items-center justify-center rounded-full bg-tinta text-foreground">
              <ArrowRight />
            </span>
          </Button>
        )}
      </div>
    </div>
  )
}

function Boasvindas() {
  const itens = [
    { Icone: CalendarHeart, texto: 'Monte sua grade com as escolas que não quer perder', cor: 'bg-lima' },
    { Icone: Newspaper, texto: 'Notícias das suas escolas num lugar só', cor: 'bg-lavanda' },
    { Icone: Ticket, texto: 'Ingresso oficial de cada noite e setor', cor: 'bg-amarelo' },
    { Icone: MapPin, texto: 'Como chegar no Anhembi sem perrengue', cor: 'bg-rosa' },
  ]
  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-[2rem] bg-lima">
        {/* Colagem de emojis girados, no espírito da colagem de fotos da referência */}
        {['🥁', '🎉', '🎶', '💃', '✨', '🎺'].map((e, i) => (
          <span
            key={e}
            aria-hidden="true"
            className="absolute text-5xl"
            style={{
              left: `${[10, 64, 22, 76, 6, 42][i]}%`,
              top: `${[12, 8, 68, 56, 44, 74][i]}%`,
              transform: `rotate(${[-12, 10, -6, 14, 8, -4][i]}deg)`,
            }}
          >
            {e}
          </span>
        ))}
        <span className="flex size-20 items-center justify-center rounded-3xl bg-tinta text-4xl shadow-xl" aria-hidden="true">🥁</span>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl leading-tight font-bold">
          Seu carnaval no Anhembi, <span className="inline-block -rotate-1 rounded-lg bg-lavanda px-2 text-tinta">do seu jeito</span>
        </h1>
        <p className="text-muted-foreground">O {NOME_APP} junta tudo do Carnaval SP 2027 que hoje fica espalhado por aí.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {itens.map(({ Icone, texto, cor }) => (
          <li key={texto} className="flex items-center gap-3">
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-2xl text-tinta', cor)}>
              <Icone className="size-5" />
            </span>
            <span className="text-sm">{texto}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Pontos({ passo }: { passo: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Passo ${passo} de ${TOTAL}`}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <span key={i} className={cn('h-2 rounded-full transition-all', i + 1 === passo ? 'w-6 bg-lima' : 'w-2 bg-muted')} />
      ))}
    </div>
  )
}
