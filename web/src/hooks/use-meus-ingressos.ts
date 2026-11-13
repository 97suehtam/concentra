import { criarArmazenamento } from '@/lib/armazenamento'

// Ingresso que o próprio usuário guarda (link do pedido/voucher do site oficial).
// Fica só no aparelho: não há integração com a conta dele na operadora.
export type MeuIngresso = {
  id: string
  noite_id: number
  setor: string
  link: string | null
}

const ingressos = criarArmazenamento<MeuIngresso[]>('concentra:meus-ingressos', [])

export function useMeusIngressos() {
  return {
    lista: ingressos.useValor(),
    guardar: (novo: Omit<MeuIngresso, 'id'>) =>
      ingressos.definir((atual) => [...atual, { ...novo, id: crypto.randomUUID() }]),
    remover: (id: string) => ingressos.definir((atual) => atual.filter((i) => i.id !== id)),
  }
}
