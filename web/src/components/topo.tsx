import { Cloud, Drum } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { desbloquear, usePerfil } from '@/hooks/use-perfil'
import { irPara } from '@/hooks/use-rota'
import { NOME_APP } from '@/lib/app'
import { soltarConfete } from '@/lib/confete'
import { useSessao } from '@/lib/sessao'
import { cn } from '@/lib/utils'

const TOQUES_PARA_BATERIA = 7

// Topo do celular e do tablet. No desktop quem mostra logo e avatar é a barra lateral.
export function Topo() {
  return (
    <header className="flex items-center justify-between pt-[max(1.25rem,env(safe-area-inset-top))] lg:hidden">
      <Marca />
      <AvatarPerfil />
    </header>
  )
}

// Easter egg: 7 toques rápidos no logo ligam/desligam o "modo bateria"
export function Marca() {
  const toques = useRef<number[]>([])

  function tocarLogo(e: React.MouseEvent<HTMLButtonElement>) {
    const agora = Date.now()
    toques.current = [...toques.current.filter((t) => agora - t < 2500), agora]
    e.currentTarget.classList.remove('animar-pulo')
    void e.currentTarget.offsetWidth // reinicia a animação
    e.currentTarget.classList.add('animar-pulo')

    if (toques.current.length < TOQUES_PARA_BATERIA) return
    toques.current = []
    const ligou = document.documentElement.classList.toggle('modo-bateria')
    if (ligou) {
      desbloquear('modo-bateria', { avisar: false })
      soltarConfete(e.currentTarget, { quantidade: 20, emojis: ['🥁', '🎵', '🎺', '🎶'] })
      toast('🥁 Modo bateria ligado!', { description: 'Sente o surdo de primeira. Toque 7x de novo para parar.' })
    } else {
      toast('Bateria em recuo 🤫')
    }
  }

  return (
    <button type="button" onClick={tocarLogo} className="marca flex items-center gap-2" aria-label={NOME_APP}>
      <span className="flex size-10 items-center justify-center rounded-2xl bg-lima text-tinta shadow-[0_0_24px_-4px] shadow-lima/60">
        <Drum className="size-5" />
      </span>
      <span className="font-heading text-lg font-bold">{NOME_APP}</span>
    </button>
  )
}

// Avatar leva ao perfil, como o avatar no topo da referência. Com login, ganha o selo da nuvem.
export function AvatarPerfil({ className }: { className?: string }) {
  const { perfil } = usePerfil()
  const sessao = useSessao()
  const inicial = perfil.nome.trim()[0]?.toUpperCase()

  return (
    <button
      type="button"
      onClick={() => irPara('perfil')}
      aria-label="Meu perfil"
      className={cn(
        'relative flex size-10 shrink-0 items-center justify-center rounded-full bg-lavanda font-heading font-bold text-tinta ring-2 ring-background transition-transform active:scale-90',
        className,
      )}
    >
      {inicial ?? '🎭'}
      {sessao && (
        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-ceu text-tinta ring-2 ring-background" title="Sincronizado">
          <Cloud className="size-3" />
        </span>
      )}
    </button>
  )
}
