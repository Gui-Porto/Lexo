# Migração de infra: Render → Vercel + Neon

## Contexto

O Lexo roda hoje inteiramente no Render (Web Service + PostgreSQL, ambos free
tier), com auto-deploy na branch `master`. Duas mudanças já começaram nesta
sessão, ainda não commitadas:

- `prisma.config.ts` — migrations passam a usar `DIRECT_URL` (conexão direta
  do Neon, sem pooler), porque o pooler em modo transaction não suporta os
  advisory locks que `prisma migrate` usa.
- `vercel.json` — cron diário (`0 12 * * *`) pro endpoint
  `/api/cron/notify-deadlines`, que hoje é documentado no `.env`/README como
  configurado manualmente no painel do Render.

Essas duas mudanças só fazem sentido juntas se o destino final for: **app na
Vercel, banco no Neon**. Motivação: o Postgres free do Render expira depois
de um tempo (precisa recriar/migrar dados periodicamente) e o Render não tem
cron gratuito — ambos incompatíveis com a restrição de custo zero do
projeto. Vercel Hobby (grátis) resolve hosting + cron; Neon free tier não
expira.

Confirmado nesta conversa: o banco **ainda está no Render Postgres** (host
`dpg-d8pdha8k1i2s73aflgpg-a.oregon-postgres.render.com`), não no Neon. O app
**não tem domínio próprio** — usa `lexo-45tf.onrender.com`.

## Abordagem

Corte em 2 estágios independentes, não um "big bang". Cada estágio é
validado antes do próximo, então uma falha é isolável (sei se foi o banco ou
o host que quebrou).

### Estágio 1 — banco: Render Postgres → Neon

1. Criar projeto no Neon (free tier).
2. Pegar as duas connection strings do Neon: pooled (`DATABASE_URL`) e
   direta (`DIRECT_URL`).
3. `pg_dump` do Render Postgres → restaurar no Neon.
4. Trocar `DATABASE_URL`/`DIRECT_URL` no Web Service do Render (app
   continua rodando no Render, só o banco muda).
5. Validar a aplicação em produção (login, CRUD básico, cron manual) contra
   o Neon.
6. Só depois de validado: desligar/remover o Postgres do Render.

### Estágio 2 — host: Render → Vercel

1. Criar projeto na Vercel apontando pro mesmo repo GitHub, branch
   `master`.
2. Configurar env vars na Vercel: as mesmas do Render, mais
   `NEXTAUTH_URL`/`AUTH_URL` apontando pro novo domínio `*.vercel.app`.
3. Deploy e validação manual (login, CRUD, 2FA, checkout Stripe).
4. Atualizar o endpoint de webhook no painel do Stripe pro novo domínio
   (senão billing para de atualizar plano).
5. Confirmar `CRON_SECRET` configurado na Vercel e que o cron do
   `vercel.json` dispara corretamente.
6. Só depois de validado: desligar o Web Service do Render.

## Rollback

Sem domínio próprio, não há corte de DNS — "rollback" é simplesmente não
divulgar a URL nova e continuar usando o link do Render, que segue no ar até
ser desligado manualmente no fim do Estágio 2.

## Fora de escopo

- Remover o hack de `NODE_OPTIONS=460MB` no build (`package.json`) — era
  necessário pros 512MB do Render free, inofensivo na Vercel, não bloqueia a
  migração.
- Atualizar textos do README (menção a "Deploy: Render", SQLite dev local)
  — cosmético, fazer depois do corte confirmado.
- Domínio próprio / DNS — não existe hoje, fora de escopo.
