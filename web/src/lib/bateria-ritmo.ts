// Partitura do jogo "Assume a Bateria": compassos de 4 tempos em semicolcheias (16 por compasso),
// no andamento de samba-enredo. Fica mais difícil a cada seção e tem duas paradinhas,
// em que a bateria inteira para e quem tocar perde o combo.

export const BPM = 110
export const SEMICOLCHEIA = 60 / BPM / 4 // segundos
export const COMPASSO = SEMICOLCHEIA * 16
export const CONTAGEM = COMPASSO // um compasso de apito antes de começar

export type Pista = 0 | 1 | 2 // surdo, caixa, tamborim
export type Nota = { t: number; pista: Pista; dobro: boolean; acerto?: 'perfeito' | 'bom' | 'errou' }
export type Trecho = { inicio: number; fim: number }

// Desenhos por nível (posições de semicolcheia no compasso). O surdo marca o 2 e o 4,
// como no samba; a caixa e o tamborim vão enchendo.
const DESENHOS: Record<1 | 2 | 3, [number[], number[], number[]]> = {
  1: [[4, 12], [0, 8], [6, 14]],
  2: [[4, 12], [0, 3, 8, 11], [6, 10, 14]],
  3: [[4, 12], [0, 3, 6, 8, 11, 14], [2, 5, 7, 10, 13, 15]],
}

const TOTAL_COMPASSOS = 28
const PARADINHAS = [10, 20] // compasso todo em silêncio
const DOBRO = 2 // compassos com pontos em dobro depois de cada paradinha

function nivel(c: number): 1 | 2 | 3 {
  return c < 6 ? 1 : c < 14 ? 2 : 3
}

export function montarPartitura() {
  const notas: Nota[] = []
  const paradinhas: Trecho[] = []

  for (let c = 0; c < TOTAL_COMPASSOS; c++) {
    const inicio = CONTAGEM + c * COMPASSO
    if (PARADINHAS.includes(c)) {
      paradinhas.push({ inicio, fim: inicio + COMPASSO })
      continue
    }
    const dobro = PARADINHAS.some((p) => c > p && c <= p + DOBRO)
    const ocupadas = new Map<number, number>() // posição → quantas notas
    const limite = nivel(c) === 3 ? 2 : 1 // no celular, no máximo dois dedos ao mesmo tempo

    DESENHOS[nivel(c)].forEach((posicoes, pista) => {
      for (const p of posicoes) {
        if ((ocupadas.get(p) ?? 0) >= limite) continue
        ocupadas.set(p, (ocupadas.get(p) ?? 0) + 1)
        notas.push({ t: inicio + p * SEMICOLCHEIA, pista: pista as Pista, dobro })
      }
    })
  }

  notas.sort((a, b) => a.t - b.t)
  return { notas, paradinhas, duracao: CONTAGEM + TOTAL_COMPASSOS * COMPASSO }
}

// Nota da apuração: 10 só com quase tudo perfeito; cada 5% de erro tira um décimo, até 9,0
export function notaDaApuracao(precisao: number) {
  // (o 1e-9 evita que 1 - 0,98 - 0,02 vire 0,0000…1 e custe um décimo)
  const descontos = Math.ceil(Math.max(0, 1 - precisao - 0.02 - 1e-9) * 20)
  return Math.max(9, 10 - descontos / 10)
}

export const formatarNota = (n: number) => n.toFixed(1).replace('.', ',')
