import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export function Carregando({ linhas = 4 }: { linhas?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
    </div>
  )
}

export function Erro({ titulo, mensagem }: { titulo: string; mensagem: string }) {
  return (
    <Alert variant="destructive" className="rounded-3xl">
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription>{mensagem}</AlertDescription>
    </Alert>
  )
}

// Estado vazio com um emoji grande: o tom do app é leve
export function Vazio({ emoji, titulo, children }: { emoji: string; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed px-6 py-10 text-center">
      <span className="text-5xl" aria-hidden="true">{emoji}</span>
      <h2 className="text-xl font-bold">{titulo}</h2>
      {children}
    </div>
  )
}
