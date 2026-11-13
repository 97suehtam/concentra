import { ExternalLink, Plus, Ticket, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Carregando, Erro } from '@/components/estados'
import { Sobretitulo, Titulo } from '@/components/titulo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useConsulta } from '@/hooks/use-consulta'
import { useMeusIngressos } from '@/hooks/use-meus-ingressos'
import { desbloquear } from '@/hooks/use-perfil'
import { VENDA_OFICIAL } from '@/lib/app'
import { soltarConfete } from '@/lib/confete'
import { consultarIngressos, consultarNoites, rotuloNoite, type Ingresso, type Noite } from '@/lib/supabase'

const STATUS: Record<NonNullable<Ingresso['status']>, string> = {
  em_breve: 'em breve',
  a_venda: 'à venda',
  esgotado: 'esgotado',
}

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function TelaIngressos() {
  const noites = useConsulta<Noite[]>(consultarNoites)
  const ingressos = useConsulta<Ingresso[]>(consultarIngressos)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Sobretitulo>Garanta seu lugar no Anhembi</Sobretitulo>
        <Titulo antes="Seus" destaque="ingressos" cor="bg-amarelo" />
      </div>

      <VendaOficial />

      {(noites.status === 'carregando' || ingressos.status === 'carregando') && <Carregando linhas={2} />}
      {noites.status === 'erro' && <Erro titulo="Não deu para carregar as noites" mensagem={noites.mensagem} />}
      {noites.status === 'ok' && (
        <>
          <MeusIngressos noites={noites.dados} />
          {ingressos.status === 'ok' && <SetoresPorNoite noites={noites.dados} ingressos={ingressos.dados} />}
        </>
      )}
    </div>
  )
}

function VendaOficial() {
  return (
    <section className="relative flex flex-col gap-3 overflow-hidden rounded-[2rem] bg-lavanda p-5 text-tinta">
      <span className="absolute -right-3 -bottom-6 text-8xl opacity-20" aria-hidden="true">🎟️</span>
      <span className="text-xs font-semibold tracking-wide uppercase">Venda oficial · {VENDA_OFICIAL.operadora}</span>
      <p className="max-w-72 text-lg leading-snug font-bold">
        Os ingressos de 2027 já estão à venda, e alguns setores esgotaram.
      </p>
      <p className="text-sm opacity-80">Também tem bilheteria física na sede da Liga-SP, com parcelamento em até 3x.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="lg" className="h-12 rounded-full bg-tinta px-5 text-lavanda hover:bg-tinta/90">
          <a href={VENDA_OFICIAL.url} target="_blank" rel="noopener noreferrer">
            Comprar no site oficial <ExternalLink data-icon="inline-end" />
          </a>
        </Button>
        <a href={VENDA_OFICIAL.fonte_url} target="_blank" rel="noopener noreferrer" className="text-xs underline opacity-70">
          fonte: Liga-SP
        </a>
      </div>
    </section>
  )
}

// Ingressos que o usuário guarda (link do pedido). Ficam só no aparelho.
function MeusIngressos({ noites }: { noites: Noite[] }) {
  const { lista, remover } = useMeusIngressos()
  const noitePorId = new Map(noites.map((n) => [n.id, n]))

  return (
    <section aria-labelledby="titulo-meus" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="titulo-meus" className="text-xl font-bold">Meus ingressos</h2>
        <GuardarIngresso noites={noites} />
      </div>

      {lista.length === 0 ? (
        <p className="rounded-3xl border border-dashed p-4 text-sm text-muted-foreground">
          Já comprou? Guarde aqui o setor e o link do pedido para achar rápido no dia. A operadora ainda não tem
          integração pública, então suas compras não aparecem sozinhas.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((i) => {
            const noite = noitePorId.get(i.noite_id)
            return (
              <li key={i.id} className="flex items-center gap-3 rounded-3xl bg-card p-3 ring-1 ring-border">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amarelo text-tinta">
                  <Ticket className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{i.setor}</p>
                  <p className="text-xs text-muted-foreground">{noite ? rotuloNoite(noite) : 'Noite removida'}</p>
                </div>
                {i.link && (
                  <Button asChild size="icon" variant="secondary" className="rounded-full">
                    <a href={i.link} target="_blank" rel="noopener noreferrer" aria-label={`Abrir pedido de ${i.setor}`}>
                      <ExternalLink />
                    </a>
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground" aria-label={`Apagar ${i.setor}`} onClick={() => remover(i.id)}>
                  <Trash2 />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function GuardarIngresso({ noites }: { noites: Noite[] }) {
  const { guardar } = useMeusIngressos()
  const [aberto, setAberto] = useState(false)
  const [noiteId, setNoiteId] = useState<string>('')
  const [erroLink, setErroLink] = useState<string | null>(null)

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const dados = new FormData(e.currentTarget)
    const setor = String(dados.get('setor') ?? '').trim()
    const link = String(dados.get('link') ?? '').trim()

    // Só aceita link web: evita guardar texto solto (ou dado pessoal) no campo
    if (link && !/^https?:\/\/\S+$/i.test(link)) {
      setErroLink('Cole um link que comece com https://')
      return
    }
    guardar({ noite_id: Number(noiteId), setor, link: link || null })
    setAberto(false)
    setNoiteId('')
    soltarConfete(null, { quantidade: 16, emojis: ['🎟️', '✨', '🎉'] })
    toast('Ingresso guardado 🎟️', { description: 'Fica salvo só neste aparelho.' })
    desbloquear('garantido')
  }

  return (
    <Dialog open={aberto} onOpenChange={(a) => { setAberto(a); setErroLink(null) }}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <Plus data-icon="inline-start" /> Guardar
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Guardar ingresso</DialogTitle>
            <DialogDescription>
              Fica salvo só neste aparelho. Não cole número de cartão nem documento.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="noite">Noite</Label>
            <Select value={noiteId} onValueChange={setNoiteId} required>
              <SelectTrigger id="noite" className="w-full">
                <SelectValue placeholder="Escolha a noite" />
              </SelectTrigger>
              <SelectContent>
                {noites.map((n) => <SelectItem key={n.id} value={String(n.id)}>{rotuloNoite(n)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="setor">Setor</Label>
            <Input id="setor" name="setor" placeholder="Ex.: Arquibancada, Camarote Lounge" required maxLength={60} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="link">Link do pedido (opcional)</Label>
            <Input
              id="link"
              name="link"
              type="url"
              inputMode="url"
              placeholder="https://www.clubedoingresso.com/..."
              aria-invalid={erroLink ? true : undefined}
              onChange={() => setErroLink(null)}
            />
            {erroLink && <p className="text-xs text-destructive">{erroLink}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="rounded-full">Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="rounded-full" disabled={!noiteId}>Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Setores curados na tabela `ingressos`. Enquanto vazia, cada noite aponta para o site oficial.
function SetoresPorNoite({ noites, ingressos }: { noites: Noite[]; ingressos: Ingresso[] }) {
  return (
    <section aria-labelledby="titulo-setores" className="flex flex-col gap-3">
      <h2 id="titulo-setores" className="text-xl font-bold">Setores por noite</h2>
      <div className="grid gap-3 md:grid-cols-2 md:items-start">
      {noites.map((n) => {
        const daNoite = ingressos.filter((i) => i.noite_id === n.id)
        return (
          <article key={n.id} className="flex flex-col gap-2 rounded-3xl bg-card p-4 ring-1 ring-border">
            <h3 className="font-bold">{rotuloNoite(n)}</h3>
            {daNoite.length === 0 ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Setores e preços ainda não cadastrados aqui.</p>
                <Button asChild size="sm" variant="secondary" className="shrink-0 rounded-full">
                  <a href={VENDA_OFICIAL.url} target="_blank" rel="noopener noreferrer">Ver no site</a>
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {daNoite.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{i.setor}</span>
                    <span className="flex items-center gap-2">
                      {i.preco_inteira != null && <span className="tabular-nums">{reais.format(i.preco_inteira)}</span>}
                      {i.status && <Badge variant={i.status === 'esgotado' ? 'outline' : 'secondary'}>{STATUS[i.status]}</Badge>}
                      {i.url_compra && i.status !== 'esgotado' && (
                        <a href={i.url_compra} target="_blank" rel="noopener noreferrer" className="text-lima underline">comprar</a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )
      })}
      </div>
    </section>
  )
}
