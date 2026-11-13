// Curadoria de "Sobre a escola" (03/11/2026). Resumos autorais escritos a partir da
// Wikipedia PT (CC BY-SA). O texto dela não é copiado, só os fatos; a página fica como
// fonte em historia_fonte_url (vem de wikipedia-escolas.json, gerado por npm run wikipedia).
//
// fundacao: só quando a Wikipedia/Wikidata dá a data. Se dá só o ano, fica AAAA-01-01
// (o app mostra só o ano). Na dúvida (fontes conflitantes), fica null.
// site: só sites do Wikidata conferidos no ar e com página da própria escola.
// Gere o SQL com: node scripts/gerar-sql-historia.mjs

export const HISTORIA = {
  'perola-negra': {
    fundacao: '1973-08-07', bairro: 'Vila Madalena',
    historia: 'Nasceu em 1973 da fusão do GRES Acadêmicos de Vila Madalena com o Bloco Boca das Bruxas e se apresenta como "a joia rara do samba". Chegou ao Grupo Especial em 1976 e, desde então, alterna entre a elite e o acesso. Em 2025 foi campeã do Acesso 2 com o enredo Exu Mulher.',
  },
  'vai-vai': {
    fundacao: null, bairro: 'Bixiga', site: 'https://www.vaivai.com.br/', // 1930 no texto, 1931 no Wikidata
    historia: 'A "Escola do Povo" nasceu no Bixiga, no Cordão Vae-Vae, criado por volta de 1930 por sambistas que tinham sido expulsos do time de futebol Cai-Cai. É a maior campeã do carnaval paulistano, com 15 títulos, o último em 2015.',
  },
  'barroca-zona-sul': {
    fundacao: '1974-08-07', bairro: 'Vila Mariana', cores: ['verde', 'rosa'],
    historia: 'Fundada em 1974 na Vila Mariana por Sebastião Eduardo do Amaral, o Pé Rachado, ex-presidente da Vai-Vai que teria sido incentivado por Cartola a criar a própria escola. O verde e rosa vem da madrinha, a Mangueira.',
  },
  'dragoes-da-real': {
    fundacao: '2000-03-17', site: 'https://dragoesdareal.com.br/',
    historia: 'Criada em 2000 por associados da torcida do São Paulo Futebol Clube. Foi campeã logo na estreia, em 2001, e subiu de grupo em sequência até chegar ao Anhembi.',
  },
  'academicos-do-tatuape': {
    fundacao: '1952-10-26', bairro: 'Tatuapé', site: 'https://www.academicosdotatuape.com.br/',
    historia: 'Nasceu em 1952 como Unidos de Vila Santa Isabel e ganhou o nome atual em 1964, quando a sede foi para a rua principal do Tatuapé. O lema é "O Tatu que anda também samba".',
  },
  'mocidade-unida-da-mooca': {
    fundacao: '1987-03-18', bairro: 'Mooca',
    historia: 'Surgiu do Bloco Solta Franga e foi fundada oficialmente em 1987, na Mooca. Subiu de grupo com enredos sobre Pixinguinha (2014) e Carmen Miranda (2016).',
  },
  'camisa-verde-e-branco': {
    fundacao: '1953-09-04', bairro: 'Barra Funda', cores: ['verde', 'branco'],
    historia: 'Considerada o berço do samba paulistano, tem raízes no Grupo Carnavalesco Barra Funda, de 1914, cujos foliões saíam de camisa verde e calça branca. Foi reorganizada em 1953 como Cordão Mocidade Camisa Verde e Branco e soma 9 títulos.',
  },
  'imperio-de-casa-verde': {
    fundacao: '1994-02-27', bairro: 'Casa Verde',
    historia: 'Fundada em 1994 por dissidentes da Unidos do Peruche, teve uma das subidas mais rápidas do carnaval paulistano: foi campeã no primeiro desfile e ganhou o primeiro título do Grupo Especial com apenas onze anos de vida.',
  },
  'gavioes-da-fiel': {
    fundacao: '1969-01-01', bairro: 'Bom Retiro', site: 'https://gavioes.com.br/',
    historia: 'Maior torcida organizada do Corinthians, criada em 1969, é também escola de samba: o carnaval e o futebol fazem parte da mesma entidade, com sede no Bom Retiro.',
  },
  'mocidade-alegre': {
    fundacao: '1967-09-24', site: 'https://www.mocidadealegre.com.br/',
    historia: 'Nasceu de um bloco de foliões do Bom Retiro dos anos 1950 e se intitula a "Morada do Samba". Tem 13 títulos do Grupo Especial, o último em 2026, e é conhecida pelos carnavais de temática afro.',
  },
  'tom-maior': {
    fundacao: '1973-02-14', bairro: 'Sumaré', cores: ['vermelho', 'amarelo', 'branco'],
    historia: 'O nome vem de versos de Martinho da Vila. Fundada por Hélio Bagunça com sambistas da Camisa Verde e Branco, nasceu no Sumaré, estreou em 1974 e chegou ao Grupo Especial pela primeira vez em 1977.',
  },
  'estrela-do-terceiro-milenio': {
    fundacao: null, bairro: 'Grajaú', cores: ['azul', 'verde', 'branco', 'vermelho'],
    historia: 'Escola do Grajaú, no extremo sul da cidade, batizada em alusão à virada do milênio. A coruja do símbolo vem da casa de shows Corujão, onde foram os primeiros ensaios, e a madrinha é a Rosas de Ouro.',
  },
  'colorado-do-bras': {
    fundacao: '1975-10-01', bairro: 'Brás',
    historia: 'Fundada em 1975 no Brás, a partir da torcida de um time de várzea, teve ao seu lado sambistas como Geraldo Filme. O samba de 1988, "Catopês do Milho Verde", é lembrado como um dos melhores da história do carnaval paulistano.',
  },
  'academicos-do-tucuruvi': {
    fundacao: '1976-02-01', bairro: 'Tucuruvi', cores: ['azul', 'branco'], site: 'http://academicosdotucuruvi.com.br/',
    historia: 'Fundada em 1976 por moradores do bairro, tem um gafanhoto como símbolo, porque "Tucuruvi" quer dizer "gafanhoto verde" em tupi. É azul e branco desde os anos 1980, e seu melhor resultado foi o vice-campeonato de 2011.',
  },
  'x-9-paulistana': {
    fundacao: null, bairro: 'Vila Guilherme',
    historia: 'Nasceu na Parada Inglesa, entre amigos de um time de futebol, e herdou o nome da X-9 de Santos. Chamava-se Filhotes da X-9 até 1986, chegou ao Grupo Especial em 1995 e é bicampeã da elite.',
  },
  'dom-bosco-de-itaquera': {
    fundacao: null, bairro: 'Itaquera',
    historia: 'Escola de Itaquera criada a partir da Obra Social Dom Bosco, mantida pela Igreja Católica. O fundador é o padre salesiano Rosalvino Morán Viñayo.',
  },
  'rosas-de-ouro': {
    fundacao: '1971-01-01', bairro: 'Brasilândia',
    historia: 'Fundada em 1971 na Brasilândia, foi presidida por Eduardo Basílio da fundação até 2003. O nome vem da Rosa de Ouro, condecoração dada pelos papas. Campeã em 2025, caiu para o Acesso 1 no ano seguinte.',
  },
  'aguia-de-ouro': {
    fundacao: '1976-05-09', bairro: 'Pompeia', cores: ['azul', 'dourado', 'branco'],
    historia: 'Fundada em 1976 na Pompeia por jogadores do time de várzea Faísca de Ouro. Ganhou o primeiro título do Grupo Especial em 2020.',
  },
  'unidos-de-vila-maria': {
    fundacao: '1954-01-10', bairro: 'Jardim Japão',
    historia: 'Uma das escolas mais tradicionais de São Paulo, fundada em 1954. Fica no Jardim Japão, no distrito da Vila Maria.',
  },
  'mancha-verde': {
    fundacao: '1995-10-18',
    historia: 'Ligada à torcida do Palmeiras, foi oficializada em outubro de 1995, primeiro como bloco carnavalesco. Estreou em 1996 com um enredo sobre a destruição da natureza.',
  },
  'morro-da-casa-verde': {
    fundacao: '1962-04-06', bairro: 'Casa Verde', cores: ['verde', 'rosa'],
    historia: 'Fundada em 1962 por Zezinho do Banjo, participou do primeiro desfile organizado em São Paulo, em 1968. O verde e rosa homenageia a Mangueira, escola do coração do fundador.',
  },
  'independente-tricolor': {
    fundacao: null, bairro: 'Vila Guilherme',
    historia: 'Vem da Torcida Tricolor Independente, do São Paulo. Depois de anos fora do carnaval oficial, voltou como escola de samba e estreou em 2010 pelo Grupo 4 da UESP.',
  },
  'unidos-de-santa-barbara': {
    fundacao: null, bairro: 'Itaim Paulista',
    historia: 'Nasceu como bloco em 1988, no Itaim Paulista, e leva o nome da santa de devoção dos fundadores. Virou escola de samba em 2009 e emendou quatro acessos seguidos até chegar ao Anhembi em 2012.',
  },
  'brinco-da-marquesa': {
    fundacao: null, bairro: 'Vila Brasilina', historia: null, // a página só traz o endereço
  },
  'unidos-do-peruche': {
    fundacao: '1956-01-04', bairro: 'Limão', cores: ['verde', 'amarelo', 'azul', 'branco'],
    historia: 'Criada nos anos 1950 por amigos que saíam na escola Lavapés, nasceu no Parque Peruche e é chamada de "a filial do samba". Tem as cores da bandeira do Brasil, foi tricampeã do Grupo Especial nos anos 1960 e já teve Jamelão entre seus intérpretes.',
  },
  'imperatriz-da-pauliceia': {
    fundacao: null, bairro: 'Vila Fidelis Ribeiro', historia: null, // a página só traz o endereço
  },
  'imperador-do-ipiranga': {
    fundacao: '1968-01-01', bairro: 'Vila Carioca',
    historia: 'Fundada em 1968 por moradores de Heliópolis, da Vila Carioca e da Vila Independência, homenageia Dom Pedro I no nome. O primeiro desfile foi um protesto contra as enchentes do bairro, com carros alegóricos imitando barcos.',
  },
  'nene-de-vila-matilde': {
    fundacao: '1949-01-01', bairro: 'Vila Matilde',
    historia: 'Fundada em 1949 por Alberto Alves da Silva, o Seu Nenê, que a presidiu por 47 anos. Tem 11 títulos do Grupo Especial, é afilhada da Portela e foi a primeira escola de samba com quadra coberta, em 1968.',
  },
  'unidos-de-sao-lucas': {
    fundacao: null, bairro: 'Parque São Lucas', // "década de 1970" e "1980" no mesmo texto
    historia: 'Nasceu de um bloco de torcedores do São Cristóvão Bandeirante e virou escola de samba em 1980, campeã logo no primeiro desfile. Chegou ao Grupo Especial pela primeira vez em 2001.',
  },
  'torcida-jovem': {
    fundacao: null, // a torcida é de 1969; a escola de samba, de 2003
    historia: 'É a escola de samba da Torcida Jovem do Santos, torcida organizada fundada em 1969 no Brás, em São Paulo. Desfila como escola de samba desde 2003.',
  },
  'primeira-da-cidade-lider': {
    fundacao: '1993-01-01', bairro: 'Cidade Líder',
    historia: 'Fundada em 1993 pelo compositor Odair Fala Macio, na Cidade Líder. Voltou a desfilar em 2015 com os irmãos Rodrigo e Rodolfo Minuetto à frente e estreou no Anhembi em 2019.',
  },
  'camisa-12': {
    fundacao: '1996-01-12', bairro: 'Vila Maria',
    historia: 'Ligada à torcida organizada Camisa 12, nasceu como bloco em 1984 na Vila Maria e virou escola de samba em janeiro de 1996.',
  },
}
