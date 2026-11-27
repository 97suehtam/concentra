# App Carnaval SP 2027

App/site que reúne o Carnaval 2027 de São Paulo num lugar só: escolas, enredos (com links oficiais), história das escolas, ingressos, horários e notícias da Liga-SP. Projeto pessoal do Matheus, em fase de validação da hipótese.

Stack: React + Supabase. Conversar e escrever código/comentários em português.

## Contexto do evento (fonte: Liga-SP, ordem divulgada em 16/05/2026)

- Local: Sambódromo do Anhembi.
- Acesso II: sábado, 30/01/2027 (10 escolas).
- Grupo Especial: sexta 05/02 e sábado 06/02/2027 (7 escolas por noite).
- Acesso I: domingo, 07/02/2027 (8 escolas).
- Campeãs: sábado, 13/02/2027 (grupo "Campeãs", noite 5). Não tem desfiles cadastrados porque as escolas só saem na apuração. Fonte: página de venda do Clube do Ingresso.
- Total: 32 escolas filiadas à Liga-SP. A ordem completa está no seed de `sql/001_schema.sql`.

## Conclusões da pesquisa de fontes

- **Não existe API oficial** do Carnaval de SP. Nem a Liga-SP nem as escolas publicam dados estruturados.
- **Liga-SP (ligasp.com.br)** roda WordPress. A REST API (`/wp-json/wp/v2/posts`) e o `/feed` provavelmente estão abertos, mas isso ainda não foi confirmado.
- **SASP, Central do Carnaval 2027** (sasp.com.br/central-do-carnaval-2027/): melhor consolidação de enredo e carnavalesco por escola. Só dá para coletar via scraping. Pedir permissão à SASP antes de automatizar.
- **Notícias:** SRzd (srzd.com/blog/carnaval/sao-paulo/), Canal do Carnaval e Metrópoles SP.
- **Endpoints confirmados (03/11/2026):** Liga-SP, SASP e Canal do Carnaval têm o REST do WordPress aberto e o robots.txt libera. O feed da categoria do SRzd é `/category/carnaval/sao-paulo/feed/` (o `/blog/.../feed/` dá 404). No Metrópoles, `/sao-paulo/feed` é noticiário geral; usamos `/tag/carnaval/feed`, que é nacional (muito Rio), então o coletor precisa filtrar por nome de escola. Como nada passou no filtro, a fonte foi desativada (`ativo = false`) em 03/11/2026. SRzd e Metrópoles bloqueiam `/wp-json/` no robots.txt, então lá é só RSS.
- **História e campeões:** API do MediaWiki da Wikipedia PT.
- **Ingressos:** a operadora muda a cada ano (já foram Ingresso Fácil e Clube do Ingresso) e nenhuma tem API. O app guarda deep link e um snapshot manual.
  - 2027 (post da Liga de 14/09/2026): **Clube do Ingresso**, hub `clubedoingresso.com/carnavalsp`, mais bilheteria física na sede da Liga, com parcelamento em até 3x. Alguns setores já esgotaram.
  - O hub lista uma página por noite e setor: `/evento/carnavalsp-2027-<data>` (geral), `-esquenta`, `-lounge` e `-mesas-cadeiras`. Inclui **13/02, o Desfile das Campeãs**, só com Arquibancadas. Os 15 links das 4 noites e o das Campeãs (16 no total) entraram em `ingressos` em 03/11/2026, aprovados pelo Matheus. Preço e status ficaram nulos: a disponibilidade só aparece no mapa de assentos (seats.io). O Acesso II não tem página de Arquibancadas.
  - O robots.txt do Clube do Ingresso bloqueia `/api/`, `/checkout/` e `/minha-conta/`. Não dá para ler as compras do usuário. Ele guarda o link do pedido no próprio aparelho ("Meus ingressos").
- **Instagram das escolas:** é onde os enredos são anunciados. A Instagram Graph API (Business Discovery) talvez sirva para ler contas business públicas. Ainda não foi avaliada.
- Gazeta SP bloqueia bots (403).

## Decisões de arquitetura

- **Base curada + automação só no que muda.** O volume é pequeno, então escolas, enredos e horários vão para tabelas curadas. Notícias são coletadas por feed.
- **Escola separada de desfile.** `escolas` guarda o dado perene. `desfiles` guarda o que é por edição (ordem, enredo, carnavalesco, samba).
- **Todo dado tem fonte.** Cada registro carrega `fonte_url` e `verificado`. Os enredos do seed vieram de agregador e estão com `verificado = false` até serem conferidos no canal oficial da escola.
- **Curadoria com revisão humana.** O agente coletor escreve em `sugestoes` e só o Matheus aprova. Nada vai direto para a base pública.
- **RLS.** Leitura pública em tudo, exceto `sugestoes`, `perfis` e `favoritos`. As escritas usam a service role key, que nunca vai para o front nem para o git.
- **Login opcional (Supabase Auth, link mágico por e-mail).** Sem login, perfil, grade e ingressos ficam no localStorage. Com login, `perfis` e `favoritos` (`sql/003_perfis.sql`) guardam uma cópia, e cada pessoa só lê e escreve as próprias linhas (`auth.uid()`). Os ingressos guardados não sobem para a nuvem. A sincronização fica em `web/src/lib/sessao.ts`: ao entrar, junta os dois lados; depois, cada mudança local sobe.
- **Copyright.** Notícias guardam título, URL e um resumo autoral, nunca o texto da matéria. Sambas-enredo são guardados só como link oficial, sem a letra.

## Estrutura

```
sql/001_schema.sql            esquema + seed (32 escolas, ordem 2027, 11/14 enredos do Especial)
sql/002_fontes_endpoint.sql   adiciona endpoint/ultimo_teste em fontes
sql/003_perfis.sql            perfis e favoritos de quem faz login (RLS por usuário)
sql/004_samba_midia.sql       clipe e letra (links) do samba em desfiles; último samba no Spotify em escolas
sql/006_historia_escolas.sql  "Sobre a escola" (história, fundação, bairro, cores, site), gerado por scripts/gerar-sql-historia.mjs (gravado em 03/11/2026)
scripts/coletar-wikipedia.mjs página da Wikipedia PT + Wikidata de cada escola → wikipedia-escolas.json (npm run wikipedia)
scripts/dados/historia-escolas.mjs  curadoria: resumos autorais (fatos da Wikipedia, sem copiar o texto CC BY-SA)
sql/005_sambas_dados.sql      30 faixas do álbum 2026 da Liga no Spotify + clipe 2027 da Mocidade Alegre (aprovados e gravados em 03/11/2026)
sql/013_spotify_2027.sql      32 faixas do álbum 2027 da Liga no Spotify em escolas.ultimo_samba_* (gravado em 27/11/2026)
scripts/testar-fontes.mjs     descobre e testa feeds/APIs e grava o melhor endpoint em fontes
scripts/coletar-noticias.mjs  lê os endpoints de fontes, grava em noticias e associa escolas
scripts/comum.mjs             utilitários compartilhados (entidades HTML, normalização)
.env                          SUPABASE_URL + chave publicável (fora do git); a service role é opcional, só para gravar
web/                          front: Vite + React 19 + TS + Tailwind v4 + shadcn/ui (preset Nova, Radix, Lucide)
web/src/components/ui/        componentes do shadcn (gerados pelo CLI: `npx shadcn@latest add <nome>`)
web/src/lib/supabase.ts       cliente com a chave publicável, consultas e tipos
web/src/lib/app.ts            nome do app, data do 1º desfile, link da venda oficial
web/src/telas/                desfiles, minha-grade, noticias, ingressos, como-chegar, perfil, escola (navegação por hash: #/grade, #/escola/vai-vai)
web/src/lib/como-chegar.ts    endereço, coordenadas, rotas e links de Maps/Waze/Uber (transporte de 2026, com fonte)
web/src/lib/sessao.ts         login por link mágico e sincronização local ⇄ nuvem
web/imagens/                  fontes do ícone (icone.svg) e da imagem de compartilhamento (og.html); `node imagens/gerar.mjs` gera os PNG em web/public
web/.env.local                VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (fora do git)
```

Front: `npm --prefix web run dev`.

Deploy: na Vercel, projeto `concentra` (time `97suehtam-gmailcoms-projects`), em **https://concentra-carnaval.com**. O domínio foi comprado na Vercel em 03/11/2026, vence em 03/11/2027 e tem renovação automática; o DNS também fica na Vercel. O `www` e o https://concentra-gamma.vercel.app servem o mesmo app. **Deploy automático pelo GitHub** (desde 13/11/2026): repositório público https://github.com/97suehtam/concentra, ligado ao projeto. Cada push na `main` publica em produção; outras branches geram preview. A Vercel builda a pasta `web` (Root Directory `web`, framework Vite), e as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` ficam no projeto (Production e Preview). Só a chave publicável; a service role nunca vai para lá. O repositório git é só a pasta `carnaval-sp-2027/` (não a home). O deploy manual antigo (`vercel deploy web/dist`) não serve mais, porque o Root Directory agora é `web`.
- **Métricas:** Vercel Web Analytics, ligado em 04/11/2026 (`vercel project web-analytics enable concentra`). O painel fica no projeto, na aba Analytics. Em `web/src/lib/metricas.ts`: só em produção, com a contagem automática desligada (a navegação é por hash). Cada troca de tela vira página (`/escola/vai-vai`, agrupada em `/escola/[slug]`), e o `beforeSend` tira o hash e a query, porque o link mágico traz `#access_token`. Eventos personalizados (`track`) só funcionam no plano Pro, por isso não foram usados. A política de privacidade menciona as métricas.
- **Visual:** só tema escuro, com quadriculado de fundo, lima neon (`bg-lima`), lavanda, rosa, amarelo e céu (tokens em `web/src/index.css`). Títulos em Bricolage Grotesque e texto em Geist. É mobile first. No celular, a navegação é uma barra em pílula embaixo. No tablet (`md`, 768px) a coluna fica mais larga e as listas viram 2 colunas. No desktop (`lg`, 1024px) a pílula dá lugar à barra lateral fixa (`components/barra-lateral.tsx`, com Galera e Perfil), e as telas ganham 2 colunas. Na página da escola, as duas colunas usam `display: contents` no celular, e a classe `order-*` mantém a ordem visual. No desktop, a folha de escolas vira janela centralizada.
- **Nome provisório:** "Concentra" (de concentração, onde a escola se reúne antes de entrar). Trocar em `NOME_APP`. Evitar "Esquenta", que já é nome de camarote no Anhembi.
- **Estado local (sem login):** favoritos (= Minha grade) e "Meus ingressos" ficam no localStorage (`concentra:*`). Quando houver login, migrar para o Supabase.
- **Onboarding** (primeira abertura): apresentação, nome e tipo de folião (primeira vez, veterano ou desfila). O tipo muda as dicas em Como chegar.
- **Perfil** (avatar no topo): nome, tipo de folião, escola do coração (destaque rosa no card e contagem até ela desfilar), conquistas e conta.
- **Mapa:** Leaflet com tiles do OpenStreetMap escurecidos por CSS. A CARTO passou a exigir chave e o iframe de embed do OSM não renderiza no navegador do app. O tile.openstreetmap.org é para uso leve: em produção, trocar de provedor.
- **Emojis:** evitar os muito novos (🪇, 🪘, ❤️‍🔥), que aparecem como quadrado em aparelhos antigos.
- **Easter eggs:** 7 toques no logo ligam o modo bateria; tocar no card da contagem troca a frase; favoritar a noite inteira dá o "Folião raiz"; Gaviões e Mancha na mesma grade dão o "diplomacia do samba"; a primeira escola favoritada também tem toast. Quem tem a Gaviões como escola do coração pode segurar por 2s o 💖 do card no Perfil (ou Enter/espaço) ou o botão "Do coração" na página da Gaviões para ligar o "Modo Fiel": o verde-limão do app (`--lima`) vira branco, com a conquista "Fiel até na cor" (`lib/modo-fiel.ts`, `.modo-fiel` no `index.css`; o toque longo é `hooks/use-segurar.ts`, que só para no pointerup porque o celular dispara pointercancel no meio). Fica salvo no aparelho e desliga sozinho se a escola do coração mudar. Todos respeitam `prefers-reduced-motion`.
- **Movimento** (padrão: curva `ease-mola`):
  - Telas trocam pela View Transitions API (`transicao()` em `hooks/use-rota.ts`):
    - abrir escola desliza da direita, e voltar desliza para a direita;
    - as abas da barra fazem fade com leve subida;
    - trocar de noite desliza só a lista (`.lista-noite`).
  - O bloco da posição (`.vt-ordem`, `view-transition-name: ordem-<slug>`) voa do card até a página da escola, e só ao abrir ou voltar.
  - A rolagem de cada tela é lembrada para a volta. O `useConsulta` renderiza na hora o que já carregou, por isso a tela volta sem esqueleto.
  - A pílula da barra: cada nome abre até a largura medida dele, e a posição do indicador é calculada já no destino, com a mesma duração e curva (sem a barra "sambar").
  - O menu de baixo (`.menu-principal`) tem grupo próprio de transição, desenhado acima da tela (`z-index`); senão o conteúdo passa por cima dele durante a troca.
  - O `<main>` tem `view-transition-name`, o que cria uma camada própria: qualquer tela cheia `fixed` aberta de dentro dele (como o jogo) precisa de `createPortal(..., document.body)`, senão o menu fica por cima.
  - Fotos antigas que não devem aparecer (`old(root)`, `old(tela)` na troca de noite) usam `opacity: 0`, não `display: none`: o Safari do iPhone pode ignorar `display` nesses pseudo-elementos, e o navegador soma as duas imagens (plus-lighter).
  - Bottom sheet de escolas (`components/seletor-escola.tsx`, classe `.folha`): sobe com mola, tem busca sem acento e escolas agrupadas por grupo. Fecha arrastando a alça (mais de 120px, ou peteleco de pelo menos 60px), com Esc ou tocando fora. Hoje é usado na escola do coração e pode ser reaproveitado.
  - Listas com `.cascata` e `--i`; imagens e players com `.suave` e `aoCarregar`.
  - Sem a API, ou com "reduzir movimento", tudo vira troca direta.
  - Regras para não reintroduzir bugs (revisão de 04/11/2026):
    - **Toques rápidos e voltar:** a URL muda na hora do toque, e cada troca tem um número (`geracao`); uma troca atropelada é descartada. Se a transição não chamar a troca em 400ms (aba sem pintar), ela é aplicada direto.
    - **Gesto de voltar do celular** (`hasUAVisualTransition`): o navegador já anima, então o app não anima de novo.
    - **Animação de entrada em elemento que o dedo move** (folha): usar `backwards`, nunca `both`. Preso no fim, o transform da animação vence o estilo inline do arrasto.
    - **`active:scale` no Tailwind v4** usa a propriedade `scale`: listas `transition-[...]` precisam incluir `scale`.
    - **Pílula:** a primeira medida entra sem transição.
    - **Área de arrastar com botões dentro:** não capturar o ponteiro quando o toque começa num botão.
  - No navegador do app, "reduzir movimento" vem ligado, e abas em segundo plano congelam as animações. Para testar movimento, traga a aba para a frente.
- **Jogo "Assume a Bateria"** (card na Home, `components/jogo-bateria.tsx`): jogo de ritmo de ~1 min, a 110 bpm, com surdo, caixa e tamborim.
  - A partitura é gerada em `lib/bateria-ritmo.ts`; os sons são sintetizados no Web Audio (`lib/bateria-som.ts`), então não há arquivo de áudio e funciona sem internet.
  - Duas paradinhas: tocar nelas zera o combo. Tocar fora do tempo "atravessa" e também zera.
  - A nota sai como na apuração (9,0 a 10). O recorde fica no localStorage (`concentra:bateria`).
  - Conquistas `nota-dez` e `paradinha`.

Coletor de notícias: `npm run coletar` (dry-run, lê com a chave publicável) e `npm run coletar:gravar` (precisa da service role). Canal do Carnaval e Metrópoles misturam outros carnavais, então só entra notícia que cite escola da Liga-SP ou o carnaval paulistano (`FILTRAR_SP`). A associação às escolas casa pelo nome e por apelidos seguros (`APELIDOS`) no título e nas categorias do RSS. `resumo` fica vazio para ser escrito à mão.

## Comunidade (etapa 1, 03/11/2026)

O que existe: perfil público opcional (foto, @, bio, noites, setor, "procuro galera"), tela Galera (`#/galera`), conexões em duas mãos, bloquear, denunciar, Política de Privacidade (`#/privacidade`), baixar meus dados e excluir conta. **Sem chat** (etapa 2, só entre conexões aceitas).

Regras, decididas com o Matheus:
- **Só 18+:** é preciso declarar a idade para participar.
- **Reciprocidade:** só vê a galera quem também é público.
- **Privado por padrão:** ficar público é consentimento explícito, e o banco guarda quando foi dado (`publico_em`).
- **Bloqueio:** esconde as duas pessoas uma da outra e desfaz a conexão.

Arquivos:
- `sql/007_comunidade.sql`, `008` (funções no schema `privado`, fora da API) e `009` (reciprocidade).
- Edge Function `excluir-conta` (`supabase/functions/excluir-conta`): apaga a foto e o usuário do Auth, e o resto sai em cascata.
- Front: `lib/comunidade.ts`, `components/perfil-comunidade.tsx`, `telas/galera.tsx`, `telas/privacidade.tsx`.

**Moderação (Matheus, pelo MCP ou pelo SQL Editor):**
- Fotos pendentes: `select usuario, foto_path from perfis where foto_status = 'pendente';` Para ver a foto, abra Storage › avatares › caminho.
- Aprovar ou recusar: `update perfis set foto_status = 'aprovada' where usuario = '...';` (ou `'recusada'`). Só o dono do banco muda esse campo; o gatilho `perfis_regras` impede o usuário.
- Denúncias abertas: `select * from denuncias where status = 'aberta' order by criada_em;` Depois de resolver, marque `status = 'resolvida'` ou `'descartada'`.
- Remover alguém: `update perfis set publico = false, foto_status = 'recusada' where id = '...';` Para excluir de vez: Authentication › Users › Delete.

Antes de abrir ao público:
- contato da política: `PRIVACIDADE.contato` em `web/src/lib/app.ts` (97suehtam@gmail.com, escolhido pelo Matheus);
- passar a política por revisão jurídica;
- lembrar que o Resend grátis manda até 100 e-mails por dia.

## Estado atual / próximos passos

1. [x] Rodar `sql/001_schema.sql` e `sql/002_fontes_endpoint.sql` no Supabase. Projeto `carnaval-sp-2027` (ref `kbpsotsjbuyaiuumjuwk`, sa-east-1, URL https://kbpsotsjbuyaiuumjuwk.supabase.co), aplicados como migrations em 03/11/2026.
2. [x] `node scripts/testar-fontes.mjs --dry-run`. Revisar o `relatorio-fontes.json` e depois rodar gravando. Endpoints das 6 fontes gravados em `fontes` em 03/11/2026 (pelo MCP, com o mesmo conteúdo que o script gravaria).
3. [x] (03/11/2026: 59 notícias e 28 vínculos com escolas gravados pelo MCP. Para as próximas coletas, `npm run coletar:gravar` com a service role, ou agendar) Construir o coletor de notícias a partir dos endpoints que funcionaram. Ele grava em `noticias` e associa às escolas em `noticias_escolas`.
4. [ ] Completar os dados que faltam:
   - [x] Enredos e sambas 2027 das 32 escolas (25/11/2026, `sql/011` e `sql/012`): clipe oficial da Liga em `samba_video_url`, e o nome do samba (= enredo, grafia da primeira linha da descrição do clipe, "Enredo: ...") em `samba_titulo` e `enredo_titulo`. `fonte_url` aponta para o clipe e `verificado = true`. Carnavalescos e intérpretes não foram gravados.
   - Perfis oficiais das escolas: 6 sites confirmados no ar (vindos do Wikidata). Instagram e YouTube ficaram vazios: o Wikidata tem alguns perfis (em `wikipedia-escolas.json`), mas ainda não foram conferidos.
   - "Sobre a escola": 30 resumos com fonte na Wikipedia. Brinco da Marquesa e Imperatriz da Paulicéia não têm história (as páginas só trazem o endereço). Fundação ficou vazia onde as fontes conflitam: Vai-Vai (1930 ou 1931) e São Lucas (anos 1970 ou 1980).
   - Horários previstos por escola e preços de ingressos quando a Liga divulgar.
   - Sambas 2027: os clipes das 32 escolas saíram no canal da Liga (https://www.youtube.com/channel/UCB6fJZdomHX2RlGZJwjIs8g), o Especial em 20/11 e o Acesso até 25/11/2026, e já estão gravados. A Liga publicou o da Mocidade Alegre duas vezes (ficou `hRTgiK5rooY`). Falta `samba_letra_url` (só o link da página oficial; a letra não é guardada). O álbum oficial 2027 da Liga saiu no Spotify (https://open.spotify.com/album/7CpY2cUFz2QheU5l2z2dNO, 3 discos, 32 faixas) e já está em `escolas.ultimo_samba_*` (`sql/013`, 27/11/2026). Para ler as faixas, use a página de incorporação `open.spotify.com/embed/album/<id>`: o JSON `__NEXT_DATA__` traz a lista.
5. [x] Conferir os enredos do seed nos canais oficiais e marcar `verificado = true` (25/11/2026, pelos clipes oficiais da Liga).
6. [ ] Front em React. Feitos: home por noite, Minha grade, Notícias com filtro da grade, Ingressos, Como chegar, onboarding, Perfil com login opcional e página da escola (`#/escola/<slug>`). Ela mostra desfile, enredo, carnavalesco, notícias e botões de grade e coração. "Sobre a escola" (história, fundação, bairro, cores, redes) só aparece quando esses campos forem curados (passo 4). O nome ficou "Concentra" (domínio concentra-carnaval.com).
7. [x] Login: link mágico testado de ponta a ponta em 03/11/2026, no Firefox em `http://localhost:5173` e no iPhone em https://concentra-gamma.vercel.app. Perfil, conquistas e favoritos sincronizaram entre os aparelhos.
   - **Supabase Auth:** Site URL `https://concentra-carnaval.com`. Redirect URLs: o domínio novo, o `vercel.app` e `http://localhost:5173`, todos com `/**`.
   - **E-mail:** enviado pelo Resend por SMTP (`smtp.resend.com:465`, usuário `resend`, remetente `nao-responda@concentra-carnaval.com`). A senha é uma API key do Resend e fica só no painel do Supabase. O limite subiu para 30 e-mails por hora; o plano grátis do Resend dá 100 por dia e 3.000 por mês.
   - **Domínio no Resend:** verificado, com DKIM `resend._domainkey`, CNAMEs `rsend` e `send` e DMARC `_dmarc`, todos no DNS da Vercel.
   - **Modelos de e-mail:** os textos em pt-BR (Magic Link e Confirm signup) estão em `emails/` e já foram colados no Supabase.

   Para lembrar: cada link vale uma vez só, por 1 hora; link vencido volta com `#error=...` e o app avisa. No celular, `localhost` não abre: só com deploy ou pelo IP da rede.
8. [ ] Atualizar `web/src/lib/como-chegar.ts` quando a SPTrans/Prefeitura divulgar a operação de 2027.
