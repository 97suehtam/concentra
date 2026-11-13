import { Ban, Check, Flag, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AvatarPessoa } from '@/components/avatar-pessoa'
import { Carregando, Vazio } from '@/components/estados'
import { Sobretitulo, Titulo } from '@/components/titulo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConsulta } from '@/hooks/use-consulta'
import { TIPOS_FOLIA, type TipoFolia } from '@/hooks/use-perfil'
import { irPara, irParaEscola } from '@/hooks/use-rota'
import {
  MOTIVOS_DENUNCIA, aceitarConexao, bloquear, buscarGalera, denunciar, desfazerConexao, linksDasFotos, pedirConexao,
  useMeuPerfilComunidade, type Conexao, type MotivoDenuncia, type Pessoa,
} from '@/lib/comunidade'
import { consultarEscolas, consultarNoites, formatarData, type Escola, type Noite } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Galera: perfis públicos de outras pessoas 18+ (o banco só devolve quem pode ser visto).
// Conexão é em duas mãos: um pede, o outro aceita. Sem chat nesta etapa.
type Filtro = 'todos' | 'escola' | 'noites' | 'galera'

export function TelaGalera() {
  const { perfil: eu, carregando, sessao } = useMeuPerfilComunidade()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Sobretitulo>Quem também vai pro Anhembi</Sobretitulo>
        <Titulo antes="A" destaque="galera" cor="bg-rosa" />
      </div>
      {!sessao ? (
        <Convite texto="Entre na sua conta no Perfil para ver quem também vai." />
      ) : carregando ? (
        <Carregando linhas={3} />
      ) : !eu?.maior_18_em || !eu.publico ? (
        <Convite texto="A galera é só para maiores de 18 com perfil público: quem vê, também é visto. Monte o seu no Perfil." />
      ) : (
        <Lista meuId={sessao.user.id} minhaEscolaId={eu.escola_coracao_id ?? null} minhasNoites={eu.noites} />
      )}
    </div>
  )
}

function Convite({ texto }: { texto: string }) {
  return (
    <Vazio emoji="🙌" titulo="Bora fazer parte?">
      <p className="max-w-72 text-sm text-muted-foreground">{texto}</p>
      <Button size="lg" className="mt-2 h-12 rounded-full px-6" onClick={() => irPara('perfil')}>Ir para o perfil</Button>
    </Vazio>
  )
}

function Lista({ meuId, minhaEscolaId, minhasNoites }: { meuId: string; minhaEscolaId: number | null; minhasNoites: number[] }) {
  const [dados, setDados] = useState<{ pessoas: Pessoa[]; conexoes: Conexao[] } | null>(null)
  const [fotos, setFotos] = useState<Record<string, string>>({})
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [denunciando, setDenunciando] = useState<Pessoa | null>(null)
  const escolas = useConsulta<Escola[]>(consultarEscolas)
  const noites = useConsulta<Noite[]>(consultarNoites)

  const carregar = useCallback(async () => {
    try {
      const d = await buscarGalera(meuId)
      setDados(d)
      const aprovadas = d.pessoas.filter((p) => p.foto_status === 'aprovada' && p.foto_path).map((p) => p.foto_path!)
      setFotos(await linksDasFotos(aprovadas))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [meuId])

  useEffect(() => { void carregar() }, [carregar])

  if (!dados) return <Carregando linhas={3} />

  const nomeEscola = (id: number | null) => (escolas.status === 'ok' ? escolas.dados.find((e) => e.id === id) : undefined)
  const conexaoCom = (id: string) => dados.conexoes.find((c) => c.de === id || c.para === id)
  const pedidos = dados.pessoas.filter((p) => dados.conexoes.some((c) => c.de === p.id && c.para === meuId && c.status === 'pendente'))

  const visiveis = dados.pessoas.filter((p) =>
    filtro === 'escola' ? minhaEscolaId != null && p.escola_coracao_id === minhaEscolaId
    : filtro === 'noites' ? p.noites.some((n) => minhasNoites.includes(n))
    : filtro === 'galera' ? p.procura_galera
    : true)

  async function agir(acao: () => PromiseLike<{ error: unknown }>, sucesso: string) {
    const { error } = await acao()
    if (error) return toast.error('Não deu certo. Tenta de novo.')
    toast(sucesso)
    await carregar()
  }

  const rotuloNoiteCurto = (id: number) => {
    const n = noites.status === 'ok' ? noites.dados.find((x) => x.id === id) : undefined
    return n ? formatarData(n.data, { day: '2-digit', month: '2-digit' }) : null
  }

  return (
    <>
      {pedidos.length > 0 && (
        <section aria-labelledby="titulo-pedidos" className="flex flex-col gap-2 rounded-[2rem] bg-lima p-4 text-tinta">
          <h2 id="titulo-pedidos" className="font-bold">Querem se conectar com você ({pedidos.length})</h2>
          {pedidos.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <AvatarPessoa nome={p.nome} url={p.foto_path ? fotos[p.foto_path] : undefined} semente={p.id} className="size-10" />
              <span className="min-w-0 flex-1 truncate font-semibold">@{p.usuario}</span>
              <Button size="icon-sm" className="rounded-full bg-tinta text-lima" aria-label={`Aceitar @${p.usuario}`} onClick={() => void agir(() => aceitarConexao(p.id), 'Conectados! 🤝')}>
                <Check />
              </Button>
              <Button size="icon-sm" variant="ghost" className="rounded-full" aria-label={`Recusar @${p.usuario}`} onClick={() => void agir(() => desfazerConexao(meuId, p.id), 'Pedido recusado.')}>
                <X />
              </Button>
            </div>
          ))}
        </section>
      )}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]" role="group" aria-label="Filtros">
        {([['todos', 'Todo mundo'], ['escola', '💖 Minha escola'], ['noites', '📅 Minhas noites'], ['galera', '🙋 Procurando galera']] as [Filtro, string][]).map(([f, r]) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
            className={cn('shrink-0 rounded-full border px-3 py-1.5 text-sm', filtro === f ? 'border-foreground bg-foreground text-background' : 'bg-card hover:bg-muted')}
          >
            {r}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <Vazio emoji="🦗" titulo="Ninguém por aqui ainda">
          <p className="max-w-64 text-sm text-muted-foreground">
            {filtro === 'escola' && minhaEscolaId == null ? 'Escolha sua escola do coração no perfil.' : 'A galera está chegando. Chama os amigos pro Concentra!'}
          </p>
        </Vazio>
      ) : (
        <ul className="cascata grid gap-3 md:grid-cols-2">
          {visiveis.map((p, i) => {
            const c = conexaoCom(p.id)
            const escola = nomeEscola(p.escola_coracao_id)
            return (
              <li key={p.id} style={{ '--i': i } as React.CSSProperties} className="flex flex-col gap-3 rounded-3xl bg-card p-4 ring-1 ring-border">
                <div className="flex items-start gap-3">
                  <AvatarPessoa nome={p.nome} url={p.foto_path ? fotos[p.foto_path] : undefined} semente={p.id} className="size-14 text-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.nome || p.usuario}</p>
                    <p className="truncate text-sm text-muted-foreground">@{p.usuario}</p>
                    {p.bio && <p className="mt-1 text-sm">{p.bio}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {escola && (
                    <button type="button" onClick={() => irParaEscola(escola.slug)}>
                      <Badge className="bg-rosa text-tinta">💖 {escola.nome}</Badge>
                    </button>
                  )}
                  {p.tipo_folia && p.tipo_folia in TIPOS_FOLIA && (
                    <Badge variant="secondary">{TIPOS_FOLIA[p.tipo_folia as TipoFolia].emoji} {TIPOS_FOLIA[p.tipo_folia as TipoFolia].rotulo}</Badge>
                  )}
                  {p.procura_galera && <Badge className="bg-lima text-tinta">🙋 Procura galera</Badge>}
                  {p.noites.map((n) => rotuloNoiteCurto(n)).filter(Boolean).map((r) => <Badge key={r} variant="outline">📅 {r}</Badge>)}
                  {p.setor && <Badge variant="outline">📍 {p.setor}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {!c && (
                    <Button size="sm" className="rounded-full" onClick={() => void agir(() => pedirConexao(meuId, p.id), 'Pedido enviado 🤞')}>
                      <UserPlus data-icon="inline-start" /> Conectar
                    </Button>
                  )}
                  {c?.status === 'pendente' && c.de === meuId && (
                    <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void agir(() => desfazerConexao(meuId, p.id), 'Pedido cancelado.')}>
                      Pedido enviado · cancelar
                    </Button>
                  )}
                  {c?.status === 'pendente' && c.para === meuId && (
                    <Button size="sm" className="rounded-full" onClick={() => void agir(() => aceitarConexao(p.id), 'Conectados! 🤝')}>
                      <Check data-icon="inline-start" /> Aceitar
                    </Button>
                  )}
                  {c?.status === 'aceita' && (
                    <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void agir(() => desfazerConexao(meuId, p.id), 'Conexão desfeita.')}>
                      🤝 Conectados · desfazer
                    </Button>
                  )}
                  <span className="flex-1" />
                  <Button size="icon-sm" variant="ghost" className="rounded-full text-muted-foreground" aria-label={`Denunciar @${p.usuario}`} onClick={() => setDenunciando(p)}>
                    <Flag />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full text-muted-foreground"
                    aria-label={`Bloquear @${p.usuario}`}
                    onClick={() => { if (confirm(`Bloquear @${p.usuario}? Vocês deixam de se ver e a conexão é desfeita.`)) void agir(() => bloquear(meuId, p.id), 'Bloqueado. Vocês não se veem mais.') }}
                  >
                    <Ban />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Cuidado com quem pede dinheiro, ingresso adiantado ou dados pessoais. Na dúvida, denuncie.
      </p>

      {/* key: cada denúncia começa com o formulário limpo */}
      <DialogDenuncia key={denunciando?.id ?? 'nenhum'} pessoa={denunciando} meuId={meuId} aoFechar={() => setDenunciando(null)} aoConcluir={carregar} />
    </>
  )
}

function DialogDenuncia({ pessoa, meuId, aoFechar, aoConcluir }: { pessoa: Pessoa | null; meuId: string; aoFechar: () => void; aoConcluir: () => Promise<void> }) {
  const [motivo, setMotivo] = useState<MotivoDenuncia | null>(null)
  const [detalhe, setDetalhe] = useState('')
  const [bloquearJunto, setBloquearJunto] = useState(true)

  async function enviar() {
    if (!pessoa || !motivo) return
    const { error } = await denunciar(meuId, pessoa.id, motivo, detalhe)
    if (error) return toast.error('Não deu para enviar a denúncia.')
    if (bloquearJunto) await bloquear(meuId, pessoa.id)
    toast('Denúncia enviada. Obrigado por cuidar da galera 💚', { description: 'A gente revisa e toma as medidas.' })
    aoFechar()
    if (bloquearJunto) await aoConcluir()
  }

  return (
    <Dialog open={pessoa != null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Denunciar @{pessoa?.usuario}</DialogTitle>
          <DialogDescription>A denúncia é anônima para a outra pessoa.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MOTIVOS_DENUNCIA) as MotivoDenuncia[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={motivo === m}
              onClick={() => setMotivo(m)}
              className={cn('rounded-full border px-3 py-1.5 text-sm', motivo === m ? 'border-destructive bg-destructive text-white' : 'hover:bg-muted')}
            >
              {MOTIVOS_DENUNCIA[m]}
            </button>
          ))}
        </div>
        <textarea
          value={detalhe}
          onChange={(e) => setDetalhe(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Conte o que aconteceu (opcional)"
          className="rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={bloquearJunto} onChange={(e) => setBloquearJunto(e.target.checked)} className="size-4" />
          Bloquear também
        </label>
        <DialogFooter>
          <Button variant="destructive" className="rounded-full" disabled={!motivo} onClick={() => void enviar()}>Enviar denúncia</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
