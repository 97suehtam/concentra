-- Comunidade (etapa 1): perfil público opcional, conexões em duas mãos, bloqueio, denúncia e foto moderada.
-- Regras (decididas com o Matheus em 03/11/2026):
--   * Só para maiores de 18: ver e ser visto exige a declaração de idade (maior_18_em).
--   * Perfil privado por padrão. Ficar público é consentimento explícito (publico_em guarda quando).
--   * Foto passa por moderação manual: toda foto nova fica 'pendente' e só aparece para os outros quando 'aprovada'.
--   * Bloqueio esconde as duas pessoas uma da outra e desfaz a conexão.
--   * Sem chat nesta etapa.

-- ---------- Perfil ----------
alter table perfis
  add column usuario        text,                -- @ público, minúsculo
  add column bio            text check (char_length(bio) <= 160),
  add column foto_path      text,                -- caminho no bucket 'avatares' ({uid}/arquivo)
  add column foto_status    text check (foto_status in ('pendente', 'aprovada', 'recusada')),
  add column noites         int[] not null default '{}', -- noites que pretende ir (ids de noites)
  add column setor          text check (char_length(setor) <= 40),
  add column procura_galera boolean not null default false,
  add column maior_18_em    timestamptz,         -- declaração de maioridade
  add column publico        boolean not null default false,
  add column publico_em     timestamptz,         -- quando consentiu em ficar público
  add constraint usuario_formato check (usuario ~ '^[a-z0-9_.]{3,20}$'),
  add constraint publico_exige_18_e_usuario check (not publico or (maior_18_em is not null and usuario is not null));

create unique index perfis_usuario_unico on perfis (usuario);

-- ---------- Bloqueios, conexões, denúncias ----------
create table bloqueios (
  quem       uuid not null references auth.users(id) on delete cascade,
  bloqueado  uuid not null references auth.users(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (quem, bloqueado),
  check (quem <> bloqueado)
);

create table conexoes (
  de         uuid not null references auth.users(id) on delete cascade, -- quem pediu
  para       uuid not null references auth.users(id) on delete cascade, -- quem aceita
  status     text not null default 'pendente' check (status in ('pendente', 'aceita')),
  criado_em  timestamptz not null default now(),
  aceita_em  timestamptz,
  primary key (de, para),
  check (de <> para)
);
create index conexoes_para on conexoes (para);

create table denuncias (
  id          bigint generated always as identity primary key,
  autor       uuid references auth.users(id) on delete set null,
  denunciado  uuid references auth.users(id) on delete cascade,
  motivo      text not null check (motivo in ('assedio', 'foto_impropria', 'perfil_falso', 'menor_de_idade', 'golpe', 'outro')),
  detalhe     text check (char_length(detalhe) <= 500),
  status      text not null default 'aberta' check (status in ('aberta', 'resolvida', 'descartada')),
  criada_em   timestamptz not null default now()
);
create index denuncias_autor on denuncias (autor);
create index denuncias_denunciado on denuncias (denunciado);

alter table bloqueios enable row level security;
alter table conexoes  enable row level security;
alter table denuncias enable row level security;

-- ---------- Funções auxiliares (security definer: leem outras linhas sem cair no RLS) ----------
create function public.eu_sou_maior() returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = (select auth.uid()) and maior_18_em is not null)
$$;

create function public.ha_bloqueio(outro uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bloqueios
    where (quem = (select auth.uid()) and bloqueado = outro) or (quem = outro and bloqueado = (select auth.uid()))
  )
$$;

-- Perfil que a pessoa logada pode ver: público, maior de idade, sem bloqueio, e ela também maior de idade
create function public.perfil_visivel(alvo uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select public.eu_sou_maior() and not public.ha_bloqueio(alvo) and exists (
    select 1 from public.perfis where id = alvo and publico and maior_18_em is not null
  )
$$;

-- ---------- RLS ----------
-- perfis: a política perfil_proprio (003) continua; esta libera a leitura dos perfis públicos
create policy perfil_publico on perfis for select to authenticated
  using (id <> (select auth.uid()) and public.perfil_visivel(id));

create policy bloqueios_proprios on bloqueios for all to authenticated
  using (quem = (select auth.uid())) with check (quem = (select auth.uid()));

-- Conexões: cada lado vê as suas. Pedir só para perfil visível; aceitar só pela função aceitar_conexao.
create policy conexoes_ver on conexoes for select to authenticated
  using ((select auth.uid()) in (de, para));
create policy conexoes_pedir on conexoes for insert to authenticated
  with check (de = (select auth.uid()) and status = 'pendente' and public.perfil_visivel(para));
create policy conexoes_desfazer on conexoes for delete to authenticated
  using ((select auth.uid()) in (de, para));

-- Denúncias: qualquer pessoa logada denuncia; só o Matheus lê (pelo painel, como dono)
create policy denuncias_criar on denuncias for insert to authenticated
  with check (autor = (select auth.uid()));

create function public.aceitar_conexao(quem_pediu uuid) returns void
  language sql security definer set search_path = '' as $$
  update public.conexoes set status = 'aceita', aceita_em = now()
  where de = quem_pediu and para = (select auth.uid()) and status = 'pendente'
$$;
revoke execute on function public.aceitar_conexao(uuid) from public, anon;
grant execute on function public.aceitar_conexao(uuid) to authenticated;

-- Bloquear desfaz qualquer conexão entre as duas pessoas
create function public.bloqueio_desfaz_conexao() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  delete from public.conexoes
  where (de = new.quem and para = new.bloqueado) or (de = new.bloqueado and para = new.quem);
  return new;
end $$;
create trigger bloqueio_desfaz_conexao after insert on bloqueios
  for each row execute function public.bloqueio_desfaz_conexao();

-- Foto: quem não é o moderador (dono do banco) não escolhe o status. Foto nova = pendente.
-- Também registra quando a pessoa ficou pública.
create function public.perfis_regras() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if current_user not in ('postgres', 'supabase_admin', 'service_role') then
    if tg_op = 'INSERT' or new.foto_path is distinct from old.foto_path then
      new.foto_status := case when new.foto_path is null then null else 'pendente' end;
    else
      new.foto_status := old.foto_status;
    end if;
  end if;
  if new.publico and (tg_op = 'INSERT' or not old.publico) then new.publico_em := now(); end if;
  if not new.publico then new.publico_em := null; end if;
  return new;
end $$;
create trigger perfis_regras before insert or update on perfis
  for each row execute function public.perfis_regras();

-- As funções auxiliares não devem ser chamadas por quem não está logado
revoke execute on function public.eu_sou_maior(), public.ha_bloqueio(uuid), public.perfil_visivel(uuid) from public, anon;
grant execute on function public.eu_sou_maior(), public.ha_bloqueio(uuid), public.perfil_visivel(uuid) to authenticated;

-- ---------- Fotos (Storage) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

-- Cada pessoa mexe só na própria pasta ({uid}/...)
create policy avatares_dono on storage.objects for all to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Os outros só veem a foto atual, aprovada, de um perfil visível
create policy avatares_publicos on storage.objects for select to authenticated
  using (
    bucket_id = 'avatares' and exists (
      select 1 from public.perfis p
      where p.foto_path = storage.objects.name and p.foto_status = 'aprovada' and public.perfil_visivel(p.id)
    )
  );
