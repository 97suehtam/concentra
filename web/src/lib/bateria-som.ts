// Sons da bateria sintetizados no Web Audio: não baixa arquivo nenhum e funciona sem internet.
// O AudioContext também é o relógio do jogo (suspender o contexto pausa tudo junto).

export class SomDaBateria {
  readonly ctx = new AudioContext()
  private saida: GainNode
  private ruido: AudioBuffer

  constructor() {
    // No iPhone, o Web Audio respeita a chave do silencioso. Com a sessão em "playback"
    // (Safari 16.4+), o jogo toca como um vídeo, mesmo no silencioso. Em outros navegadores não existe.
    const sessao = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (sessao) sessao.type = 'playback'

    this.saida = this.ctx.createGain()
    this.saida.gain.value = 0.8
    this.saida.connect(this.ctx.destination)
    // Um segundo de ruído branco, reaproveitado por caixa, tamborim e chocalho
    this.ruido = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate)
    const dados = this.ruido.getChannelData(0)
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1
  }

  get agora() {
    return this.ctx.currentTime
  }

  private envelope(volume: number, duracao: number, quando: number) {
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(volume, quando)
    g.gain.exponentialRampToValueAtTime(0.001, quando + duracao)
    g.connect(this.saida)
    return g
  }

  private chiado(filtro: BiquadFilterType, frequencia: number, volume: number, duracao: number, quando: number, q = 1) {
    const fonte = this.ctx.createBufferSource()
    fonte.buffer = this.ruido
    const f = this.ctx.createBiquadFilter()
    f.type = filtro
    f.frequency.value = frequencia
    f.Q.value = q
    fonte.connect(f).connect(this.envelope(volume, duracao, quando))
    fonte.start(quando, Math.random() * 0.5, duracao)
  }

  private tom(tipo: OscillatorType, de: number, para: number, volume: number, duracao: number, quando: number) {
    const o = this.ctx.createOscillator()
    o.type = tipo
    o.frequency.setValueAtTime(de, quando)
    o.frequency.exponentialRampToValueAtTime(para, quando + duracao)
    o.connect(this.envelope(volume, duracao, quando))
    o.start(quando)
    o.stop(quando + duracao)
  }

  surdo(quando = this.agora) {
    this.tom('sine', 130, 48, 1, 0.45, quando)
    this.chiado('lowpass', 300, 0.3, 0.05, quando)
  }

  caixa(quando = this.agora) {
    this.chiado('highpass', 1800, 0.55, 0.13, quando)
    this.tom('triangle', 210, 160, 0.25, 0.08, quando)
  }

  tamborim(quando = this.agora) {
    this.chiado('bandpass', 3800, 0.6, 0.06, quando, 3)
    this.tom('sine', 1250, 1000, 0.3, 0.05, quando)
  }

  // Chocalho de fundo, bem baixo, para dar o balanço entre as batidas
  chocalho(quando: number, acento: boolean) {
    this.chiado('highpass', 6500, acento ? 0.12 : 0.06, 0.04, quando)
  }

  // Apito do mestre: curto na contagem, longo para chamar a paradinha
  apito(quando = this.agora, duracao = 0.12) {
    const o = this.ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = 2700
    const trinado = this.ctx.createOscillator()
    trinado.frequency.value = 32
    const fundo = this.ctx.createGain()
    fundo.gain.value = 90
    trinado.connect(fundo).connect(o.frequency)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, quando)
    g.gain.exponentialRampToValueAtTime(0.12, quando + 0.01)
    g.gain.setValueAtTime(0.12, quando + duracao - 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, quando + duracao)
    o.connect(g).connect(this.saida)
    for (const x of [o, trinado]) { x.start(quando); x.stop(quando + duracao) }
  }

  tocar(pista: 0 | 1 | 2) {
    ;[() => this.surdo(), () => this.caixa(), () => this.tamborim()][pista]()
  }

  fechar() {
    void this.ctx.close()
  }
}
