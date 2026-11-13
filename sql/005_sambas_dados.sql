-- Dados de samba-enredo (proposta para aprovação do Matheus; aplicar só depois do ok).
--
-- 1) Último samba no Spotify: faixas do álbum oficial da Liga-SP
--    "Sambas de Enredo: Carnaval SP 2026 (Grupo Especial, Acesso e Acesso II)"
--    https://open.spotify.com/album/394cGPlu5cbCAiIZ47bbih (lista lida em 03/11/2026)
--    Brinco da Marquesa e Unidos de Santa Bárbara entram na Liga em 2027 e não estão no álbum.
update escolas e set
  ultimo_samba_titulo = v.titulo,
  ultimo_samba_ano = 2026,
  ultimo_samba_spotify_url = 'https://open.spotify.com/track/' || v.faixa
from (values
  ('perola-negra',                'Valei-me Cangaceira Arretada, Maria que abala a gira, valente e bonita que vence demanda', '5LjLJViNH01YsHVFg1GVdI'),
  ('vai-vai',                     'Em Cartaz: A Saga Vencedora de um povo heróico no apogeu da vedete da Paulicéia', '3zVmWg7XM5PymRHccQmmU3'),
  ('barroca-zona-sul',            'Oro Mi Maió OXUM', '5q3FbqVsyKLuK1baa4Kj2X'),
  ('dragoes-da-real',             'Guerreiras Icamiabas – Uma lendária história de força e resistência', '1KTbXTtr5qigHHkRfPP7pM'),
  ('academicos-do-tatuape',       'Plantar para colher e alimentar. Tem muita terra sem gente, tem muita gente sem terra.', '372Icm4VJH17JTsB11LGj8'),
  ('mocidade-unida-da-mooca',     'Gèlèdés – Agbara Obinrin', '3YkBtBQbJuk24SaM0ReTm7'),
  ('camisa-verde-e-branco',       'Abre Caminhos', '1jZM49N4xiZUx0Vt80WVyI'),
  ('imperio-de-casa-verde',       'Império dos Balangandãs – Jóias Negras Afro-Brasileiras', '71fQ3PXiGfcK1qKmSHwtoq'),
  ('gavioes-da-fiel',             'Vozes Ancestrais para um Novo Amanhã', '1R6fHpOnABlby14G9plnh8'),
  ('mocidade-alegre',             'Malunga Léa, Rapsódia de uma Deusa Negra', '6KPs5l8xljbywlZmYZwk8r'),
  ('tom-maior',                   'Chico Xavier. Nas entrelinhas da alma, as raízes do céu de Uberaba', '18I1iDpbMBAM1Drkt7Ij0G'),
  ('estrela-do-terceiro-milenio', 'Hoje a poesia vem ao nosso encontro: Paulo César Pinheiro, uma viagem pela vida e obra do poeta das canções', '6B5ZU1mioN9rVCzjI8Ucn4'),
  ('colorado-do-bras',            'A Bruxa está solta – Senhoras do Saber renascem na Colorado', '2YY4CtxeaoNRw6tuc3W6mj'),
  ('academicos-do-tucuruvi',      'Anti-Heroi Brasil', '1qK4RA33lRrk3rSRb01fca'),
  ('x-9-paulistana',              'Yvy Marã Ei: A busca pela terra sem mal', '36eksTGa9HvEgwwQZoyKUS'),
  ('dom-bosco-de-itaquera',       'Mariama – Mãe de todas as raças, de todas as cores. Mãe de todos os cantos da Terra', '2hPCXaHWJdcCdx5WfattI7'),
  ('rosas-de-ouro',               'Escrito nas Estrelas', '7G83A8p1KW2HNSycvqdF4O'),
  ('aguia-de-ouro',               'Mokum Amsterdã – O vôo da Águia na Cidade Libertária', '6uMr2jDZ3BfTHvveUVVe7M'),
  ('unidos-de-vila-maria',        'Do chão que alimenta à culinária que encanta: Brasil, Um banquete de sabores', '7y0zNOVCjilF5N7i3Q5Aqf'),
  ('mancha-verde',                'Pelas Mãos do Mensageiro do Axé, A Lição De Odu Obará: A Humildade', '39rbPGRdXodLrPgqgxGrjU'),
  ('morro-da-casa-verde',         'Santo Antônio de batalha faz de mim batalhador', '4N98wyVHvTXe1osZvsRNgl'),
  ('independente-tricolor',       'N’Goma – A primeira festa na manhã do mundo', '2AUbHlmxbztPCQbkN1h9Vy'),
  ('unidos-do-peruche',           'Oi… Esse Peruche Lindo e Trigueiro… Terra de Samba e Pandeiro', '1CPkDqC6vJhinZZ7FgDZ5s'),
  ('imperatriz-da-pauliceia',     'Congá, O Altar Sagrado da minha fé', '53pwKq5IzzrfjvQrJoKR97'),
  ('imperador-do-ipiranga',       'Berijóó, Inopí Doum – Ibeji', '2cxv7NM4B7zblLiUiJfH4j'),
  ('nene-de-vila-matilde',        'Encruzas – Nenê de Corpo e Alma no Coração de São Paulo', '5kZ6vHlvF1t4wQPq4ST9YO'),
  ('unidos-de-sao-lucas',         'Meu Tambor é Ancestral – Heranças e riquezas de um povo… Um Brasil de festas pretas!', '31WZaujbxMYSEVmA8ASnQm'),
  ('torcida-jovem',               'Axé! Raízes e Ritmos da Cultura Afro-Baiana', '1AuikIQhYbBrpa0hHymlff'),
  ('primeira-da-cidade-lider',    'Paulo Barros, o Gênio do Carnaval', '7i7cuqg5u7sCZVavSfi2Og'),
  ('camisa-12',                   'Princesas Nagô, Rainhas do Brasil – A origem da fé, herança de Ketu', '402FgCiFIRTlUpw2MuPz1F')
) as v(slug, titulo, faixa)
where e.slug = v.slug;

-- 2) Samba 2027: clipe oficial no canal da escola (@MocidadeAlegreOficial),
--    "Mocidade Alegre | Samba de Enredo | Carnaval 2027" (encontrado via SASP, 30/09/2026)
update desfiles set samba_video_url = 'https://www.youtube.com/watch?v=Ys8NBfm_6Xg'
where escola_id = (select id from escolas where slug = 'mocidade-alegre')
  and noite_id in (select n.id from noites n join grupos g on g.id = n.grupo_id join carnavais c on c.id = g.carnaval_id where c.ano = 2027);
