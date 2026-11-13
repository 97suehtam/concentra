import { ArrowRight, Share2, Ticket, X } from 'lucide-react'
import { toast } from 'sonner'
import { Carregando, Erro, Vazio } from '@/components/estados'
import { Sobretitulo, Titulo } from '@/components/titulo'
import { Button } from '@/components/ui/button'
import { useConsulta } from '@/hooks/use-consulta'
import { useFavoritos } from '@/hooks/use-favoritos'
import { desbloquear } from '@/hooks/use-perfil'
import { irPara, irParaEscola } from '@/hooks/use-rota'
import { CORES_VIVAS, NOME_APP } from '@/lib/app'
import { consultarNoites, formatarData, rotuloNoite, type Noite } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function TelaMinhaGrade() {
  const estado = useConsulta<Noite[]>(consultarNoites)
  const favoritos = useFavoritos()

  if (estado.status === 'carregando') return <Carregando />
  if (estado.status === 'erro') return <Erro titulo="Não deu para carregar sua grade" mensagem={estado.mensagem} />

  // Só as noites com alguma escola favorita, e só as favoritas dentro delas
  const grade = estado.dados
    .map((n) => ({ ...n, desfiles: n.desfiles.filter((d) => favoritos.ehFavorita(d.escolas.slug)) }))
    .filter((n) => n.desfiles.length > 0)
  const total = grade.reduce((soma, n) => soma + n.desfiles.length, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Sobretitulo>{total ? `${total} ${total === 1 ? 'escola' : 'escolas'} em ${grade.length} ${grade.length === 1 ? 'noite' : 'noites'}` : 'Sua programação'}</Sobretitulo>
        <Titulo antes="Minha" destaque="grade" cor="bg-lima" />
      </div>

      {total === 0 ? (
        <Vazio emoji="🎶" titulo="Sua grade tá vazia">
          <p className="max-w-64 text-sm text-muted-foreground">
            Toque no coração das escolas que você não quer perder e elas aparecem aqui, na ordem da avenida.
          </p>
          <Button size="lg" className="mt-2 h-12 rounded-full px-6" onClick={() => irPara('desfiles')}>
            Escolher escolas <ArrowRight data-icon="inline-end" />
          </Button>
        </Vazio>
      ) : (
        <>
          {/* Tablet e desktop: uma noite por coluna */}
          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            {grade.map((n) => <NoiteDaGrade key={n.id} noite={n} aoRemover={favoritos.alternar} />)}
          </div>
          <Button variant="outline" size="lg" className="h-12 rounded-full md:self-start md:px-8" onClick={() => compartilhar(grade)}>
            <Share2 data-icon="inline-start" /> Compartilhar minha grade
          </Button>
        </>
      )}
    </div>
  )
}

function NoiteDaGrade({ noite: n, aoRemover }: { noite: Noite; aoRemover: (slug: string) => void }) {
  return (
    <section aria-label={rotuloNoite(n)} className="flex flex-col gap-3 rounded-[2rem] bg-card p-4 ring-1 ring-border">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{n.grupos.nome}</h2>
          <p className="text-sm text-muted-foreground first-letter:uppercase">
            {formatarData(n.data, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button size="sm" variant="secondary" className="rounded-full" onClick={() => irPara('ingressos')}>
          <Ticket data-icon="inline-start" /> Ingresso
        </Button>
      </header>

      {/* Linha do tempo na ordem de entrada na avenida */}
      <ol className="relative ml-3 flex flex-col gap-4 border-l border-dashed border-border pl-6">
        {n.desfiles.map((d) => (
          <li key={d.escolas.slug} className="relative">
            <span
              className={cn('absolute top-1 -left-[2.05rem] size-4 rounded-full ring-4 ring-card', CORES_VIVAS[(d.ordem - 1) % CORES_VIVAS.length])}
              aria-hidden="true"
            />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {d.ordem}ª a desfilar · {d.horario_previsto ? d.horario_previsto.slice(0, 5) : 'horário a divulgar'}
                </p>
                <button type="button" onClick={() => irParaEscola(d.escolas.slug)} className="text-left">
                  <p className="font-bold underline-offset-4 hover:underline">{d.escolas.nome}</p>
                  {d.enredo_titulo && <p className="line-clamp-1 text-sm text-muted-foreground">{d.enredo_titulo}</p>}
                </button>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-full text-muted-foreground"
                aria-label={`Tirar ${d.escolas.nome} da grade`}
                onClick={() => aoRemover(d.escolas.slug)}
              >
                <X />
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

async function compartilhar(grade: Noite[]) {
  const texto = [
    `Minha grade do Carnaval SP 2027 🥁`,
    ...grade.map((n) => `\n${rotuloNoite(n)}\n` + n.desfiles.map((d) => `${d.ordem}º ${d.escolas.nome}`).join('\n')),
    `\nMontei no ${NOME_APP}`,
  ].join('\n')

  try {
    if (navigator.share) {
      await navigator.share({ title: 'Minha grade do Carnaval SP 2027', text: texto })
      desbloquear('puxador')
      return
    }
    await navigator.clipboard.writeText(texto)
    toast('Grade copiada! 📋', { description: 'É só colar no grupo da galera.' })
    desbloquear('puxador')
  } catch (e) {
    // Cancelar o compartilhamento não é erro
    if ((e as DOMException).name !== 'AbortError') toast.error('Não deu para compartilhar agora.')
  }
}
