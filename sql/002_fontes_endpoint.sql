-- Rodar antes do script testar-fontes.mjs
alter table fontes add column if not exists endpoint        text;        -- URL exata que funcionou
alter table fontes add column if not exists ultimo_teste    jsonb;       -- resultado bruto do último teste
alter table fontes add column if not exists ultimo_teste_em timestamptz;
create unique index if not exists fontes_nome_key on fontes (nome);     -- o script casa por nome
