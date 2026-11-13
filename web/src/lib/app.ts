// Nome provisório: trocar aqui muda o app inteiro.
// "Concentração" é onde a escola se reúne antes de entrar na avenida.
export const NOME_APP = 'Concentra'

// Primeira noite de desfile (Acesso II). Usado na contagem regressiva.
export const PRIMEIRO_DESFILE = '2027-01-30'

// Venda oficial de 2027 (fonte: Liga-SP, post de 14/09/2026). Não há API:
// o app só leva o usuário até a página oficial.
export const VENDA_OFICIAL = {
  operadora: 'Clube do Ingresso',
  url: 'https://www.clubedoingresso.com/carnavalsp',
  fonte_url:
    'https://ligasp.com.br/bilheteria-fisica-para-vendas-de-ingresso-do-carnaval-de-sao-paulo-2027-comeca-nesta-segunda-feira-14-com-opcao-de-parcelamento/',
}

// Privacidade (LGPD): o controlador dos dados é o responsável pelo app.
// CONTATO precisa ser um e-mail que alguém lê; definir antes de abrir a comunidade ao público.
export const PRIVACIDADE = {
  controlador: 'Matheus Soares',
  contato: '97suehtam@gmail.com' as string | null, // definido pelo Matheus em 03/11/2026
  atualizada_em: '04/11/2026',
}

// Cores vivas para dar identidade aos cards enquanto `escolas.cores` está vazio
export const CORES_VIVAS = ['bg-lima', 'bg-lavanda', 'bg-rosa', 'bg-amarelo', 'bg-ceu'] as const

export function diasAte(dataIso: string, hoje = new Date()) {
  // Compara datas no fuso de SP, ignorando a hora
  const hojeSP = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(hoje)
  return Math.round((Date.parse(dataIso) - Date.parse(hojeSP)) / 86_400_000)
}
