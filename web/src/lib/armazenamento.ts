import { useSyncExternalStore } from 'react'

// Estado local do aparelho (favoritos, ingressos guardados), compartilhado entre
// componentes e abas. Enquanto não há login, nada disso vai para o Supabase.
// O localStorage pode falhar (aba anônima, armazenamento bloqueado): aí o app
// funciona normalmente, só não lembra depois de recarregar.
export function criarArmazenamento<T>(chave: string, inicial: T) {
  const ouvintes = new Set<() => void>()
  let valor: T = ler()

  function ler(): T {
    try {
      const bruto = localStorage.getItem(chave)
      return bruto ? (JSON.parse(bruto) as T) : inicial
    } catch {
      return inicial
    }
  }

  function definir(novo: T | ((atual: T) => T)) {
    valor = typeof novo === 'function' ? (novo as (atual: T) => T)(valor) : novo
    try {
      localStorage.setItem(chave, JSON.stringify(valor))
    } catch {
      // segue só em memória
    }
    ouvintes.forEach((o) => o())
  }

  function assinar(ouvinte: () => void) {
    ouvintes.add(ouvinte)
    const outraAba = (e: StorageEvent) => {
      if (e.key !== chave) return
      valor = ler()
      ouvinte()
    }
    window.addEventListener('storage', outraAba)
    return () => {
      ouvintes.delete(ouvinte)
      window.removeEventListener('storage', outraAba)
    }
  }

  const useValor = () => useSyncExternalStore(assinar, () => valor)
  return { useValor, definir, assinar, atual: () => valor }
}
