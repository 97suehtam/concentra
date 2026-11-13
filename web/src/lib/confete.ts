// Estouro de emojis a partir de um elemento (ou do centro da tela).
// Sem dependência: cria spans com animação CSS e remove em seguida.
const PADRAO = ['🎉', '✨', '🥁', '🎶', '💚', '💜']

export function soltarConfete(origem?: Element | null, { quantidade = 14, emojis = PADRAO } = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const caixa = origem?.getBoundingClientRect()
  const x = caixa ? caixa.left + caixa.width / 2 : window.innerWidth / 2
  const y = caixa ? caixa.top + caixa.height / 2 : window.innerHeight / 3

  for (let i = 0; i < quantidade; i++) {
    const el = document.createElement('span')
    el.className = 'confete'
    el.textContent = emojis[i % emojis.length]
    const angulo = (Math.PI * 2 * i) / quantidade + Math.random() * 0.6
    const distancia = 50 + Math.random() * 70
    el.style.left = `${x - 10}px`
    el.style.top = `${y - 12}px`
    el.style.setProperty('--dx', `${Math.cos(angulo) * distancia}px`)
    el.style.setProperty('--dy', `${Math.sin(angulo) * distancia - 30}px`)
    el.style.setProperty('--giro', `${(Math.random() - 0.5) * 540}deg`)
    el.setAttribute('aria-hidden', 'true')
    document.body.append(el)
    el.addEventListener('animationend', () => el.remove())
  }
}
