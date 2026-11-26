import { useRef, useState } from 'react'

// Toque longo (segurar) que funciona no celular. Usado no Modo Fiel (lib/modo-fiel.ts).
// No toque, o navegador dispara pointercancel/pointerleave durante o toque longo (dedo que treme,
// menu de contexto). Por isso só soltar o dedo (pointerup) interrompe; o botão precisa de
// touch-action: none para o toque não virar rolagem. Se o toque longo disparou, o clique que
// vem ao soltar é engolido (senão o botão faria a ação normal dele também).
export function useSegurar(aoSegurar: () => void, { ms = 2000, ativo = true } = {}) {
  const timer = useRef<number>(undefined)
  const disparou = useRef(false)
  const [segurando, setSegurando] = useState(false)

  function soltar() {
    window.clearTimeout(timer.current)
    setSegurando(false)
  }

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (!ativo) return
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sem captura, segue igual */ }
      window.clearTimeout(timer.current)
      disparou.current = false
      setSegurando(true)
      timer.current = window.setTimeout(() => {
        disparou.current = true
        setSegurando(false)
        aoSegurar()
      }, ms)
    },
    onPointerUp: soltar,
    onContextMenu: (e: React.MouseEvent) => { if (ativo) e.preventDefault() },
  }

  // Chame no começo do onClick: devolve true se esse clique é o fim de um toque longo
  function engolirClique() {
    if (!disparou.current) return false
    disparou.current = false
    return true
  }

  return { handlers, segurando, engolirClique }
}
