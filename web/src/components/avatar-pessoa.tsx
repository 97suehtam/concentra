import { CORES_VIVAS } from '@/lib/app'
import { aoCarregar } from '@/lib/midia'
import { cn } from '@/lib/utils'

// Foto (se aprovada e com link) ou a inicial num círculo colorido, sempre a mesma cor para a mesma pessoa
export function AvatarPessoa({ nome, url, semente, className }: { nome: string | null; url?: string; semente: string; className?: string }) {
  const cor = CORES_VIVAS[[...semente].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES_VIVAS.length]
  return url ? (
    <img src={url} alt="" onLoad={aoCarregar} className={cn('suave shrink-0 rounded-full bg-muted object-cover', className)} />
  ) : (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full font-heading font-bold text-tinta', cor, className)} aria-hidden="true">
      {nome?.trim()[0]?.toUpperCase() ?? '🎭'}
    </span>
  )
}
