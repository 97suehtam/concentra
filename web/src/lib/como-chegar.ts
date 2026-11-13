// Como chegar ao Anhembi. Coordenadas do OpenStreetMap; transporte da operação
// especial do Carnaval 2026 (Prefeitura de SP). A de 2027 ainda não foi divulgada:
// atualizar aqui quando a SPTrans/Prefeitura publicar.

export const ANHEMBI = {
  nome: 'Sambódromo do Anhembi',
  endereco: 'Av. Olavo Fontoura, 1209 · Santana, São Paulo',
  lat: -23.516492,
  lng: -46.6452063,
}

export const FONTE_TRANSPORTE = {
  rotulo: 'Prefeitura de SP, Carnaval 2026',
  url: 'https://prefeitura.sp.gov.br/web/cultura/w/desfiles-de-carnaval-2026-confira-cronograma-de-desfiles-e-como-chegar-ao-samb%C3%B3dromo-do-anhembi-em-sp',
}

export type Rota = {
  id: string
  emoji: string
  titulo: string
  resumo: string
  passos: string[]
  cor: string
}

export const ROTAS_ATE_O_ANHEMBI: Rota[] = [
  {
    id: 'tiete',
    emoji: '🚇',
    titulo: 'Metrô Tietê + ônibus especial',
    resumo: 'Linha 1-Azul e a linha especial 179A-10',
    passos: [
      'Desça na estação Portuguesa-Tietê (Linha 1-Azul).',
      'Pegue a linha especial 179A-10 (Metrô Tietê ⇄ Pq. Anhembi) na Av. Cruzeiro do Sul, 1777, em frente à estação.',
      'Na volta, o embarque é na Av. Olavo Fontoura, no Portão 1.',
    ],
    cor: 'bg-ceu',
  },
  {
    id: 'barra-funda',
    emoji: '🚆',
    titulo: 'Metrô Barra Funda + ônibus especial',
    resumo: 'Linha 3-Vermelha e a linha especial 879A-10',
    passos: [
      'Desça na estação Palmeiras-Barra Funda (Linha 3-Vermelha). Em 2026 ela ficou aberta 24 h no carnaval.',
      'Pegue a linha especial 879A-10 (Metrô Barra Funda ⇄ Pq. Anhembi) na Av. Mário de Andrade, lado sul da estação.',
      'Na volta, o embarque também é na Av. Olavo Fontoura, no Portão 1.',
    ],
    cor: 'bg-rosa',
  },
  {
    id: 'a-pe',
    emoji: '🚶',
    titulo: 'A pé desde o Tietê',
    resumo: 'Cerca de 2 km da estação Portuguesa-Tietê',
    passos: [
      'Da estação Portuguesa-Tietê dá para ir caminhando: são uns 2 km em linha reta.',
      'Vá em grupo e prefira as avenidas principais, mais movimentadas.',
    ],
    cor: 'bg-amarelo',
  },
  {
    id: 'carro',
    emoji: '🚗',
    titulo: 'Carro ou aplicativo',
    resumo: 'Estacionamento nos portões 5 e 7',
    passos: [
      'O acesso é pelas avenidas Olavo Fontoura e Assis Chateaubriand.',
      'Estacionamento para o público no próprio Anhembi: Rua Massinet Sorcinelli, portões 5 e 7.',
      'De aplicativo, combine na saída um ponto de encontro com o motorista longe da multidão dos portões.',
    ],
    cor: 'bg-lavanda',
  },
]

// Links que abrem direto no app do usuário
const destino = `${ANHEMBI.lat},${ANHEMBI.lng}`
export const LINKS_ROTA = {
  googleTransporte: `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=transit`,
  waze: `https://waze.com/ul?ll=${destino}&navigate=yes`,
  uber: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${ANHEMBI.lat}&dropoff[longitude]=${ANHEMBI.lng}&dropoff[nickname]=${encodeURIComponent(ANHEMBI.nome)}`,
}

// Pontos do mapa (coordenadas do OpenStreetMap)
export const PONTOS_MAPA = [
  { nome: ANHEMBI.nome, emoji: '🥁', lat: ANHEMBI.lat, lng: ANHEMBI.lng, destaque: true },
  { nome: 'Metrô Portuguesa-Tietê (Linha 1-Azul)', emoji: '🚇', lat: -23.516151, lng: -46.6246939, destaque: false },
  { nome: 'Metrô Palmeiras-Barra Funda (Linha 3-Vermelha)', emoji: '🚆', lat: -23.5254616, lng: -46.6675134, destaque: false },
]

export const MAPA_COMPLETO = `https://www.openstreetmap.org/?mlat=${ANHEMBI.lat}&mlon=${ANHEMBI.lng}#map=15/${ANHEMBI.lat}/${ANHEMBI.lng}`