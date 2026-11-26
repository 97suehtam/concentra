import { toast } from 'sonner'
import { criarArmazenamento } from '@/lib/armazenamento'

export type TipoFolia = 'primeira_vez' | 'veterano' | 'desfila'

export type Perfil = {
  nome: string
  escolaCoracao: string | null // slug
  tipoFolia: TipoFolia | null
  conquistas: string[]
  onboardingFeito: boolean
}

export const TIPOS_FOLIA: Record<TipoFolia, { emoji: string; rotulo: string }> = {
  primeira_vez: { emoji: '🙋', rotulo: 'Primeira vez no Anhembi' },
  veterano: { emoji: '😎', rotulo: 'Já sou de casa' },
  desfila: { emoji: '💃', rotulo: 'Vou desfilar' },
}

// Easter eggs viram conquistas no perfil. As escondidas aparecem como "???" até alguém achar.
export const CONQUISTAS = {
  'primeiro-coracao': { emoji: '💚', titulo: 'Primeiro coração', dica: 'Favorite uma escola' },
  'foliao-raiz': { emoji: '🏆', titulo: 'Folião raiz', dica: 'Uma noite inteira na grade' },
  diplomacia: { emoji: '🤝', titulo: 'Diplomacia do samba', dica: 'Duas torcidas rivais na mesma grade' },
  'modo-bateria': { emoji: '🥁', titulo: 'Mestre de bateria', dica: 'O logo guarda um segredo' },
  curioso: { emoji: '🔎', titulo: 'Curioso', dica: 'A contagem tem mais de uma frase' },
  puxador: { emoji: '📣', titulo: 'Puxador', dica: 'Compartilhe sua grade' },
  garantido: { emoji: '🎟️', titulo: 'Garantido', dica: 'Guarde um ingresso' },
  'coracao-de-sambista': { emoji: '💖', titulo: 'Coração de sambista', dica: 'Escolha sua escola do coração' },
  'nota-dez': { emoji: '🔟', titulo: 'Nota dez', dica: 'Tire 10 no quesito bateria' },
  paradinha: { emoji: '🤫', titulo: 'Paradinha perfeita', dica: 'Segure a bateria no silêncio' },
  'fiel-ate-na-cor': { emoji: '🖤', titulo: 'Fiel até na cor', dica: 'Um segredo só para quem é Gaviões' },
} as const
export type Conquista = keyof typeof CONQUISTAS

const PADRAO: Perfil = { nome: '', escolaCoracao: null, tipoFolia: null, conquistas: [], onboardingFeito: false }

export const perfilLocal = criarArmazenamento<Perfil>('concentra:perfil', PADRAO)

export function usePerfil() {
  const perfil = perfilLocal.useValor()
  return {
    perfil: { ...PADRAO, ...perfil },
    atualizar: (mudanca: Partial<Perfil>) => perfilLocal.definir((atual) => ({ ...PADRAO, ...atual, ...mudanca })),
  }
}

// Desbloqueia uma conquista. `avisar` mostra o toast; use false quando o easter egg já tem o seu.
export function desbloquear(id: Conquista, { avisar = true } = {}) {
  const atual = perfilLocal.atual().conquistas ?? []
  if (atual.includes(id)) return false
  perfilLocal.definir((p) => ({ ...PADRAO, ...p, conquistas: [...(p.conquistas ?? []), id] }))
  if (avisar) {
    const c = CONQUISTAS[id]
    toast(`🏅 Conquista: ${c.titulo}`, { description: 'Veja todas no seu perfil.' })
  }
  return true
}
