import { ChevronRight, Play, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { CardEscola } from '@/components/card-escola'
import { Carregando, Erro, Vazio } from '@/components/estados'
import { JogoBateria, recordeBateria } from '@/components/jogo-bateria'
import { Sobretitulo, Titulo } from '@/components/titulo'
import { Button } from '@/components/ui/button'
import { useConsulta } from '@/hooks/use-consulta'
import { useFavoritos } from '@/hooks/use-favoritos'
import { desbloquear, usePerfil } from '@/hooks/use-perfil'
import { irPara, transicao } from '@/hooks/use-rota'
import { PRIMEIRO_DESFILE, diasAte } from '@/lib/app'
import { formatarNota } from '@/lib/bateria-ritmo'
import { contarPedidos, useMeuPerfilComunidade } from '@/lib/comunidade'
import { favoritarComFesta } from '@/lib/favoritar'
import { consultarNoites, formatarData, type Noite } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Noite selecionada fica na sessão: a tela desmonta ao abrir uma escola e remonta ao voltar
const CHAVE_NOITE = 'concentra:noite'
function lerNoite() {
  try { return Number(sessionStorage.getItem(CHAVE_NOITE)) || null } catch { return null }
}
function guardarNoite(id: number) {
  try { sessionStorage.setItem(CHAVE_NOITE, String(id)) } catch { /* sem storage: só não lembra */ }
}

export function TelaDesfiles() {
  const estado = useConsulta<Noite[]>(consultarNoites)
  // Começa na última noite escolhida: ao voltar de uma escola, a Home reabre na mesma lista
  const [noiteId, setNoiteIdLocal] = useState<number | null>(lerNoite)
  const setNoiteId = (id: number) => { guardarNoite(id); setNoiteIdLocal(id) }
  const favoritos = useFavoritos()
  const { perfil } = usePerfil()
  const primeiroNome = perfil.nome.trim().split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Sobretitulo>E aí, {primeiroNome || 'folião'} 👋</Sobretitulo>
        <Titulo antes="Bora montar o seu" destaque="carnaval!" />
      </div>

      {/* Desktop: contagem à esquerda, jogo e galera empilhados à direita */}
      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <Contagem noites={estado.status === 'ok' ? estado.dados : null} />
        <div className="grid gap-3">
          <CardJogo />
          <CardGalera />
        </div>
      </div>

      {estado.status === 'carregando' && <Carregando />}
      {estado.status === 'erro' && <Erro titulo="Não deu para carregar os desfiles" mensagem={estado.mensagem} />}
      {estado.status === 'ok' && (() => {
        const noites = estado.dados
        const noite = noites.find((n) => n.id === noiteId) ?? noites[0]
        return (
          <section aria-labelledby="titulo-noite" className="flex flex-col gap-4">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Noites de desfile">
              {noites.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  role="tab"
                  aria-selected={n.id === noite.id}
                  onClick={(e) => {
                    if (n.id === noite.id) return
                    // A lista desliza no sentido da noite escolhida; a aba rola até ficar à vista
                    const sentido = i > noites.indexOf(noite) ? 'noite-frente' : 'noite-volta'
                    transicao(sentido, () => flushSync(() => setNoiteId(n.id)))
                    // Centraliza a aba rolando só a faixa de abas (scrollIntoView também rolaria a página)
                    const aba = e.currentTarget.getBoundingClientRect(), faixa = e.currentTarget.parentElement!
                    const centro = aba.left - faixa.getBoundingClientRect().left + faixa.scrollLeft - (faixa.clientWidth - aba.width) / 2
                    faixa.scrollTo({ left: centro, behavior: 'smooth' })
                  }}
                  className={cn(
                    'flex shrink-0 flex-col items-start rounded-2xl border px-4 py-2 text-left transition-colors',
                    n.id === noite.id ? 'border-foreground bg-foreground text-background' : 'bg-card hover:bg-muted',
                  )}
                >
                  <span className="text-sm font-bold">{n.grupos.nome}</span>
                  <span className={cn('text-xs', n.id === noite.id ? 'text-background/70' : 'text-muted-foreground')}>
                    {formatarData(n.data, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </span>
                </button>
              ))}
            </div>

            {/* lista-noite: o bloco que desliza ao trocar de noite (index.css) */}
            <div className="lista-noite flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 id="titulo-noite" className="text-xl font-bold first-letter:uppercase">
                {formatarData(noite.data, { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              {noite.desfiles.length > 0 && (
                <span className="text-sm text-muted-foreground">{noite.desfiles.length} escolas</span>
              )}
            </div>

            {/* Campeãs: as escolas só são conhecidas depois da apuração */}
            {noite.desfiles.length === 0 ? (
              <Vazio emoji="🏆" titulo="Quem volta pra avenida?">
                <p className="max-w-64 text-sm text-muted-foreground">
                  As escolas do Desfile das Campeãs saem na apuração. O ingresso já está à venda.
                </p>
                <Button size="lg" className="mt-2 h-12 rounded-full px-6" onClick={() => irPara('ingressos')}>
                  <Ticket data-icon="inline-start" /> Ver ingressos
                </Button>
              </Vazio>
            ) : (
            <div className="cascata grid gap-3 md:grid-cols-2">
              {noite.desfiles.map((d, i) => (
                <CardEscola
                  key={d.escolas.slug}
                  indice={i}
                  desfile={d}
                  favorita={favoritos.ehFavorita(d.escolas.slug)}
                  doCoracao={perfil.escolaCoracao === d.escolas.slug}
                  aoFavoritar={(botao) =>
                    favoritarComFesta({
                      slug: d.escolas.slug,
                      botao,
                      noite,
                      alternar: favoritos.alternar,
                      lerFavoritas: favoritos.atual,
                    })}
                />
              ))}
              <p className="text-center text-xs text-muted-foreground md:col-span-2">
                Ordem oficial da Liga-SP. Horários saem quando a Liga divulgar.
              </p>
            </div>
            )}
            </div>
          </section>
        )
      })()}
    </div>
  )
}

// Atalho para o jogo da bateria, para o tempo de fila
function CardJogo() {
  const [aberto, setAberto] = useState(false)
  const recorde = recordeBateria.useValor()

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="group flex items-center gap-4 rounded-[2rem] bg-lavanda p-4 text-left text-tinta transition-transform active:scale-[0.98]"
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-tinta text-3xl transition-transform group-hover:-rotate-6" aria-hidden="true">
          🥁
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-lg font-bold">Assume a bateria</span>
          <span className="block text-sm opacity-80">
            {recorde.nota != null ? `Seu recorde: nota ${formatarNota(recorde.nota)}. Bate de novo?` : 'Jogo de 1 minuto pra passar o tempo na fila'}
          </span>
        </span>
        <Play className="size-6 shrink-0 fill-current" />
      </button>
      {aberto && <JogoBateria aoFechar={() => setAberto(false)} />}
    </>
  )
}

// Atalho para a Galera. O texto muda conforme a pessoa já participa ou não,
// e mostra quantos pedidos de conexão estão esperando resposta.
function CardGalera() {
  const { perfil: eu, sessao } = useMeuPerfilComunidade()
  const participa = Boolean(sessao && eu?.publico)
  const [pedidos, setPedidos] = useState(0)

  useEffect(() => {
    if (participa && sessao) void contarPedidos(sessao.user.id).then(setPedidos)
  }, [participa, sessao])

  return (
    <button
      type="button"
      onClick={() => {
        if (participa) return irPara('galera')
        // Quem ainda não participa vai direto ao bloco Comunidade do perfil (depois da transição)
        irPara('perfil')
        setTimeout(() => document.getElementById('titulo-comunidade')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450)
      }}
      className="group flex items-center gap-4 rounded-[2rem] bg-rosa p-4 text-left text-tinta transition-transform duration-200 ease-mola active:scale-[0.98]"
    >
      <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-tinta text-3xl transition-transform group-hover:rotate-6" aria-hidden="true">
        🙌
        {pedidos > 0 && (
          <span key={pedidos} className="animar-pulo absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-lima text-xs font-bold text-tinta ring-2 ring-rosa">
            {pedidos}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-lg font-bold">{participa ? 'Ver a galera' : 'Ache sua galera'}</span>
        <span className="block text-sm opacity-80">
          {!participa
            ? 'Veja quem vai na mesma noite ou é da mesma escola (18+)'
            : pedidos > 0
              ? `${pedidos} ${pedidos === 1 ? 'pessoa quer' : 'pessoas querem'} se conectar com você`
              : 'Quem também vai pro Anhembi'}
        </span>
      </span>
      <ChevronRight className="size-6 shrink-0" />
    </button>
  )
}

// Card lima com contagem regressiva. Easter egg: cada toque mostra outra frase.
// Com escola do coração, a primeira frase conta os dias até ela entrar na avenida.
function Contagem({ noites }: { noites: Noite[] | null }) {
  const { perfil } = usePerfil()
  const [frase, setFrase] = useState(0)

  const daEscola = perfil.escolaCoracao && noites
    ? noites.flatMap((n) => n.desfiles.map((d) => ({ n, d }))).find(({ d }) => d.escolas.slug === perfil.escolaCoracao)
    : undefined
  const dias = diasAte(PRIMEIRO_DESFILE)
  const diasEscola = daEscola ? diasAte(daEscola.n.data) : null

  const frases =
    dias > 0
      ? [
          diasEscola && diasEscola > 0
            ? { numero: diasEscola, texto: `dias pra ${daEscola!.d.escolas.nome} entrar na avenida` }
            : { numero: dias, texto: dias === 1 ? 'dia pro primeiro desfile' : 'dias pro primeiro desfile' },
          { numero: dias, texto: 'noites pra decorar os sambas' },
          { numero: dias * 3, texto: 'vezes ouvindo o samba da sua escola (no mínimo)' },
          { numero: dias, texto: 'dias. Já separou a fantasia?' },
        ]
      : [{ numero: '🎉', texto: 'É carnaval! Bora pro Anhembi' }]
  const atual = frases[frase % frases.length]

  function proxima() {
    setFrase((f) => f + 1)
    if (frase + 1 === frases.length - 1 && frases.length > 1) desbloquear('curioso') // viu todas as frases
  }

  return (
    <button
      type="button"
      onClick={proxima}
      className="group relative overflow-hidden rounded-[2rem] bg-lima p-5 text-left text-tinta transition-transform active:scale-[0.98]"
      aria-label={`${atual.numero} ${atual.texto}. Toque para outra frase.`}
    >
      <span className="absolute -top-6 -right-4 text-8xl opacity-25 transition-transform duration-500 group-hover:rotate-12" aria-hidden="true">
        🥁
      </span>
      <span className="text-xs font-semibold tracking-wide uppercase">Contagem pro Anhembi</span>
      <span key={frase} className="mt-1 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
        <span className="font-heading text-6xl leading-none font-bold tabular-nums">{atual.numero}</span>
        <span className="max-w-44 text-sm leading-tight font-medium">{atual.texto}</span>
      </span>
      <span className="mt-3 block text-xs opacity-70">30/01 · Acesso II abre a festa</span>
    </button>
  )
}
