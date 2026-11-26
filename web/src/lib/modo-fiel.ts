import { toast } from 'sonner'
import { desbloquear, perfilLocal } from '@/hooks/use-perfil'
import { criarArmazenamento } from '@/lib/armazenamento'

// Easter egg "Modo Fiel": quem tem a Gaviões como escola do coração segura o 💖 do card
// no Perfil por 2 segundos e o verde-limão do app vira branco (ver .modo-fiel no index.css).
// As cores das escolas (Mancha Verde, Camisa Verde e Branco...) não mudam: só a cor do app.
// Fica salvo no aparelho e só vale enquanto a escola do coração for a Gaviões.
export const ESCOLA_FIEL = 'gavioes-da-fiel'

const ligado = criarArmazenamento<boolean>('concentra:modo-fiel', false)

function ativo() {
  return ligado.atual() && perfilLocal.atual().escolaCoracao === ESCOLA_FIEL
}

function aplicar() {
  document.documentElement.classList.toggle('modo-fiel', ativo())
}

aplicar()
ligado.assinar(aplicar)
perfilLocal.assinar(aplicar)

export function useModoFiel() {
  const valor = ligado.useValor()
  const perfil = perfilLocal.useValor()
  return valor && perfil.escolaCoracao === ESCOLA_FIEL
}

// Liga ou desliga. Fora da Gaviões não faz nada: o segredo continua guardado.
export function alternarModoFiel() {
  if (perfilLocal.atual().escolaCoracao !== ESCOLA_FIEL) return
  const novo = !ligado.atual()
  ligado.definir(novo)
  if (novo) {
    desbloquear('fiel-ate-na-cor', { avisar: false })
    toast('Modo Fiel ligado 🖤🤍', { description: 'Aqui o verde não entra. Segure o coração de novo para desligar.' })
  } else {
    toast('O verde voltou.', { description: 'Só por hoje.' })
  }
}
