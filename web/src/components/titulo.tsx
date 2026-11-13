import { cn } from '@/lib/utils'

// Título grande com uma palavra em destaque num bloco colorido, como o "Dream" da referência
export function Titulo({
  antes,
  destaque,
  depois,
  cor = 'bg-lavanda',
  className,
}: {
  antes?: string
  destaque: string
  depois?: string
  cor?: string
  className?: string
}) {
  return (
    <h1 className={cn('text-[2.5rem] leading-[1.05] font-bold text-balance lg:text-[3.25rem]', className)}>
      {antes}{' '}
      <span className={cn('inline-block -rotate-1 rounded-lg px-2 text-tinta', cor)}>{destaque}</span>
      {depois && <> {depois}</>}
    </h1>
  )
}

export function Sobretitulo({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
