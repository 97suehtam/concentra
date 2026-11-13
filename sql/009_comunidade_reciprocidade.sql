-- Reciprocidade: só vê a galera (e pede conexão) quem também tem perfil público e 18+.
-- Evita que alguém observe os perfis sem se mostrar.
create or replace function privado.eu_sou_maior() returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = (select auth.uid()) and maior_18_em is not null and publico)
$$;
comment on function privado.eu_sou_maior() is 'Quem chama participa da comunidade: 18+ declarado e perfil público';
