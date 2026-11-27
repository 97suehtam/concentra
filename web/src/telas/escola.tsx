import { ArrowLeft, ChevronRight, ExternalLink, Heart, Music, Play, ScrollText, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AvatarPessoa } from '@/components/avatar-pessoa'
import { Carregando, Erro, Vazio } from '@/components/estados'
import { Sobretitulo, Titulo } from '@/components/titulo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConsulta } from '@/hooks/use-consulta'
import { useFavoritos } from '@/hooks/use-favoritos'
import { desbloquear, usePerfil } from '@/hooks/use-perfil'
import { useSegurar } from '@/hooks/use-segurar'
import { irPara, useSlugEscola } from '@/hooks/use-rota'
import { CORES_VIVAS, diasAte } from '@/lib/app'
import { soltarConfete } from '@/lib/confete'
import { buscarGalera, linksDasFotos, useMeuPerfilComunidade, type Pessoa } from '@/lib/comunidade'
import { favoritarComFesta } from '@/lib/favoritar'
import { ESCOLA_FIEL, alternarModoFiel } from '@/lib/modo-fiel'
import { aoCarregar, spotifyEmbed, youtubeEmbed } from '@/lib/midia'
import { consultarEscola, consultarNoites, formatarData, type EscolaDetalhe, type Noite } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Página da escola (#/escola/<slug>). Mostra só o que já tem fonte:
// o que falta curar aparece como "a divulgar", nunca inventado.
export function TelaEscola() {
  const slug = useSlugEscola()
  const estado = useConsulta<EscolaDetalhe | null>(consultarEscola(slug))

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" className="-ml-2 self-start rounded-full" onClick={voltar}>
        <ArrowLeft data-icon="inline-start" /> Voltar
      </Button>

      {estado.status === 'carregando' && <Carregando linhas={3} />}
      {estado.status === 'erro' && <Erro titulo="Não deu para carregar a escola" mensagem={estado.mensagem} />}
      {estado.status === 'ok' && !estado.dados && (
        <Vazio emoji="🤔" titulo="Escola não encontrada">
          <Button className="mt-2 rounded-full" onClick={() => irPara('desfiles')}>Ver os desfiles</Button>
        </Vazio>
      )}
      {estado.status === 'ok' && estado.dados && <Conteudo escola={estado.dados} />}
    </div>
  )
}

// Volta para onde a pessoa estava; quem abriu o link direto cai nos desfiles
function voltar() {
  if (window.history.length > 1) window.history.back()
  else irPara('desfiles')
}

function Conteudo({ escola: e }: { escola: EscolaDetalhe }) {
  const desfile = e.desfiles[0] // uma participação por edição
  const cor = desfile ? CORES_VIVAS[(desfile.ordem - 1) % CORES_VIVAS.length] : 'bg-lavanda'
  const noticias = e.noticias_escolas
    .map((n) => n.noticias)
    .sort((a, b) => (b.publicada_em ?? '').localeCompare(a.publicada_em ?? ''))

  return (
    <>
      <div className="flex flex-col gap-2">
        <Sobretitulo>{desfile ? `${desfile.noites.grupos.nome} · Carnaval 2027` : 'Escola da Liga-SP'}</Sobretitulo>
        <Titulo destaque={e.nome} cor={cor} />
      </div>

      <div className="lg:max-w-md"><Acoes escola={e} /></div>

      {/* Desktop: duas colunas (desfile, galera e história | samba e notícias).
          No celular as colunas somem (display: contents) e a ordem volta a ser a de sempre pelo `order`. */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-1">
            {desfile ? <CardDesfile desfile={desfile} cor={cor} slug={e.slug} /> : (
              <Vazio emoji="📅" titulo="Fora da programação de 2027">
                <p className="max-w-64 text-sm text-muted-foreground">Essa escola não aparece na ordem de desfiles divulgada pela Liga-SP.</p>
              </Vazio>
            )}
          </div>
          <div className="order-2 empty:hidden"><QuemTambemVai escola={e} /></div>
          <div className="order-4"><Sobre escola={e} /></div>
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-3"><Samba escola={e} /></div>
          <div className="order-5"><Noticias noticias={noticias} /></div>
        </div>
      </div>
    </>
  )
}

function Noticias({ noticias }: { noticias: EscolaDetalhe['noticias_escolas'][number]['noticias'][] }) {
  return (
    <>
      <section aria-labelledby="titulo-noticias-escola" className="flex flex-col gap-3">
        <h2 id="titulo-noticias-escola" className="text-xl font-bold">Notícias</h2>
        {noticias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma notícia citando a escola por enquanto.</p>
        ) : (
          <ul className="cascata flex flex-col gap-2">
            {noticias.slice(0, 6).map((n, i) => (
              <li key={n.id} style={{ '--i': i } as React.CSSProperties}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-1 rounded-3xl bg-card p-4 ring-1 ring-border transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{n.fontes.nome.split(' – ')[0]}</span>
                    {n.publicada_em && <span>· {formatarData(n.publicada_em, { day: '2-digit', month: 'short' })}</span>}
                    <ExternalLink className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="leading-snug font-semibold">{n.titulo}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

// Grade e escola do coração, lado a lado
function Acoes({ escola: e }: { escola: EscolaDetalhe }) {
  const favoritos = useFavoritos()
  const { perfil, atualizar } = usePerfil()
  // A festa de favoritar (easter eggs da noite inteira) precisa da noite completa
  const noites = useConsulta<Noite[]>(consultarNoites)
  const noite = noites.status === 'ok'
    ? noites.dados.find((n) => n.desfiles.some((d) => d.escolas.slug === e.slug))
    : undefined
  const favorita = favoritos.ehFavorita(e.slug)
  const doCoracao = perfil.escolaCoracao === e.slug
  // Easter egg "Modo Fiel": na página da Gaviões, já do coração, segurar o botão 2s liga ou desliga
  const fiel = doCoracao && e.slug === ESCOLA_FIEL
  const segurar = useSegurar(alternarModoFiel, { ativo: fiel })

  function alternarGrade(botao: HTMLButtonElement) {
    if (noite) {
      favoritarComFesta({ slug: e.slug, botao, noite, alternar: favoritos.alternar, lerFavoritas: favoritos.atual })
    } else {
      favoritos.alternar(e.slug)
    }
  }

  function alternarCoracao(botao: HTMLButtonElement) {
    atualizar({ escolaCoracao: doCoracao ? null : e.slug })
    if (!doCoracao) {
      soltarConfete(botao, { quantidade: 16, emojis: ['💖', '💚', '✨'] })
      desbloquear('coracao-de-sambista')
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        size="lg"
        variant={favorita ? 'default' : 'secondary'}
        className="h-12 rounded-full"
        aria-pressed={favorita}
        onClick={(ev) => alternarGrade(ev.currentTarget)}
      >
        <Heart data-icon="inline-start" className={cn(favorita && 'fill-current')} />
        {favorita ? 'Na minha grade' : 'Pôr na grade'}
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className={cn(
          'h-12 rounded-full', doCoracao && 'bg-rosa text-tinta hover:bg-rosa/90',
          fiel && 'select-none [-webkit-touch-callout:none] [touch-action:none] transition-[scale] ease-linear',
          fiel && (segurar.segurando ? 'scale-105 duration-[2000ms]' : 'duration-200'),
        )}
        aria-pressed={doCoracao}
        {...segurar.handlers}
        onClick={(ev) => { if (!segurar.engolirClique()) alternarCoracao(ev.currentTarget) }}
      >
        <span aria-hidden="true">💖</span>
        {doCoracao ? 'Do coração' : 'É do coração?'}
      </Button>
    </div>
  )
}

function CardDesfile({ desfile: d, cor, slug }: { desfile: EscolaDetalhe['desfiles'][number]; cor: string; slug: string }) {
  const dias = diasAte(d.noites.data)

  return (
    <section aria-labelledby="titulo-desfile" className="flex flex-col gap-4 rounded-[2rem] bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-4">
        <div
          className={cn('vt-ordem flex size-20 shrink-0 flex-col items-center justify-center rounded-3xl text-tinta', cor)}
          style={{ viewTransitionName: `ordem-${slug}` }}
        >
          <span className="font-heading text-4xl leading-none font-bold">{d.ordem}º</span>
          <span className="text-[10px] font-medium uppercase">a entrar</span>
        </div>
        <div className="min-w-0">
          <h2 id="titulo-desfile" className="text-lg font-bold first-letter:uppercase">
            {formatarData(d.noites.data, { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {d.horario_previsto ? `Previsão: ${d.horario_previsto.slice(0, 5)}` : 'Horário sai quando a Liga divulgar'}
          </p>
          {dias > 0 && <p className="mt-1 text-sm font-medium">Faltam {dias} {dias === 1 ? 'dia' : 'dias'} 🥁</p>}
        </div>
      </div>

      <dl className="flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground uppercase">Enredo</dt>
          <dd className="font-semibold">
            {d.enredo_titulo ?? <span className="font-normal text-muted-foreground italic">A divulgar</span>}
            {d.enredo_titulo && !d.verificado && (
              <Badge variant="outline" className="ml-2 align-middle text-muted-foreground" title="Veio de agregador, ainda não conferido no canal da escola">
                a confirmar
              </Badge>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground uppercase">Carnavalesco</dt>
          <dd className="font-semibold">{d.carnavalesco ?? <span className="font-normal text-muted-foreground italic">A divulgar</span>}</dd>
        </div>
      </dl>

      {d.enredo_sinopse_url && (
        <div className="flex flex-wrap gap-2">
          <LinkExterno href={d.enredo_sinopse_url} Icone={ScrollText}>Sinopse</LinkExterno>
        </div>
      )}

      <Button size="lg" className="h-12 rounded-full" onClick={() => irPara('ingressos')}>
        <Ticket data-icon="inline-start" /> Ingressos dessa noite
      </Button>

      {d.fonte_url && (
        <a href={d.fonte_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline">
          Fonte do enredo
        </a>
      )}
    </section>
  )
}

// Pessoas da comunidade com essa escola no coração ou que vão na noite dela.
// O banco só devolve quem pode ser visto; para quem ainda não participa, vira convite.
function QuemTambemVai({ escola: e }: { escola: EscolaDetalhe }) {
  const { perfil: eu, sessao } = useMeuPerfilComunidade()
  const [pessoas, setPessoas] = useState<Pessoa[] | null>(null)
  const [fotos, setFotos] = useState<Record<string, string>>({})
  const noiteId = e.desfiles[0]?.noites.id
  const participa = Boolean(sessao && eu?.publico)

  useEffect(() => {
    if (!participa || !sessao) return
    void buscarGalera(sessao.user.id).then(async ({ pessoas: todas }) => {
      const daqui = todas.filter((p) => p.escola_coracao_id === e.id || (noiteId != null && p.noites.includes(noiteId)))
      setPessoas(daqui)
      setFotos(await linksDasFotos(daqui.filter((p) => p.foto_status === 'aprovada' && p.foto_path).map((p) => p.foto_path!)))
    }).catch(() => setPessoas([]))
  }, [participa, sessao, e.id, noiteId])

  if (!participa) {
    return (
      <button type="button" onClick={() => irPara('perfil')} className="flex items-center gap-3 rounded-3xl border border-dashed p-4 text-left text-sm">
        <span className="text-2xl" aria-hidden="true">🙌</span>
        <span className="text-muted-foreground">Quer ver quem mais curte a {e.nome}? Monte seu perfil na comunidade (18+).</span>
      </button>
    )
  }
  if (!pessoas || pessoas.length === 0) return null

  return (
    <button type="button" onClick={() => irPara('galera')} className="flex items-center gap-3 rounded-3xl bg-card p-4 text-left ring-1 ring-border transition-colors hover:bg-muted">
      <span className="flex -space-x-3">
        {pessoas.slice(0, 4).map((p) => (
          <AvatarPessoa key={p.id} nome={p.nome} url={p.foto_path ? fotos[p.foto_path] : undefined} semente={p.id} className="size-9 ring-2 ring-card" />
        ))}
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <b>{pessoas.length} {pessoas.length === 1 ? 'pessoa' : 'pessoas'} da galera</b>{' '}
        <span className="text-muted-foreground">curtem a {e.nome} ou vão nessa noite</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  )
}

// Samba de 2027 (clipe e letra oficiais) e o samba no Spotify da Liga-SP (desde 27/11/2026, o álbum de 2027).
// A letra não fica no app (direito autoral): o botão leva à página oficial.
function Samba({ escola: e }: { escola: EscolaDetalhe }) {
  const d = e.desfiles[0]
  const video = d?.samba_video_url ? youtubeEmbed(d.samba_video_url) : null
  const spotify = e.ultimo_samba_spotify_url ? spotifyEmbed(e.ultimo_samba_spotify_url) : null
  const tem2027 = Boolean(d?.samba_titulo || d?.samba_video_url || d?.samba_letra_url || d?.samba_audio_url)

  return (
    <section aria-labelledby="titulo-samba" className="flex flex-col gap-3">
      <h2 id="titulo-samba" className="text-xl font-bold">Samba-enredo 🎶</h2>

      {tem2027 ? (
        <div className="flex flex-col gap-3 rounded-[2rem] bg-card p-5 ring-1 ring-border">
          <p className="text-xs text-muted-foreground uppercase">Carnaval 2027</p>
          {d.samba_titulo && <p className="font-semibold">{d.samba_titulo}</p>}
          {video && <VideoYoutube src={video} titulo={`Samba-enredo 2027 da ${e.nome}`} />}
          <div className="flex flex-wrap gap-2">
            {d.samba_letra_url && <LinkExterno href={d.samba_letra_url} Icone={ScrollText}>Ver a letra</LinkExterno>}
            {d.samba_video_url && !video && <LinkExterno href={d.samba_video_url} Icone={Music}>Ver o clipe</LinkExterno>}
            {d.samba_audio_url && <LinkExterno href={d.samba_audio_url} Icone={Music}>Ouvir o samba</LinkExterno>}
          </div>
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed p-4 text-sm text-muted-foreground">
          🎤 O samba de 2027 ainda não chegou aqui. A Liga-SP está gravando os clipes das 32 escolas e solta no canal oficial; assim que sair, aparece nesta página.
        </p>
      )}

      {spotify && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {e.ultimo_samba_ano === 2027
              ? 'Ouça no Spotify, no álbum oficial 2027 da Liga-SP:'
              : e.ultimo_samba_ano ? `O último samba no Spotify (${e.ultimo_samba_ano}), do álbum oficial da Liga-SP:` : 'O último samba no Spotify, do álbum oficial da Liga-SP:'}
          </p>
          {/* Fundo no lugar do player enquanto ele carrega; o player entra com fade */}
          <div className="h-[152px] overflow-hidden rounded-2xl bg-muted">
            <iframe
              src={spotify}
              title={`${e.ultimo_samba_titulo ?? 'Samba-enredo'} · ${e.nome} no Spotify`}
              className="suave size-full border-0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              onLoad={aoCarregar}
            />
          </div>
        </div>
      )}
    </section>
  )
}

// Só carrega o player do YouTube quando a pessoa toca: a página abre mais rápido
function VideoYoutube({ src, titulo }: { src: string; titulo: string }) {
  const [tocando, setTocando] = useState(false)
  const id = src.match(/embed\/([\w-]{11})/)?.[1]

  return tocando ? (
    <iframe
      src={`${src}&autoplay=1`}
      title={titulo}
      className="aspect-video w-full rounded-2xl border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  ) : (
    <button
      type="button"
      onClick={() => setTocando(true)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-muted"
      aria-label={`Tocar o clipe: ${titulo}`}
    >
      {id && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="suave size-full object-cover" loading="lazy" onLoad={aoCarregar} />}
      <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-lima text-tinta shadow-lg transition-transform group-hover:scale-110">
        <Play className="ml-1 size-7 fill-current" />
      </span>
    </button>
  )
}

// História, fundação, bairro e redes: só aparecem depois de curados (CLAUDE.md, passo 4)
function Sobre({ escola: e }: { escola: EscolaDetalhe }) {
  const fatos = [
    e.fundacao && { rotulo: 'Fundação', valor: formatarData(e.fundacao, { year: 'numeric' }) },
    e.bairro && { rotulo: 'Bairro', valor: e.bairro },
    e.cores?.length && { rotulo: 'Cores', valor: e.cores.join(', ') },
  ].filter((f): f is { rotulo: string; valor: string } => Boolean(f))
  const redes = [
    e.site_url && { href: e.site_url, rotulo: 'Site oficial' },
    e.instagram_url && { href: e.instagram_url, rotulo: 'Instagram' },
    e.youtube_url && { href: e.youtube_url, rotulo: 'YouTube' },
  ].filter((r): r is { href: string; rotulo: string } => Boolean(r))
  const vazio = fatos.length === 0 && redes.length === 0 && !e.historia_md

  return (
    <section aria-labelledby="titulo-sobre" className="flex flex-col gap-3">
      <h2 id="titulo-sobre" className="text-xl font-bold">Sobre a escola</h2>
      {vazio ? (
        <p className="rounded-3xl border border-dashed p-4 text-sm text-muted-foreground">
          📚 A gente está conferindo a história, a fundação e os perfis oficiais direto nos canais da escola. Logo aparece aqui.
        </p>
      ) : (
        <>
          {fatos.length > 0 && (
            <dl className="grid grid-cols-3 gap-2">
              {fatos.map((f) => (
                <div key={f.rotulo} className="rounded-2xl bg-card p-3 ring-1 ring-border">
                  <dt className="text-xs text-muted-foreground">{f.rotulo}</dt>
                  <dd className="font-semibold">{f.valor}</dd>
                </div>
              ))}
            </dl>
          )}
          {e.historia_md && (
            <div className="flex flex-col gap-2 text-sm leading-relaxed whitespace-pre-line">
              {e.historia_md}
              {e.historia_fonte_url && (
                <a href={e.historia_fonte_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline">
                  {e.historia_fonte_url.includes('wikipedia.org') ? 'Resumo com base na Wikipedia (CC BY-SA)' : 'Fonte'}
                </a>
              )}
            </div>
          )}
          {redes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {redes.map((r) => <LinkExterno key={r.href} href={r.href}>{r.rotulo}</LinkExterno>)}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function LinkExterno({ href, Icone = ExternalLink, children }: { href: string; Icone?: typeof ExternalLink; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-10 items-center gap-1.5 rounded-full bg-muted px-4 text-sm font-medium transition-colors hover:bg-secondary"
    >
      <Icone className="size-4" /> {children}
    </a>
  )
}
