import { criarArmazenamento } from '@/lib/armazenamento'

// Slugs das escolas favoritas: é a "Minha grade"
export const favoritos = criarArmazenamento<string[]>('concentra:favoritos', [])

export function useFavoritos() {
  const lista = favoritos.useValor()
  return {
    lista,
    ehFavorita: (slug: string) => lista.includes(slug),
    // Valor do armazenamento agora, sem esperar o próximo render (toques rápidos)
    atual: favoritos.atual,
    // Devolve true se a escola passou a ser favorita
    alternar: (slug: string) => {
      const vaiFavoritar = !favoritos.atual().includes(slug)
      favoritos.definir((atual) => (vaiFavoritar ? [...atual, slug] : atual.filter((s) => s !== slug)))
      return vaiFavoritar
    },
  }
}
