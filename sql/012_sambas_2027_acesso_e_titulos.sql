-- Clipes oficiais 2027 do Acesso I e II (Liga-SP no YouTube, canal "Liga Carnaval SP - Oficial", 25/11/2026)
-- e o nome do samba de todas as 32 escolas. Pedido do Matheus, gravado em 25/11/2026.
--
-- Nome do samba: em SP o samba-enredo leva o nome do enredo. A fonte é a primeira linha da descrição
-- de cada clipe oficial ("Enredo: ..."). Só o título: a letra não é guardada (direito autoral).
-- O enredo também passa a usar a grafia oficial da Liga, e o desfile fica verificado (fonte oficial).
-- Isso resolve os enredos que faltavam (Tatuapé, Império de Casa Verde e as 18 do Acesso)
-- e confirma o da Dragões da Real, que estava "a confirmar".
with v(slug, video, titulo) as (values
  -- Grupo Especial (clipes de 20/11/2026, já gravados no 011; aqui entra só o título)
  ('perola-negra',                null,          $$Sem Vacilar, Sem me Exibir: Sou Jovelina, a Pérola Negra$$),
  ('vai-vai',                     null,          $$3 Obás de Xangô — A Mãe Bahia em Cantos, Cores e Memórias$$),
  ('barroca-zona-sul',            null,          $$Elekô Obá Xirê — A Força da Mulher que Não se Curva$$),
  ('dragoes-da-real',             null,          $$Sob as Bênçãos de Xangô, a Coroação do Príncipe Reinaldo$$),
  ('academicos-do-tatuape',       null,          $$Congo Kinshasa: O Coração da África, a Herança Viva de um Povo que Resiste ao Tempo$$),
  ('mocidade-unida-da-mooca',     null,          $$Modupé, Cardeais!$$),
  ('camisa-verde-e-branco',       null,          $$Ajuruetês — O Voo da Terra Brazil$$),
  ('imperio-de-casa-verde',       null,          $$Sob o Céu do Interior Brilha o Sonho Caipira: Jaguariúna, a Capital Country do Brasil$$),
  ('gavioes-da-fiel',             null,          $$É Noite de Gira na Casa de Ogum$$),
  ('mocidade-alegre',             null,          $$Sete Anos de Mar, Sete Léguas de Encanto: A Nau que Venceu o Diabo sob a Benção do Sagrado Manto$$),
  ('tom-maior',                   null,          $$Eu Sou o Pão da Vida$$),
  ('estrela-do-terceiro-milenio', null,          $$Incrível, Fantástico, Extraordinário!$$),
  ('colorado-do-bras',            null,          $$Ojuara — O Homem que Desafiou o Diabo$$),
  ('academicos-do-tucuruvi',      null,          $$Ogbódirin, Ògbóni$$),
  -- Acesso I
  ('x-9-paulistana',              'k0pe59nA-Nc', $$Se o Rio Muda de Curso Poderá Mudar o Curso da História$$),
  ('dom-bosco-de-itaquera',       'fohXylHBiAY', $$O Auto do Boi — Morte e Ressurreição da Lenda do Touro Negro no Reino de Guaré — Histórias de Resistência do Boi que Pintou a Cara de Preto, Colocou a Estrela na Testa e Foi Farrar em Noite de São João$$),
  ('rosas-de-ouro',               'FhTLDL4d4B8', $$Mar de Rosas$$),
  ('aguia-de-ouro',               'G4Uew-nnxEg', $$Águia na Encantaria de Fés, Folguedos e Milagres que Desaguam no Sertão$$),
  ('unidos-de-vila-maria',        'TZgbLTFx8Q4', $$Sonho e Realidade no Circo da Vida$$),
  ('mancha-verde',                '5UhbBvTBxAI', $$Ruth Rocha: a Palavra que Ensina a Criança a Voar!$$),
  ('morro-da-casa-verde',         'z6pEZcsIp1E', $$Reconto minha fé: O Conto de um Ponto Catimbozeiro$$),
  ('independente-tricolor',       'CKFvACR7pBs', $$Os Três Obás do Rei: Na Bahia da Poesia, dos Traços e das Canções$$),
  -- Acesso II
  ('unidos-de-santa-barbara',     'r7T3iuYqgDg', $$Laroyê Pombogira — Salve a Força da Mulher$$),
  ('brinco-da-marquesa',          'YjCmgVzAESE', $$O Brinco É Só Felicidade!$$),
  ('unidos-do-peruche',           'awPGCCTxWwc', $$Filhos de Mãe Preta$$),
  ('imperatriz-da-pauliceia',     'tO89qhcZr3E', $$Ideval, Dom Marcos e Paulistinha — Os Poetas da Pauliceia$$),
  ('imperador-do-ipiranga',       'qvCAdgGTyJM', $$Xetruá, Boiadeiro! A Saga de Fé e Luz no Cruzeiro de Bom Jesus da Lapa$$),
  ('nene-de-vila-matilde',        'uN5Q_0V53Bo', $$Mulheres de Palmares — A Liberdade tem Rosto de Mulher$$),
  ('unidos-de-sao-lucas',         'FiIviv1fyrA', $$N'Kodya — O Poder Supremo Africano$$),
  ('torcida-jovem',               'KsgLWUs9_rM', $$Porto de Santos — O Mundo se Encontra Aqui$$),
  ('primeira-da-cidade-lider',    'ZUF5vHsovF8', $$David Assayag — A Voz da Amazônia$$),
  ('camisa-12',                   'mNEz1ji30kk', $$Meu Terreiro é Protegido — Ogunhê, a Força que Atravessa o Tempo$$)
)
update desfiles d set
  samba_video_url = coalesce('https://www.youtube.com/watch?v=' || v.video, d.samba_video_url),
  samba_titulo    = v.titulo,
  enredo_titulo   = v.titulo,
  fonte_url       = coalesce('https://www.youtube.com/watch?v=' || v.video, d.samba_video_url), -- o enredo agora vem do clipe oficial
  verificado      = true,
  atualizado_em   = now()
from v join escolas e on e.slug = v.slug
where d.escola_id = e.id;
