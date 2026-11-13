-- Dragões da Real, Carnaval 2027 (aprovado pelo Matheus em 03/11/2026).
-- Enredo das reportagens (TMC 19/05/2026; CNN Brasil 28/04/2026). Fica verificado = false ("a confirmar")
-- porque o Instagram da escola não pôde ser lido sem login.
update desfiles set
  enredo_titulo = 'Sob as Bênçãos de Xangô, a Coroação do Príncipe Reinaldo',
  fonte_url = 'https://tmc.com.br/?p=60160',
  verificado = false
where escola_id = (select id from escolas where slug = 'dragoes-da-real');

-- Perfil oficial verificado (@dragoescarnaval)
update escolas set instagram_url = 'https://www.instagram.com/dragoescarnaval/'
where slug = 'dragoes-da-real' and instagram_url is null;
