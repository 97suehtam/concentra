import { Heart, MapPin, Newspaper, Sparkles, Ticket, type LucideIcon } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { irPara, type Rota } from '@/hooks/use-rota'
import { useFavoritos } from '@/hooks/use-favoritos'

export const ITENS_NAV: { rota: Exclude<Rota, 'escola' | 'galera' | 'privacidade'>; rotulo: string; Icone: LucideIcon }[] = [
  { rota: 'desfiles', rotulo: 'Desfiles', Icone: Sparkles },
  { rota: 'grade', rotulo: 'Minha grade', Icone: Heart },
  { rota: 'noticias', rotulo: 'Notícias', Icone: Newspaper },
  { rota: 'ingressos', rotulo: 'Ingressos', Icone: Ticket },
  { rota: 'chegar', rotulo: 'Chegar', Icone: MapPin },
]

type Medidas = { borda: number; vao: number; base: number; rotulos: Record<string, number> }

// Mesma duração e curva para o nome abrindo, o nome fechando e o indicador: os três andam juntos
const MOVIMENTO = 'duration-[340ms] ease-mola motion-reduce:transition-none'

// Barra inferior em pílula: o item ativo abre e mostra o nome (como nas referências).
// O fundo branco é um indicador só, atrás dos ícones, que escorrega até o item tocado.
//
// Sem "samba": cada nome abre/fecha até a largura exata dele (medida uma vez), e a posição do
// indicador é calculada já no destino. Assim a barra não incha e encolhe no meio da troca, e o
// indicador não fica correndo atrás do item quadro a quadro.
export function NavPilula({ ativa }: { ativa: Rota }) {
  const { lista } = useFavoritos()
  const barra = useRef<HTMLUListElement>(null)
  const [medidas, setMedidas] = useState<Medidas | null>(null)
  // A primeira medida entra sem transição: senão, ao abrir o app, a pílula escorregaria do canto
  const [animar, setAnimar] = useState(false)

  // Mede o que não muda com a aba ativa: bordas da barra, vão entre itens, botão fechado e cada nome
  useLayoutEffect(() => {
    const ul = barra.current
    if (!ul) return
    const medir = () => {
      const cs = getComputedStyle(ul)
      const botao = ul.querySelector('button')!
      const cb = getComputedStyle(botao)
      const icone = parseFloat(getComputedStyle(botao.querySelector('svg')!).width)
      const rotulos: Record<string, number> = {}
      ul.querySelectorAll<HTMLElement>('[data-rotulo]').forEach((r) => (rotulos[r.dataset.rotulo!] = r.scrollWidth))
      setMedidas({
        borda: parseFloat(cs.paddingLeft),
        vao: parseFloat(cs.columnGap) || 0,
        base: parseFloat(cb.paddingLeft) + parseFloat(cb.paddingRight) + icone,
        rotulos,
      })
    }
    medir()
    document.fonts?.ready.then(medir) // a fonte do nome pode chegar depois e mudar as larguras
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  useEffect(() => {
    if (!medidas || animar) return
    const quadro = requestAnimationFrame(() => setAnimar(true))
    return () => cancelAnimationFrame(quadro)
  }, [medidas, animar])

  // Posição final do indicador: soma das larguras finais dos itens antes do ativo
  let indicador: { x: number; largura: number } | null = null
  if (medidas) {
    let x = medidas.borda
    for (const { rota } of ITENS_NAV) {
      const largura = medidas.base + (rota === ativa ? medidas.rotulos[rota] : 0)
      if (rota === ativa) indicador = { x, largura }
      x += largura + medidas.vao
    }
  }
  // Fora das abas (escola, galera...) o indicador some no lugar, em vez de voltar ao canto
  const ultimo = useRef(indicador)
  if (indicador) ultimo.current = indicador
  const posicao = indicador ?? ultimo.current

  return (
    <nav
      aria-label="Principal"
      className="menu-principal fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul ref={barra} className="relative flex items-center gap-0.5 rounded-full border bg-popover/90 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-md">
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1.5 left-0 h-12 rounded-full bg-foreground',
            animar && cn('transition-[transform,width,opacity]', MOVIMENTO),
            !indicador && 'opacity-0',
          )}
          style={posicao ? { transform: `translateX(${posicao.x}px)`, width: posicao.largura } : undefined}
        />
        {ITENS_NAV.map(({ rota, rotulo, Icone }) => {
          const ehAtiva = rota === ativa
          return (
            <li key={rota} className="relative">
              <button
                type="button"
                onClick={() => irPara(rota)}
                aria-current={ehAtiva ? 'page' : undefined}
                aria-label={rotulo}
                className={cn(
                  'relative flex h-12 items-center rounded-full px-3.5 text-sm font-medium transition-[color,background-color,transform,scale] duration-300 ease-mola active:scale-95',
                  ehAtiva ? 'text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icone className={cn('size-5 shrink-0', ehAtiva && rota === 'grade' && 'fill-current')} />
                {/* Abre até a largura medida do nome (o espaço do ícone vai dentro, no pl-2) */}
                <span
                  data-rotulo={rota}
                  className={cn('overflow-hidden whitespace-nowrap', animar && cn('transition-[width,opacity]', MOVIMENTO), ehAtiva ? 'opacity-100' : 'opacity-0')}
                  style={{ width: ehAtiva ? (medidas?.rotulos[rota] ?? 'auto') : 0 }}
                >
                  <span className="inline-block pl-2">{rotulo}</span>
                </span>
                {rota === 'grade' && lista.length > 0 && !ehAtiva && (
                  // key: o número novo remonta o selo e ele dá um pulinho
                  <span key={lista.length} className="animar-pulo absolute top-1.5 right-2 flex size-4 items-center justify-center rounded-full bg-lima text-[10px] font-bold text-tinta">
                    {lista.length}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
