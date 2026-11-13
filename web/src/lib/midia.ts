// Para imagens e iframes com a classe "suave": só aparecem (com fade) quando terminam de carregar
export const aoCarregar = (e: { currentTarget: Element }) => e.currentTarget.classList.add('carregou')

// Converte links de YouTube e Spotify nos endereços de incorporação (iframe).
// Devolve null quando o link não é reconhecido: aí a tela mostra só o link.

// youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
export function youtubeEmbed(url: string) {
  try {
    const u = new URL(url)
    const id = u.hostname.endsWith('youtu.be')
      ? u.pathname.slice(1)
      : u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1]
    // youtube-nocookie: não grava cookie de rastreio até a pessoa dar play
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null
  } catch {
    return null
  }
}

// open.spotify.com/track/ID (com ou sem /intl-pt/ e ?si=...)
export function spotifyEmbed(url: string) {
  const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([A-Za-z0-9]{22})/)
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` : null
}
