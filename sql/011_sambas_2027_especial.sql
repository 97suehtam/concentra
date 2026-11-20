-- Clipes oficiais 2027 do Grupo Especial, publicados pela Liga-SP no YouTube em 20/11/2026
-- (canal "Liga Carnaval SP - Oficial"). Aprovado pelo Matheus e gravado em 20/11/2026.
-- A Mocidade Alegre tinha o vídeo do canal da escola (setembro); passa a usar o clipe da Liga, como as outras.
-- O clipe dela saiu duplicado no canal (hRTgiK5rooY e CdPc5fSBySM, mesmo vídeo): ficou o primeiro.
update desfiles d set samba_video_url = 'https://www.youtube.com/watch?v=' || v.id, atualizado_em = now()
from escolas e, (values
  ('perola-negra', 'zmYZqpi6o3U'),
  ('vai-vai', 'FFypE7bAaE4'),
  ('barroca-zona-sul', 'pyu4DJwx1V8'),
  ('dragoes-da-real', 'zL54AvhXz3E'),
  ('academicos-do-tatuape', 'OLIgafQjLJM'),
  ('mocidade-unida-da-mooca', 'gOCC3qVe3s4'),
  ('camisa-verde-e-branco', '7HSoqS1LGiQ'),
  ('imperio-de-casa-verde', 'G86Z30LQSns'),
  ('gavioes-da-fiel', 'FbpjNKQFIAc'),
  ('mocidade-alegre', 'hRTgiK5rooY'),
  ('tom-maior', '1p9QNT8coEA'),
  ('estrela-do-terceiro-milenio', 'u9FN2EL0Spc'),
  ('colorado-do-bras', 'nOEwK6obGvQ'),
  ('academicos-do-tucuruvi', 'Hdd0oNdfMMA')
) as v(slug, id)
where e.slug = v.slug and d.escola_id = e.id;
