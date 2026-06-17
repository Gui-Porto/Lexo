# Lexo — Gestão para Escritórios de Advocacia

SaaS multi-tenant para escritórios de advocacia. Gerencie processos, clientes, prazos e financeiro em um só lugar.

## Stack

- **Next.js 16** App Router + Server Actions
- **Prisma** com PostgreSQL (produção) / SQLite (dev local)
- **Auth.js v5** — autenticação JWT com Credentials provider
- **Tailwind v4** + **shadcn/ui** (Base UI)
- **Sonner** para toasts
- Deploy: **Render** (web service + PostgreSQL)

## Funcionalidades

- Cadastro de processos, clientes, prazos e faturas
- Dashboard com KPIs: processos ativos, prazos próximos, faturas em aberto, total de clientes
- Filtros, busca e paginação server-side nas 4 listagens
- Atribuição de responsável por processo
- Edição inline de prazos e honorários
- Toasts de feedback em todas as ações
- **RBAC** com 3 perfis:
  - `ADMIN` — acesso total + gerenciamento de usuários
  - `ADVOGADO` — vê apenas seus próprios processos
  - `SECRETARIA` — sem acesso ao módulo financeiro
- Registro cria organização + primeiro usuário ADMIN atomicamente
- Multi-tenant: todos os dados são isolados por `organizationId`

## Rodando localmente

```bash
# 1. Instale as dependências
cd lexo
npm install

# 2. Configure o .env
cp .env.example .env
# Edite .env com:
# DATABASE_URL="file:./dev.db"
# AUTH_SECRET="qualquer-string-aleatoria"
# NEXTAUTH_URL="http://localhost:3000"

# 3. Gere o cliente Prisma e aplique as migrations
npx prisma migrate dev
npx prisma generate

# 4. (Opcional) Popule o banco com dados de exemplo
node seed-local.mjs

# 5. Inicie o servidor
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e crie sua organização em `/registrar`.

## Estrutura

```
lexo/
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Rotas protegidas com layout + sidebar
│   │   │   ├── dashboard/
│   │   │   ├── processos/
│   │   │   ├── clientes/
│   │   │   ├── agenda/
│   │   │   ├── financeiro/
│   │   │   └── configuracoes/usuarios/
│   │   ├── login/
│   │   └── registrar/
│   ├── actions/               # Server Actions (mutations)
│   ├── components/
│   │   └── ui/                # Componentes shadcn/ui
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma client
│   │   └── session.ts         # requireSession() helper
│   └── proxy.ts               # Auth guard Edge-safe (exported as middleware)
└── prisma/
    └── schema.prisma
```

## Segurança

- Todas as queries filtradas por `organizationId` — sem vazamento cross-tenant
- Server Actions usam `requireSession()` antes de qualquer operação
- Updates/deletes usam `updateMany`/`deleteMany` com `{ id, organizationId }` — sem IDOR
- Headers de segurança configurados (`X-Frame-Options`, `X-Content-Type-Options`, etc.)

## Deploy

O app está em produção em [https://lexo-45tf.onrender.com](https://lexo-45tf.onrender.com) (Render + PostgreSQL).

```bash
# Aplicar migrations em produção
npx prisma migrate deploy
```
