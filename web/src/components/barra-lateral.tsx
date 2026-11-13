import { UserRound, Users } from 'lucide-react'
import { ITENS_NAV } from '@/components/nav-pilula'
import { AvatarPerfil, Marca } from '@/components/topo'
import { useFavoritos } from '@/hooks/use-favoritos'
import { usePerfil } from '@/hooks/use-perfil'
import { irPara, type Rota } from '@/hooks/use-rota'
import { cn } from '@/lib/utils'

// Navegação do desktop (a partir de 1024px): fixa à esquerda, com os nomes sempre visíveis.
// Tem também Galera e Perfil, que no celular ficam no topo e na Home.
const EXTRAS = [
  { rota: 'galera', rotulo: 'Galera', Icone: Users },
  { rota: 'perfil', rotulo: 'Perfil', Icone: UserRound },
] as const

export function BarraLateral({ ativa }: { ativa: Rota }) {
  const { lista } = useFavoritos()
  const { perfil } = usePerfil()
  // A página da escola e a privacidade não têm item próprio: nenhum fica aceso
  const itens = [...ITENS_NAV, ...EXTRAS]

  return (
    <aside className="sticky top-0 hidden h-svh flex-col gap-8 py-8 lg:flex">
      <Marca />

      <nav aria-label="Principal">
        <ul className="flex flex-col gap-1">
          {itens.map(({ rota, rotulo, Icone }, i) => {
            const ehAtiva = rota === ativa
            return (
              <li key={rota} className={cn(i === ITENS_NAV.length && 'mt-4 border-t pt-4')}>
                <button
                  type="button"
                  onClick={() => irPara(rota)}
                  aria-current={ehAtiva ? 'page' : undefined}
                  className={cn(
                    'flex h-11 w-full items-center gap-3 rounded-full px-4 text-left text-sm font-medium transition-[background-color,color,transform,scale] duration-200 ease-mola active:scale-[0.97]',
                    ehAtiva ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icone className={cn('size-5', ehAtiva && rota === 'grade' && 'fill-current')} />
                  <span className="flex-1">{rotulo}</span>
                  {rota === 'grade' && lista.length > 0 && (
                    <span key={lista.length} className="animar-pulo flex size-5 items-center justify-center rounded-full bg-lima text-[11px] font-bold text-tinta">
                      {lista.length}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-3xl bg-card p-3 ring-1 ring-border">
        <AvatarPerfil />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{perfil.nome.trim() || 'Folião'}</p>
          <p className="truncate text-xs text-muted-foreground">Carnaval SP 2027</p>
        </div>
      </div>
    </aside>
  )
}
