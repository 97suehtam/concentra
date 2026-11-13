import { toast } from 'sonner'
import { desbloquear } from '@/hooks/use-perfil'
import { soltarConfete } from '@/lib/confete'
import type { Noite } from '@/lib/supabase'

// Favoritar com festa: animação no coração e os easter eggs de grade.
export function favoritarComFesta({
  slug,
  botao,
  noite,
  alternar,
  lerFavoritas,
}: {
  slug: string
  botao: HTMLButtonElement
  noite: Noite
  alternar: (slug: string) => boolean
  lerFavoritas: () => string[]
}) {
  const favoritou = alternar(slug)

  botao.classList.remove('animar-pulo')
  void botao.offsetWidth // reinicia a animação
  botao.classList.add('animar-pulo')
  if (!favoritou) return

  soltarConfete(botao, { quantidade: 8, emojis: ['💚', '✨', '💜'] })
  const depois = lerFavoritas()

  // Easter egg: a noite inteira na grade
  const slugsDaNoite = noite.desfiles.map((d) => d.escolas.slug)
  if (slugsDaNoite.every((s) => depois.includes(s))) {
    soltarConfete(null, { quantidade: 28, emojis: ['🏆', '🎉', '🥁', '✨'] })
    desbloquear('foliao-raiz', { avisar: false })
    toast('🏆 Folião raiz!', { description: `Vai ver a noite inteira do ${noite.grupos.nome}. Leva água e protetor.` })
    return
  }

  // Easter egg: torcidas rivais na mesma grade
  if (depois.includes('gavioes-da-fiel') && depois.includes('mancha-verde') &&
      (slug === 'gavioes-da-fiel' || slug === 'mancha-verde')) {
    desbloquear('diplomacia', { avisar: false })
    toast('🤝 Gaviões e Mancha na mesma grade?', { description: 'No Anhembi, a rivalidade fica no samba. Respeito!' })
    return
  }

  if (desbloquear('primeiro-coracao', { avisar: false })) {
    toast('Primeira escola na sua grade 💚', { description: 'Veja tudo junto em "Minha grade".' })
  }
}
