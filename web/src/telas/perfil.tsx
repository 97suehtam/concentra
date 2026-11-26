import { ChevronDown, Cloud, Download, LogOut, Mail, RotateCcw, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { PerfilComunidade } from '@/components/perfil-comunidade'
import { SeletorEscola } from '@/components/seletor-escola'
import { Sobretitulo, Titulo } from '@/components/titulo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConsulta } from '@/hooks/use-consulta'
import { CONQUISTAS, TIPOS_FOLIA, desbloquear, usePerfil, type Conquista, type TipoFolia } from '@/hooks/use-perfil'
import { irPara } from '@/hooks/use-rota'
import { baixarMeusDados, excluirConta } from '@/lib/comunidade'
import { soltarConfete } from '@/lib/confete'
import { ESCOLA_FIEL, alternarModoFiel, useModoFiel } from '@/lib/modo-fiel'
import { entrar, sair, useSessao } from '@/lib/sessao'
import { consultarNoites, rotuloNoite, type Noite } from '@/lib/supabase'
import { cn } from '@/lib/utils'


export function TelaPerfil() {
  const { perfil, atualizar } = usePerfil()
  const inicial = perfil.nome.trim()[0]?.toUpperCase() ?? '🎭'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Sobretitulo>Seu cantinho no app</Sobretitulo>
        <Titulo antes="Meu" destaque="perfil" cor="bg-ceu" />
      </div>

      {/* Desktop: quem você é (dados, escola, comunidade) | conquistas e conta */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-[2rem] bg-card p-5 ring-1 ring-border">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-lima font-heading text-2xl font-bold text-tinta">
            {inicial}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="nome" className="text-xs text-muted-foreground">Nome ou apelido</Label>
            <Input
              id="nome"
              value={perfil.nome}
              onChange={(e) => atualizar({ nome: e.target.value.slice(0, 40) })}
              placeholder="Como a gente te chama?"
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">No Anhembi, você é…</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TIPOS_FOLIA) as TipoFolia[]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={perfil.tipoFolia === t}
                onClick={() => atualizar({ tipoFolia: perfil.tipoFolia === t ? null : t })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  perfil.tipoFolia === t ? 'border-lima bg-lima text-tinta' : 'hover:bg-muted',
                )}
              >
                {TIPOS_FOLIA[t].emoji} {TIPOS_FOLIA[t].rotulo}
              </button>
            ))}
          </div>
        </div>
      </section>

      <EscolaDoCoracao />
      <PerfilComunidade />
      </div>
      <div className="flex flex-col gap-6">
      <Conquistas obtidas={perfil.conquistas} />
      <Conta />

      <button
        type="button"
        onClick={() => atualizar({ onboardingFeito: false })}
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="size-4" /> Rever a apresentação
      </button>
      </div>
      </div>
    </div>
  )
}

function EscolaDoCoracao() {
  const { perfil, atualizar } = usePerfil()
  const noites = useConsulta<Noite[]>(consultarNoites)
  const [aberto, setAberto] = useState(false)
  const modoFiel = useModoFiel()

  // Em que noite e posição a escola do coração entra
  const desfile = noites.status === 'ok' && perfil.escolaCoracao
    ? noites.dados.flatMap((n) => n.desfiles.map((d) => ({ n, d }))).find(({ d }) => d.escolas.slug === perfil.escolaCoracao)
    : undefined

  function escolher(nova: string | null) {
    atualizar({ escolaCoracao: nova })
    if (nova) {
      // Espera a folha descer para o confete sair do cartão rosa, já à vista
      setTimeout(() => soltarConfete(document.getElementById('titulo-coracao'), { quantidade: 16, emojis: ['💖', '💚', '✨'] }), 260)
      desbloquear('coracao-de-sambista')
    }
  }

  return (
    <section aria-labelledby="titulo-coracao" className="relative flex flex-col gap-3 overflow-hidden rounded-[2rem] bg-rosa p-5 text-tinta">
      {perfil.escolaCoracao === ESCOLA_FIEL
        ? <CoracaoFiel />
        : <span className="absolute -top-4 -right-2 text-8xl opacity-25" aria-hidden="true">💖</span>}
      <h2 id="titulo-coracao" className="text-xl font-bold">Escola do coração</h2>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={noites.status !== 'ok'}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-2xl bg-background px-4 text-left text-foreground transition-transform duration-200 ease-mola active:scale-[0.98] disabled:opacity-60"
        aria-haspopup="dialog"
      >
        <span className={cn('truncate', !desfile && 'text-muted-foreground')}>{desfile?.d.escolas.nome ?? 'Escolha sua escola'}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <SeletorEscola aberto={aberto} aoMudarAberto={setAberto} valor={perfil.escolaCoracao} aoEscolher={escolher} />
      {desfile && (
        <p className="text-sm font-medium">
          Desfila no {rotuloNoite(desfile.n)}, {desfile.d.ordem}ª a entrar. Ela ganha destaque no app todo. {modoFiel ? '🖤' : '💚'}
        </p>
      )}
    </section>
  )
}

// Easter egg "Modo Fiel" (lib/modo-fiel.ts): só existe para quem é Gaviões.
// Segurar o 💖 por 2 segundos liga ou desliga; pelo teclado, Enter ou espaço.
function CoracaoFiel() {
  const timer = useRef<number>(undefined)
  const [segurando, setSegurando] = useState(false)

  function soltar() {
    window.clearTimeout(timer.current)
    setSegurando(false)
  }

  return (
    <button
      type="button"
      aria-label="Segredo da Fiel"
      onPointerDown={() => {
        setSegurando(true)
        timer.current = window.setTimeout(() => { setSegurando(false); alternarModoFiel() }, 2000)
      }}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        alternarModoFiel()
      }}
      className={cn(
        'absolute -top-4 -right-2 cursor-default text-8xl select-none [-webkit-touch-callout:none] [touch-action:manipulation] focus-visible:opacity-60 focus-visible:outline-none',
        'transition-[opacity,scale] ease-linear',
        segurando ? 'scale-110 opacity-70 duration-[2000ms]' : 'opacity-25 duration-200',
      )}
    >
      <span aria-hidden="true">💖</span>
    </button>
  )
}

function Conquistas({ obtidas }: { obtidas: string[] }) {
  const modoFiel = useModoFiel()
  const todas = Object.entries(CONQUISTAS) as [Conquista, (typeof CONQUISTAS)[Conquista]][]
  const total = todas.filter(([id]) => obtidas.includes(id)).length

  return (
    <section aria-labelledby="titulo-conquistas" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="titulo-conquistas" className="text-xl font-bold">Conquistas</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{total}/{todas.length}</span>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {todas.map(([id, c]) => {
          const tem = obtidas.includes(id)
          return (
            <li
              key={id}
              className={cn('flex flex-col gap-1 rounded-3xl p-3 ring-1', tem ? 'bg-card ring-lima/50' : 'bg-card/40 ring-border')}
            >
              <span className={cn('text-2xl', !tem && 'opacity-40 grayscale')} aria-hidden="true">{tem ? (modoFiel && id === 'primeiro-coracao' ? '🖤' : c.emoji) : '🔒'}</span>
              <span className={cn('text-sm font-bold', !tem && 'text-muted-foreground')}>{tem ? c.titulo : '???'}</span>
              <span className="text-xs text-muted-foreground">{c.dica}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Conta() {
  const sessao = useSessao()
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'parado' | 'enviando' | 'enviado'>('parado')
  const [erro, setErro] = useState<string | null>(null)
  const [confirmarApagar, setConfirmarApagar] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function pedirLink(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    setErro(null)
    const falha = await entrar(email.trim())
    if (falha) {
      setErro(falha.includes('rate limit') ? 'Muitos pedidos seguidos. Espere alguns minutos e tente de novo.' : falha)
      setEstado('parado')
    } else {
      setEstado('enviado')
    }
  }

  if (sessao) {
    return (
      <section className="flex flex-col gap-3 rounded-[2rem] bg-card p-5 ring-1 ring-border">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-ceu text-tinta"><Cloud className="size-5" /></span>
          <div className="min-w-0">
            <p className="font-bold">Sincronizado na nuvem</p>
            <p className="truncate text-sm text-muted-foreground">{sessao.user.email}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Seu perfil e sua grade vão junto para qualquer aparelho em que você entrar.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="rounded-full" onClick={() => void sair()}>
            <LogOut data-icon="inline-start" /> Sair
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={() => void baixarMeusDados(sessao.user.id, sessao.user.email)}>
            <Download data-icon="inline-start" /> Baixar meus dados
          </Button>
        </div>
        {/* Excluir de verdade (LGPD): apaga a conta no Auth, a foto e tudo que depende dela */}
        <div className="flex flex-col gap-2 border-t pt-3">
          <Button
            variant="ghost"
            className="self-start rounded-full text-destructive"
            disabled={excluindo}
            onClick={async () => {
              if (!confirmarApagar) return setConfirmarApagar(true)
              setExcluindo(true)
              const erro = await excluirConta()
              setExcluindo(false)
              if (erro) toast.error(erro)
              else toast('Conta excluída. Tudo que estava na nuvem foi apagado.', { description: 'O que está neste aparelho continua aqui.' })
            }}
          >
            <Trash2 data-icon="inline-start" /> {excluindo ? 'Excluindo…' : confirmarApagar ? 'Toque de novo para excluir de vez' : 'Excluir minha conta'}
          </Button>
          {confirmarApagar && (
            <p className="text-xs text-muted-foreground">Apaga conta, perfil, foto, grade, conexões e bloqueios. Não dá para desfazer.</p>
          )}
        </div>
        <button type="button" className="self-start text-xs text-muted-foreground underline" onClick={() => irPara('privacidade')}>Política de privacidade</button>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-[2rem] bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-ceu text-tinta"><Cloud className="size-5" /></span>
        <div>
          <p className="font-bold">Leve sua grade para qualquer aparelho</p>
          <p className="text-sm text-muted-foreground">Opcional. Sem senha: a gente manda um link por e-mail.</p>
        </div>
      </div>

      {estado === 'enviado' ? (
        <p className="flex items-start gap-2 rounded-2xl bg-muted p-3 text-sm">
          <Mail className="mt-0.5 size-4 shrink-0" />
          <span>Link enviado para <b>{email}</b>. Abra o e-mail neste aparelho e toque no link para entrar.</span>
        </p>
      ) : (
        <form onSubmit={pedirLink} className="flex flex-col gap-2">
          <Label htmlFor="email" className="sr-only">E-mail</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-11 rounded-full px-4"
            />
            <Button type="submit" className="h-11 rounded-full px-5" disabled={estado === 'enviando'}>
              {estado === 'enviando' ? 'Enviando…' : 'Entrar'}
            </Button>
          </div>
          {erro && <p className="text-xs text-destructive">{erro}</p>}
        </form>
      )}
      <p className="text-xs text-muted-foreground">
        Guardamos só nome, escola do coração, tipo de folião, conquistas e grade. Seus ingressos continuam só no aparelho.{' '}
        <button type="button" className="underline" onClick={() => irPara('privacidade')}>Privacidade</button>
      </p>
    </section>
  )
}
