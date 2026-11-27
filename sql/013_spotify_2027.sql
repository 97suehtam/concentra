-- Álbum oficial 2027 da Liga-SP no Spotify, 3 discos (Especial, Acesso I e Acesso II), 32 faixas:
-- "Sambas de Enredo: Carnaval SP 2027 (Grupo Especial, Acesso e Acesso II)"
-- https://open.spotify.com/album/7CpY2cUFz2QheU5l2z2dNO (lista lida em 27/11/2026, pedido do Matheus)
-- Troca o "último samba no Spotify" de 2026 pelo de 2027 nas 32 escolas. Cada faixa traz o nome
-- da escola nos artistas, e o título bate com o enredo oficial (sql/012). Só o link: nada de letra.
update escolas e set
  ultimo_samba_titulo = d.samba_titulo,  -- mesma grafia do clipe oficial (sql/012)
  ultimo_samba_ano = 2027,
  ultimo_samba_spotify_url = 'https://open.spotify.com/track/' || v.faixa
from (values
  -- Disco 1: Grupo Especial
  ('mocidade-alegre',             '5wgPDlarcjk25xOCPCq6HE'),
  ('gavioes-da-fiel',             '3afvTUMZtDdTAwtaW1mibJ'),
  ('dragoes-da-real',             '4uyTYAiLI5pnAGXVJeVWJ3'),
  ('academicos-do-tatuape',       '393kKnw3jmEv0Ca7q4bxBd'),
  ('barroca-zona-sul',            '2qH1FFujeHvDGhcuUclz5v'),
  ('tom-maior',                   '4gxSiTSdhatyoVYFKReZbT'),
  ('estrela-do-terceiro-milenio', '17CLs1LY1Jx2VyZQCbTNeP'),
  ('mocidade-unida-da-mooca',     '7nAsAHpCLbGj2N0P2SxzxD'),
  ('imperio-de-casa-verde',       '4wRG8oUCNmQh6a2b9crS0c'),
  ('camisa-verde-e-branco',       '5KIaAe2G2F1nsXQ9ixNqmU'),
  ('colorado-do-bras',            '3avC3IEoCx4A4tMDvfj1by'),
  ('vai-vai',                     '5j7KiR8rHgPG4MBgeV6wpM'),
  ('academicos-do-tucuruvi',      '6vKhnShDFwTLANT4wzFUE4'),
  ('perola-negra',                '4dP4LrJq7YXwCtkGG7GUcE'),
  -- Disco 2: Acesso I
  ('rosas-de-ouro',               '15weZWScg5NNbPff1vNszz'),
  ('aguia-de-ouro',               '6wd72aYQJ5OJ6ch7OeDrxw'),
  ('mancha-verde',                '5ik1vaOLSOMEYwK7gwTg2k'),
  ('independente-tricolor',       '0da9U9vr9T9bTnN3GZWgsn'),
  ('unidos-de-vila-maria',        '1WPYssi8gMc2R9jBd6JDWT'),
  ('dom-bosco-de-itaquera',       '7bGNrt1lVoxzsJfC0tIGC7'),
  ('morro-da-casa-verde',         '62iFGmA2Pw1dg2aRu4mYn1'),
  ('x-9-paulistana',              '1P7PCsSzPRqPK95MCUtXxI'),
  -- Disco 3: Acesso II
  ('nene-de-vila-matilde',        '5cOHF75GQhAfq41vEshH6V'),
  ('camisa-12',                   '2yz4MA5Cj9TK1rIql7yvu1'),
  ('torcida-jovem',               '05goUqarGmZOJ2f0mIUzgv'),
  ('imperador-do-ipiranga',       '1ElRBnweNCHTP5Y3AQfQCl'),
  ('primeira-da-cidade-lider',    '6a1LzirrP44lX0fZD381fL'),
  ('imperatriz-da-pauliceia',     '6YkNMnrODse0c77Ywh9rNW'),
  ('unidos-de-sao-lucas',         '60lAr5p2u7A4f7KkKa9hxu'),
  ('unidos-do-peruche',           '2XXtqLUY6mcy61i74XAHFU'),
  ('brinco-da-marquesa',          '1I2VgObEweiScbkTNWXHvy'),
  ('unidos-de-santa-barbara',     '6NfKaWljDxasEpN7NFnza8')
) as v(slug, faixa)
join desfiles d on true
where e.slug = v.slug and d.escola_id = e.id;
