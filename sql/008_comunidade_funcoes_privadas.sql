-- Funções auxiliares das regras de acesso saem do schema exposto na API (o advisor do Supabase
-- apontou que ha_bloqueio via RPC deixaria alguém descobrir se foi bloqueado).
-- As políticas de RLS apontam para as funções pelo OID, então continuam valendo.
create schema if not exists privado;
grant usage on schema privado to authenticated;

alter function public.eu_sou_maior() set schema privado;
alter function public.ha_bloqueio(uuid) set schema privado;
alter function public.perfil_visivel(uuid) set schema privado;

-- perfil_visivel chamava as outras duas em public: recria apontando para privado
create or replace function privado.perfil_visivel(alvo uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select privado.eu_sou_maior() and not privado.ha_bloqueio(alvo) and exists (
    select 1 from public.perfis where id = alvo and publico and maior_18_em is not null
  )
$$;

-- Funções de gatilho não precisam (nem devem) ser chamadas pela API
revoke execute on function public.bloqueio_desfaz_conexao() from public, anon, authenticated;
revoke execute on function public.perfis_regras() from public, anon, authenticated;
