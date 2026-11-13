import { Camera, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AvatarPessoa } from '@/components/avatar-pessoa'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useConsulta } from '@/hooks/use-consulta'
import { usePerfil } from '@/hooks/use-perfil'
import { irPara } from '@/hooks/use-rota'
import { USUARIO_VALIDO, enviarFoto, linksDasFotos, removerFoto, useMeuPerfilComunidade } from '@/lib/comunidade'
import { soltarConfete } from '@/lib/confete'
import { consultarNoites, rotuloNoite, type Noite } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Bloco "Comunidade" do perfil. Só para quem está logado e declarou 18+.
// Perfil privado por padrão; ficar público é um consentimento explícito e reversível.
export function PerfilComunidade() {
  const { perfil: c, carregando, salvar, recarregar, sessao } = useMeuPerfilComunidade()
  const { perfil: local } = usePerfil()

  if (!sessao) {
    return (
      <section className="flex flex-col gap-2 rounded-[2rem] border border-dashed p-5">
        <h2 id="titulo-comunidade" className="flex scroll-mt-6 items-center gap-2 text-xl font-bold"><Users className="size-5" /> Comunidade</h2>
        <p className="text-sm text-muted-foreground">
          Ache gente que vai na mesma noite ou é da mesma escola. Para participar, entre na sua conta aqui embaixo. É só para maiores de 18.
        </p>
      </section>
    )
  }
  if (carregando || !c) return null

  return (
    <section aria-labelledby="titulo-comunidade" className="flex flex-col gap-4 rounded-[2rem] bg-card p-5 ring-1 ring-border">
      <h2 id="titulo-comunidade" className="flex scroll-mt-6 items-center gap-2 text-xl font-bold"><Users className="size-5" /> Comunidade</h2>
      {c.maior_18_em ? (
        <Formulario c={c} userId={sessao.user.id} nome={local.nome} salvar={salvar} recarregar={recarregar} />
      ) : (
        <Declaracao18 aoConfirmar={() => salvar({ maior_18_em: new Date().toISOString() })} />
      )}
    </section>
  )
}

function Declaracao18({ aoConfirmar }: { aoConfirmar: () => Promise<string | null> }) {
  const [marcado, setMarcado] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Na comunidade você monta um perfil público, vê quem vai na mesma noite e se conecta com outros foliões. Ela é só para maiores de 18 anos.
      </p>
      <label className="flex items-start gap-3 rounded-2xl bg-muted p-3 text-sm">
        <input type="checkbox" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} className="mt-0.5 size-5 accent-[var(--lima)]" />
        <span>Declaro que tenho <b>18 anos ou mais</b>. Sei que perfis de menores podem ser removidos.</span>
      </label>
      <Button className="h-11 self-start rounded-full px-6" disabled={!marcado} onClick={async () => { const e = await aoConfirmar(); if (e) toast.error(e) }}>
        Quero participar
      </Button>
    </div>
  )
}

type Props = {
  c: NonNullable<ReturnType<typeof useMeuPerfilComunidade>['perfil']>
  userId: string
  nome: string
  salvar: ReturnType<typeof useMeuPerfilComunidade>['salvar']
  recarregar: () => Promise<void>
}

function Formulario({ c, userId, nome, salvar, recarregar }: Props) {
  const noites = useConsulta<Noite[]>(consultarNoites)
  const [usuario, setUsuario] = useState(c.usuario ?? '')
  const [bio, setBio] = useState(c.bio ?? '')
  const [setor, setSetor] = useState(c.setor ?? '')
  const [minhasNoites, setMinhasNoites] = useState<number[]>(c.noites)
  const [procura, setProcura] = useState(c.procura_galera)
  const [salvando, setSalvando] = useState(false)
  const [links, setLinks] = useState<Record<string, string>>({})
  const entrada = useRef<HTMLInputElement>(null)
  const foto = c.foto_path ? links[c.foto_path] : undefined

  // A própria pessoa sempre vê a sua foto, mesmo em análise
  useEffect(() => {
    if (c.foto_path) void linksDasFotos([c.foto_path]).then(setLinks)
  }, [c.foto_path])

  const usuarioOk = USUARIO_VALIDO.test(usuario)
  const mudou = usuario !== (c.usuario ?? '') || bio !== (c.bio ?? '') || setor !== (c.setor ?? '') ||
    procura !== c.procura_galera || minhasNoites.join() !== c.noites.join()

  async function guardar() {
    setSalvando(true)
    const erro = await salvar({ usuario: usuario || null, bio: bio.trim() || null, setor: setor.trim() || null, noites: minhasNoites, procura_galera: procura })
    setSalvando(false)
    if (erro) toast.error(erro)
    else toast('Perfil da comunidade salvo 💚')
  }

  async function trocarPublico(publico: boolean, alvo: Element | null) {
    if (publico && (mudou || !c.usuario)) return toast.error('Salve seu @ antes de ficar público.')
    const erro = await salvar({ publico })
    if (erro) return toast.error(erro)
    if (publico) {
      soltarConfete(alvo, { quantidade: 14, emojis: ['💚', '🎉', '✨'] })
      toast('Você está na galera! 🎉', { description: 'Agora você vê e é visto por quem também é público.' })
    } else {
      toast('Perfil privado de novo. Ninguém mais vê você na galera.')
    }
  }

  async function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return
    const erro = await enviarFoto(userId, arquivo, c.foto_path)
    if (erro) return toast.error(erro)
    toast('Foto enviada 📸', { description: 'Ela aparece para a galera depois da análise.' })
    await recarregar()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Foto */}
      <div className="flex items-center gap-4">
        <AvatarPessoa nome={nome} url={foto} semente={userId} className="size-20 text-3xl" />
        <div className="flex flex-col items-start gap-1.5">
          <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void escolherFoto(e.target.files?.[0])} />
          <Button size="sm" variant="secondary" className="rounded-full" onClick={() => entrada.current?.click()}>
            <Camera data-icon="inline-start" /> {c.foto_path ? 'Trocar foto' : 'Pôr foto'}
          </Button>
          {c.foto_status === 'pendente' && <Badge variant="outline">⏳ Em análise</Badge>}
          {c.foto_status === 'aprovada' && <Badge className="bg-lima text-tinta">✓ Aprovada</Badge>}
          {c.foto_status === 'recusada' && <Badge variant="destructive">Recusada: envie outra</Badge>}
          {c.foto_path && (
            <button type="button" className="text-xs text-muted-foreground underline" onClick={async () => { await removerFoto(userId, c.foto_path!); await recarregar() }}>
              Tirar foto
            </button>
          )}
        </div>
      </div>

      {/* @ e bio */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="usuario" className="text-xs text-muted-foreground">Seu @ na galera</Label>
        <div className="flex items-center rounded-xl border bg-transparent focus-within:ring-2 focus-within:ring-ring">
          <span className="pl-3 text-muted-foreground">@</span>
          <Input
            id="usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20))}
            placeholder="seu_apelido"
            className="h-11 border-0 pl-1 focus-visible:ring-0"
            aria-invalid={usuario !== '' && !usuarioOk}
          />
        </div>
        {usuario !== '' && !usuarioOk && <p className="text-xs text-destructive">De 3 a 20: letras minúsculas, números, ponto e _.</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio" className="text-xs text-muted-foreground">Bio ({bio.length}/160)</Label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 160))}
          rows={2}
          placeholder="Ex.: sambista desde criança, bora no setor C!"
          className="rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Noites e setor */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Quais noites você vai?</span>
        <div className="flex flex-wrap gap-2">
          {noites.status === 'ok' && noites.dados.map((n) => {
            const vai = minhasNoites.includes(n.id)
            return (
              <button
                key={n.id}
                type="button"
                aria-pressed={vai}
                onClick={() => setMinhasNoites(vai ? minhasNoites.filter((x) => x !== n.id) : [...minhasNoites, n.id].sort())}
                className={cn('rounded-full border px-3 py-1.5 text-sm transition-colors', vai ? 'border-lima bg-lima text-tinta' : 'hover:bg-muted')}
              >
                {rotuloNoite(n)}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setor" className="text-xs text-muted-foreground">Setor (opcional)</Label>
        <Input id="setor" value={setor} onChange={(e) => setSetor(e.target.value.slice(0, 40))} placeholder="Ex.: Arquibancada, setor C" className="h-11 rounded-xl" />
        <p className="text-xs text-muted-foreground">Só o setor. Nunca ponha número de cadeira, telefone ou endereço.</p>
      </div>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>🙋 Procuro galera pra ir junto</span>
        <Switch checked={procura} onCheckedChange={setProcura} />
      </label>

      <Button className="h-11 rounded-full" disabled={!mudou || salvando || (usuario !== '' && !usuarioOk)} onClick={() => void guardar()}>
        {salvando ? 'Salvando…' : 'Salvar'}
      </Button>

      {/* Consentimento para ficar público */}
      <div className="flex flex-col gap-2 rounded-2xl bg-muted p-4">
        <label className="flex items-center justify-between gap-3 font-semibold" id="rotulo-publico">
          <span>{c.publico ? '🌍 Perfil público' : '🔒 Perfil privado'}</span>
          <Switch checked={c.publico} onCheckedChange={(v) => void trocarPublico(v, document.getElementById('rotulo-publico'))} aria-labelledby="rotulo-publico" />
        </label>
        <p className="text-xs text-muted-foreground">
          Público, você aparece para outras pessoas <b>maiores de 18, logadas e também públicas</b>: nome, @, foto aprovada, bio, escola do coração, tipo de folião, noites, setor e conquistas. Seu e-mail nunca aparece. Dá para voltar a privado quando quiser.{' '}
          <button type="button" className="underline" onClick={() => irPara('privacidade')}>Privacidade</button>
        </p>
      </div>

      {c.publico && (
        <Button variant="secondary" className="h-11 rounded-full" onClick={() => irPara('galera')}>
          <Users data-icon="inline-start" /> Ver a galera
        </Button>
      )}
    </div>
  )
}
