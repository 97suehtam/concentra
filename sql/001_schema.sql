-- =========================================================
-- App Carnaval SP 2027 — esquema inicial (Supabase/Postgres)
-- Princípio: todo dado tem fonte e status de verificação.
-- =========================================================

-- ---------- Edição do carnaval ----------
create table carnavais (
  id          serial primary key,
  ano         int not null unique,
  local       text not null,
  criado_em   timestamptz default now()
);

create table grupos (
  id           serial primary key,
  carnaval_id  int not null references carnavais(id) on delete cascade,
  nome         text not null,               -- 'Especial', 'Acesso I', 'Acesso II'
  unique (carnaval_id, nome)
);

-- Noites de desfile (o Especial tem duas)
create table noites (
  id           serial primary key,
  grupo_id     int not null references grupos(id) on delete cascade,
  data         date not null,
  abertura_portoes time,                    -- preencher quando a Liga divulgar
  unique (grupo_id, data)
);

-- ---------- Escolas (dado perene, independe do ano) ----------
create table escolas (
  id             serial primary key,
  nome           text not null unique,
  slug           text not null unique,
  bairro         text,
  fundacao       date,
  cores          text[],
  site_url       text,
  instagram_url  text,
  youtube_url    text,
  historia_md    text,                       -- texto curado/autoral
  historia_fonte_url text
);

-- ---------- Participação da escola numa edição ----------
create table desfiles (
  id                 serial primary key,
  escola_id          int not null references escolas(id),
  noite_id           int not null references noites(id),
  ordem              int not null,           -- posição na noite
  horario_previsto   time,
  enredo_titulo      text,
  enredo_sinopse_url text,                   -- link oficial da escola
  carnavalesco       text,
  samba_titulo       text,
  samba_audio_url    text,                   -- link oficial (YouTube/Spotify da escola)
  fonte_url          text,
  verificado         boolean default false,  -- true só após conferir em fonte oficial
  atualizado_em      timestamptz default now(),
  unique (noite_id, ordem),
  unique (escola_id, noite_id)
);

-- ---------- Fontes de dados ----------
create table fontes (
  id             serial primary key,
  nome           text not null,
  tipo           text not null check (tipo in
                   ('oficial_liga','oficial_escola','imprensa','agregador','wiki')),
  url            text not null,
  metodo_coleta  text not null check (metodo_coleta in
                   ('wp_rest','rss','mediawiki_api','instagram_api','scraping','manual')),
  escola_id      int references escolas(id),  -- quando a fonte é de uma escola
  ativo          boolean default true,
  ultima_coleta  timestamptz,
  observacao     text
);

-- ---------- Notícias ----------
create table noticias (
  id            serial primary key,
  fonte_id      int not null references fontes(id),
  titulo        text not null,
  url           text not null unique,
  publicada_em  timestamptz,
  resumo        text,                          -- resumo autoral, nunca o texto da matéria
  coletada_em   timestamptz default now()
);

create table noticias_escolas (
  noticia_id int references noticias(id) on delete cascade,
  escola_id  int references escolas(id) on delete cascade,
  primary key (noticia_id, escola_id)
);

-- ---------- Ingressos (sem API: link + snapshot manual) ----------
create table ingressos (
  id            serial primary key,
  noite_id      int not null references noites(id),
  setor         text not null,
  preco_inteira numeric(10,2),
  operadora     text,                          -- muda a cada ano
  url_compra    text,
  status        text check (status in ('em_breve','a_venda','esgotado')),
  fonte_url     text,
  atualizado_em timestamptz default now()
);

-- ---------- Fila de curadoria (o agente sugere, você aprova) ----------
create table sugestoes (
  id             serial primary key,
  tabela         text not null,
  registro_id    int,                          -- null = criar novo registro
  campo          text not null,
  valor_atual    text,
  valor_sugerido text not null,
  fonte_url      text not null,
  status         text default 'pendente' check (status in ('pendente','aprovada','rejeitada')),
  criada_em      timestamptz default now(),
  revisada_em    timestamptz
);

-- ---------- Leitura pública, escrita só autenticada ----------
do $$
declare t text;
begin
  foreach t in array array['carnavais','grupos','noites','escolas','desfiles',
                           'fontes','noticias','noticias_escolas','ingressos']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy leitura_publica on %I for select using (true)', t);
  end loop;
  alter table sugestoes enable row level security;  -- sem policy pública
end $$;

-- =========================================================
-- SEED — Carnaval 2027 (ordem oficial divulgada pela Liga-SP em 16/05/2026)
-- Enredos: fonte agregadora (SASP), verificado = false até conferir na escola
-- =========================================================
insert into carnavais (ano, local) values (2027, 'Sambódromo do Anhembi');

insert into grupos (carnaval_id, nome) values
  (1,'Especial'), (1,'Acesso I'), (1,'Acesso II');

insert into noites (grupo_id, data) values
  (1,'2027-02-05'),  -- id 1: Especial sexta
  (1,'2027-02-06'),  -- id 2: Especial sábado
  (2,'2027-02-07'),  -- id 3: Acesso I
  (3,'2027-01-30');  -- id 4: Acesso II

insert into escolas (nome, slug) values
  -- Especial sexta (ids 1–7)
  ('Pérola Negra','perola-negra'),
  ('Vai-Vai','vai-vai'),
  ('Barroca Zona Sul','barroca-zona-sul'),
  ('Dragões da Real','dragoes-da-real'),
  ('Acadêmicos do Tatuapé','academicos-do-tatuape'),
  ('Mocidade Unida da Mooca','mocidade-unida-da-mooca'),
  ('Camisa Verde e Branco','camisa-verde-e-branco'),
  -- Especial sábado (ids 8–14)
  ('Império de Casa Verde','imperio-de-casa-verde'),
  ('Gaviões da Fiel','gavioes-da-fiel'),
  ('Mocidade Alegre','mocidade-alegre'),
  ('Tom Maior','tom-maior'),
  ('Estrela do Terceiro Milênio','estrela-do-terceiro-milenio'),
  ('Colorado do Brás','colorado-do-bras'),
  ('Acadêmicos do Tucuruvi','academicos-do-tucuruvi'),
  -- Acesso I (ids 15–22)
  ('X-9 Paulistana','x-9-paulistana'),
  ('Dom Bosco de Itaquera','dom-bosco-de-itaquera'),
  ('Rosas de Ouro','rosas-de-ouro'),
  ('Águia de Ouro','aguia-de-ouro'),
  ('Unidos de Vila Maria','unidos-de-vila-maria'),
  ('Mancha Verde','mancha-verde'),
  ('Morro da Casa Verde','morro-da-casa-verde'),
  ('Independente Tricolor','independente-tricolor'),
  -- Acesso II (ids 23–32)
  ('Unidos de Santa Bárbara','unidos-de-santa-barbara'),
  ('Brinco da Marquesa','brinco-da-marquesa'),
  ('Unidos do Peruche','unidos-do-peruche'),
  ('Imperatriz da Pauliceia','imperatriz-da-pauliceia'),
  ('Imperador do Ipiranga','imperador-do-ipiranga'),
  ('Nenê de Vila Matilde','nene-de-vila-matilde'),
  ('Unidos de São Lucas','unidos-de-sao-lucas'),
  ('Torcida Jovem','torcida-jovem'),
  ('Primeira da Cidade Líder','primeira-da-cidade-lider'),
  ('Camisa 12','camisa-12');

-- Grupo Especial com enredos já divulgados (null = a levantar)
insert into desfiles (escola_id, noite_id, ordem, enredo_titulo, carnavalesco, fonte_url) values
  (1, 1,1,'Sem Vacilar, Sem Me Exibir, Sou Jovelina Pérola Negra', null,
      'https://canaldocarnaval.com.br/conheca-os-14-enredos-do-grupo-especial-de-sao-paulo-para-o-carnaval-2027/'),
  (2, 1,2,'3 Obás de Xangô – A Mãe Bahia em Cantos, Cores e Memórias','Alexandre Louzada e Victor Santos','https://sasp.com.br/central-do-carnaval-2027/'),
  (3, 1,3,'Elekô Obá Xirê','Pedro Magoo','https://sasp.com.br/central-do-carnaval-2027/'),
  (4, 1,4, null, null, null),
  (5, 1,5, null, null, null),
  (6, 1,6,'Modupé, Cardeais!','Renan Ribeiro','https://sasp.com.br/central-do-carnaval-2027/'),
  (7, 1,7,'Ajuruetês – O voo da Terra Brazil','Marcus Ferreira','https://sasp.com.br/central-do-carnaval-2027/'),
  (8, 2,1, null, null, null),
  (9, 2,2,'É Noite de Gira na Casa de Ogum','Rayner Pereira e Julio Poloni','https://sasp.com.br/central-do-carnaval-2027/'),
  (10,2,3,'Sete Anos de Mar, Sete Léguas de Encanto: A Nau que venceu o Diabo sob a benção do sagrado manto','Caio Araújo','https://sasp.com.br/central-do-carnaval-2027/'),
  (11,2,4,'Eu Sou o Pão da Vida','Flávio Campello','https://sasp.com.br/central-do-carnaval-2027/'),
  (12,2,5,'Incrível, Fantástico, Extraordinário','Paulo Barros','https://sasp.com.br/central-do-carnaval-2027/'),
  (13,2,6,'Ojuara: O Homem que Desafiou o Diabo','David Eslavick','https://sasp.com.br/central-do-carnaval-2027/'),
  (14,2,7,'Ogbódirin, Ògbóni','Nicolas Gonçalves','https://sasp.com.br/central-do-carnaval-2027/');

-- Acessos: só ordem por enquanto
insert into desfiles (escola_id, noite_id, ordem)
select id, 3, id - 14 from escolas where id between 15 and 22;
insert into desfiles (escola_id, noite_id, ordem)
select id, 4, id - 22 from escolas where id between 23 and 32;

-- Fontes de coleta (endpoints marcados "testar" ainda não foram confirmados)
insert into fontes (nome, tipo, url, metodo_coleta, observacao) values
  ('Liga-SP','oficial_liga','https://ligasp.com.br/','wp_rest',
     'Site em WordPress. Testar /wp-json/wp/v2/posts e /feed'),
  ('SASP – Central do Carnaval 2027','agregador','https://sasp.com.br/central-do-carnaval-2027/','scraping',
     'Melhor consolidação de enredos e carnavalescos encontrada'),
  ('SRzd – Carnaval SP','imprensa','https://srzd.com/blog/carnaval/sao-paulo/','rss',
     'Cobertura contínua; testar feed da categoria'),
  ('Canal do Carnaval','imprensa','https://canaldocarnaval.com.br/','rss','Testar feed'),
  ('Metrópoles SP','imprensa','https://www.metropoles.com/sao-paulo','rss','Testar feed'),
  ('Wikipedia PT','wiki','https://pt.wikipedia.org/','mediawiki_api',
     'Histórico, títulos e campeões por edição');
