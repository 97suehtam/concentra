-- Mídia do samba-enredo. Só links oficiais: a letra NÃO é guardada (direito autoral),
-- o app leva até a página oficial que a publica.

-- Samba da edição (2027): clipe e letra no canal oficial
alter table desfiles
  add column samba_video_url text,  -- clipe oficial (YouTube da Liga-SP ou da escola)
  add column samba_letra_url text;  -- página oficial com a letra

-- Último samba da escola no Spotify (álbum oficial da Liga-SP). Enquanto o álbum de 2027
-- não sai, aponta para o de 2026; quando sair, troca aqui.
alter table escolas
  add column ultimo_samba_titulo      text,
  add column ultimo_samba_ano         int,
  add column ultimo_samba_spotify_url text;
