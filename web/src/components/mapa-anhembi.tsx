import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { PONTOS_MAPA } from '@/lib/como-chegar'

// Mapa com Leaflet e tiles do OpenStreetMap, escurecidos por CSS (.leaflet-tile-pane).
// A CARTO passou a exigir chave de API. Com muito acesso, trocar por um provedor de tiles
// (a política do tile.openstreetmap.org é para uso leve).
// Marcadores são emojis em HTML: dispensa os ícones de imagem do Leaflet.
export function MapaAnhembi({ className }: { className?: string }) {
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!caixa.current) return
    const mapa = L.map(caixa.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa)
    mapa.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>')

    for (const p of PONTOS_MAPA) {
      const icone = L.divIcon({
        className: '',
        html: `<span class="pino-mapa${p.destaque ? ' pino-destaque' : ''}">${p.emoji}</span>`,
        iconSize: p.destaque ? [44, 44] : [34, 34],
        iconAnchor: p.destaque ? [22, 22] : [17, 17],
      })
      L.marker([p.lat, p.lng], { icon: icone, title: p.nome, keyboard: true }).addTo(mapa).bindPopup(p.nome)
    }

    // Enquadra o Anhembi e as duas estações, com folga
    mapa.fitBounds(L.latLngBounds(PONTOS_MAPA.map((p) => [p.lat, p.lng])), { padding: [36, 36] })
    L.control.zoom({ position: 'bottomright' }).addTo(mapa)

    return () => { mapa.remove() }
  }, [])

  return <div ref={caixa} className={className} role="region" aria-label="Mapa do Anhembi e das estações de metrô" />
}
