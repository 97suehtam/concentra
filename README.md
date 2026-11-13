# Concentra

Todas as informações públicas do Carnaval de São Paulo 2027 em um só app: **[concentra-carnaval.com](https://concentra-carnaval.com)**

- **Desfiles:** a ordem das escolas em cada noite do Anhembi, do Especial ao Acesso, com enredo, samba e história de cada escola.
- **Minha grade:** você marca as escolas que quer ver e monta sua agenda das noites.
- **Notícias** das escolas, reunidas de fontes públicas.
- **Ingressos** e **Como chegar** ao Anhembi.
- **Comunidade** (opcional, só para maiores de 18) para achar galera para ir junto.
- Um mini jogo de bateria.

Funciona sem conta: o que é seu fica no próprio celular. A conta por e-mail é opcional e só serve para levar seus dados a outros aparelhos.

## Tecnologia

| Parte | O que usa |
|---|---|
| Interface (`web/`) | React, TypeScript, Vite, Tailwind e shadcn/ui; animações com View Transitions; mobile first |
| Dados e login (`sql/`, `supabase/`) | Supabase (Postgres com RLS, autenticação, armazenamento das fotos e Edge Functions) |
| Coleta (`scripts/`) | Scripts Node que buscam notícias e dados públicos |
| Hospedagem | Vercel, com Web Analytics anônimo e sem cookies |

## Rodar localmente

```bash
cd web
npm install
npm run dev
```

Crie `web/.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do seu projeto Supabase, e aplique os arquivos de `sql/` em ordem.

---

Feito por Matheus, com a ajuda de Claude Code. Um projeto que nasceu por causa da minha esposa, que é nerd de Carnaval.
