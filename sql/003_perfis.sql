-- Perfil e favoritos de quem faz login (opcional; sem login tudo fica no aparelho).
-- Diferente das tabelas do carnaval, aqui NÃO há leitura pública: cada pessoa só vê o que é dela.

create table perfis (
  id                uuid primary key references auth.users(id) on delete cascade,
  nome              text check (char_length(nome) <= 40),
  escola_coracao_id int references escolas(id) on delete set null,
  tipo_folia        text check (tipo_folia in ('primeira_vez', 'veterano', 'desfila')),
  conquistas        text[] not null default '{}',  -- easter eggs encontrados
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

create table favoritos (
  user_id   uuid not null references auth.users(id) on delete cascade,
  escola_id int  not null references escolas(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (user_id, escola_id)
);

alter table perfis    enable row level security;
alter table favoritos enable row level security;

-- (select auth.uid()) em vez de auth.uid(): o Postgres avalia uma vez por consulta
create policy perfil_proprio on perfis for all
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy favoritos_proprios on favoritos for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
