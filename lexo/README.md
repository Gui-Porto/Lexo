# Lexo — Gestão para Escritórios de Advocacia

SaaS multi-tenant para escritórios de advocacia. Gerencie processos, clientes, prazos, financeiro, equipe e recursos de IA jurídica em um só lugar.

Em produção: [https://lexo-45tf.onrender.com](https://lexo-45tf.onrender.com)

## Stack

- **Next.js 16** App Router + Server Actions
- **Prisma 7** com PostgreSQL (produção) / SQLite (dev local)
- **Auth.js v5** — autenticação JWT com Credentials provider + 2FA (TOTP)
- **Tailwind v4** + **shadcn/ui** (Base UI)
- **Sonner** para toasts
- **Google Gemini** (free tier) para os recursos de IA
- **Stripe** para planos e billing
- **Resend** para emails transacionais
- Deploy: **Render** (web service + PostgreSQL), auto-deploy na branch `master`

## Funcionalidades

### Núcleo
- Cadastro de **processos, clientes, prazos e faturas**
- **Dashboard** com KPIs: processos ativos, prazos próximos, faturas em aberto, total de clientes
- Filtros, busca e **paginação server-side** nas 4 listagens
- Atribuição de **responsável** por processo
- Edição inline de prazos e honorários
- Validação de **CPF/CNPJ** no cadastro de clientes
- Combobox de **área jurídica**
- **Histórico de atividades** por processo
- Prazo vencido marcado automaticamente como `PERDIDO`
- Toasts de feedback em todas as ações

### Equipe e segurança
- **RBAC** com 3 perfis:
  - `ADMIN` — acesso total + gerenciamento de usuários
  - `ADVOGADO` — vê apenas seus próprios processos
  - `SECRETARIA` — sem acesso ao módulo financeiro
- **Convite de usuários** por email com link temporário
- **2FA (TOTP)** para administradores
- **Log de auditoria** de todas as ações por usuário
- Multi-tenant: todos os dados isolados por `organizationId`
- Registro cria organização + primeiro usuário ADMIN atomicamente

### Monetização
- **Planos**: Trial 30 dias → Essencial → Pro
- **Checkout e portal do cliente** via Stripe (webhooks atualizam o plano)

### IA jurídica (Google Gemini — free tier)
- **Gerador de minutas / peças processuais** (streaming)
- **Extrator de documentos PDF** — preenche formulários automaticamente
- **Pesquisa jurisprudencial** em linguagem natural
- **Resumo automático** do processo
- **Score de risco** de prazo com badge de prioridade

### Emails (Resend)
- Notificações de **prazo próximo do vencimento** (endpoint de cron protegido)
- Emails de **convite** de novos usuários

## Variáveis de ambiente

Mínimo para o app subir:

```
DATABASE_URL=...        # PostgreSQL (prod) ou file:./dev.db (dev)
AUTH_SECRET=...         # string aleatória (openssl rand -base64 32)
NEXTAUTH_URL=...        # http://localhost:3000 em dev
```

Por feature (sem elas, o build passa, mas a feature falha em runtime):

```
GEMINI_API_KEY=...           # IA — https://aistudio.google.com/apikey (gratuito)
RESEND_API_KEY=...           # Emails — https://resend.com/api-keys (free tier)
RESEND_FROM=...              # opcional, remetente dos emails
CRON_SECRET=...              # protege /api/cron/notify-deadlines
STRIPE_SECRET_KEY=...        # billing
STRIPE_WEBHOOK_SECRET=...    # webhook /api/webhooks/stripe
STRIPE_PRICE_ESSENCIAL=...   # price ID do plano Essencial
STRIPE_PRICE_PRO=...         # price ID do plano Pro
```

> Os clientes de SDK (Gemini, Stripe, Resend) são instanciados de forma **lazy** —
> a ausência de uma chave não quebra o build, apenas desativa a feature em runtime.

## Rodando localmente

```bash
cd lexo
npm install

# Configure o .env (mínimo para dev)
# DATABASE_URL="file:./dev.db"
# AUTH_SECRET="qualquer-string-aleatoria"
# NEXTAUTH_URL="http://localhost:3000"

npx prisma migrate dev
npx prisma generate

# (Opcional) popular com dados de exemplo
node seed-local.mjs

npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e crie sua organização em `/registrar`.

## Estrutura

```
lexo/
├── src/
│   ├── app/
│   │   ├── (dashboard)/         # Rotas protegidas com layout + sidebar
│   │   │   ├── dashboard/
│   │   │   ├── processos/       # inclui /minutas e /resumo (IA)
│   │   │   ├── clientes/
│   │   │   ├── agenda/
│   │   │   ├── financeiro/      # inclui /relatorio
│   │   │   ├── pesquisa-juridica/
│   │   │   ├── planos/
│   │   │   └── configuracoes/   # usuarios, seguranca (2FA), auditoria
│   │   ├── api/                 # webhooks, cron, rotas de IA, relatórios
│   │   ├── login/
│   │   └── registrar/
│   ├── actions/                 # Server Actions (mutations)
│   ├── components/ui/           # Componentes shadcn/ui
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config
│   │   ├── db.ts                # Prisma client
│   │   ├── gemini.ts            # cliente Gemini (lazy) — IA
│   │   ├── stripe.ts            # cliente Stripe (lazy)
│   │   ├── resend.ts            # cliente Resend (lazy)
│   │   └── session.ts           # requireSession() helper
│   └── proxy.ts                 # Auth guard Edge-safe
└── prisma/
    └── schema.prisma
```

## Segurança

- Todas as queries filtradas por `organizationId` — sem vazamento cross-tenant
- Server Actions usam `requireSession()` antes de qualquer operação
- Updates/deletes usam `updateMany`/`deleteMany` com `{ id, organizationId }` — sem IDOR
- 2FA (TOTP) opcional para administradores
- Log de auditoria das ações
- Headers de segurança configurados (`X-Frame-Options`, `X-Content-Type-Options`, etc.)

## Deploy

Auto-deploy no **Render** a cada push na branch `master`.

```bash
# Aplicar migrations em produção
npx prisma migrate deploy
```
