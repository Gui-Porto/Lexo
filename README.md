<div align="center">

<img src="lexo/public/favicon.svg" width="64" height="64" alt="Lexo logo" />

# Lexo

**O sistema operacional do escritório de advocacia.**

SaaS multi-tenant com IA jurídica integrada — processos, prazos, financeiro, equipe e clientes em um só lugar.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-purple)](https://authjs.dev)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-IA-8E75B2?logo=google-gemini&logoColor=white)](https://ai.google.dev)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

**[🔗 Ver em produção](https://lexo-six.vercel.app)**

</div>

---

## Sobre o projeto

Escritórios de advocacia de pequeno e médio porte costumam gerenciar processos em planilhas, prazos em agendas físicas e honorários no improviso. O **Lexo** substitui tudo isso por uma plataforma única, pensada especificamente para o fluxo de trabalho jurídico: você entra, vê seus processos ativos, sabe quais prazos vencem primeiro, acompanha o financeiro e tem o histórico completo de cada cliente.

É um produto **multi-tenant real** — cada escritório tem sua própria organização, com isolamento total de dados — construído e mantido sozinho do zero, do design ao deploy em produção, cobrindo autenticação, billing, IA, segurança e infraestrutura.

> Este projeto foi construído como peça de portfólio para demonstrar arquitetura full-stack de ponta a ponta em um SaaS real, não um CRUD de exemplo.

---

## Sumário

- [Destaques técnicos](#destaques-técnicos)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Rodando localmente](#rodando-localmente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Segurança](#segurança)

---

## Destaques técnicos

O que este projeto exercita, além de fazer o feature funcionar:

- **Multi-tenancy real** — todo modelo do banco carrega `organizationId`; toda mutação usa `updateMany`/`deleteMany` escopado (`{ id, organizationId }`), nunca `update`/`delete` por id isolado, fechando a porta para acesso cross-tenant (IDOR) por design.
- **Auth própria, sem vendor lock-in** — Auth.js v5 com Credentials provider (bcrypt), fluxo completo de **login/cadastro via Google** (OAuth + vínculo de conta existente), convite de equipe por e-mail com token e **2FA via TOTP**.
- **IA de verdade integrada ao domínio**, não um chatbot genérico: geração de minutas com streaming, extração estruturada de PDF, resumo de processo e pesquisa jurisprudencial — tudo via Google Gemini, com fallback e SDKs instanciados **lazy** (a ausência de uma API key não derruba o build, só desativa a feature em runtime).
- **Billing recorrente completo** — Stripe Checkout, Customer Portal e webhooks assinados que atualizam o plano da organização automaticamente, com RBAC por plano (`PlanGate`) bloqueando features Pro no server, não só na UI.
- **Sync bidirecional com Google Calendar** — prazos criados no Lexo vão pro Google Agenda e eventos criados lá voltam pro Lexo, com resolução de fuso horário e exclusão em ambas as pontas.
- **Cron jobs em produção** (Vercel Cron) para notificação automática de prazos por e-mail, protegidos por secret.
- **Rate limiting sem dependência paga** — janela deslizante persistida no próprio Postgres, sem Redis/Upstash.
- **Log de auditoria completo** — toda ação sensível (quem, o quê, quando, IP) fica registrada e visível para administradores.
- **Zero custo de infraestrutura** — Vercel + Neon (free tiers), Gemini free tier, Resend free tier: todo o produto roda em produção sem custo recorrente.

## Funcionalidades

### 📁 Processos
Cadastro e acompanhamento de processos judiciais com número, área do direito, status e responsável. Visualização em **lista** ou **Kanban** (arrastar entre status), com página de detalhe reunindo prazos, honorários, histórico de atividades e as ferramentas de IA do processo.

### 👥 Clientes
Cadastro de pessoa física ou jurídica com validação de CPF/CNPJ, e navegação direta para todos os processos e cobranças vinculados.

### 📅 Agenda
Prazos, audiências, reuniões e outros compromissos, com **score de risco** calculado pela proximidade do vencimento e **sincronização bidirecional com o Google Calendar**.

### 💰 Financeiro
Honorários com valor, vencimento e status, relatório com exportação em CSV/PDF e resumo por período.

### 🌐 Portal do Cliente
Link único e seguro por cliente, onde ele acompanha o andamento dos próprios processos sem precisar de login no sistema.

### ✅ Tarefas & ⏱️ Timesheet
Quadro de tarefas por prioridade e responsável, e apontamento de horas por processo (timer ou lançamento manual) — base para controle de produtividade e faturamento por hora.

### 🤖 IA jurídica (Google Gemini)
- **Gerador de minutas** com streaming, a partir dos dados reais do processo
- **Extrator de documentos PDF** — estrutura peças processuais automaticamente
- **Resumo automático** do processo com pontos de atenção
- **Pesquisa jurisprudencial** em linguagem natural
- **Chat IA** por processo, com histórico de conversas
- **Jurimetria** — estimativas de tempo e probabilidade com base em casos semelhantes (plano Pro)

### 🔐 Equipe & segurança
Convite por e-mail, três papéis (`ADMIN`, `ADVOGADO`, `SECRETARIA`) com permissões distintas, 2FA (TOTP) e log de auditoria.

### 💳 Planos & billing
Trial de 14 dias, planos Essencial e Pro via Stripe, com portal de gerenciamento de assinatura para o cliente.

### 📧 Notificações
E-mails automáticos de prazo próximo do vencimento (cron diário) e de convite de novos usuários, via Resend.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL via Prisma 7 + `adapter-pg` (Neon) |
| Autenticação | Auth.js v5 — JWT + Credentials + Google OAuth + TOTP |
| UI | shadcn/ui sobre Base UI + Tailwind CSS v4 |
| IA | Google Gemini (`@google/genai`, free tier) |
| Pagamentos | Stripe (Checkout, Customer Portal, Webhooks) |
| E-mail | Resend |
| Agenda | Google Calendar API (sync bidirecional) |
| Validação | Zod |
| Deploy | Vercel (hosting + cron), auto-deploy na branch `master` |

## Arquitetura

```
Requisição → proxy.ts (auth guard) → Server Component / Server Action
                                            │
                                requireSession() → escopo organizationId
                                            │
                              Zod parse → Prisma (updateMany/deleteMany scoped)
                                            │
                                revalidatePath() → redirect()
```

- **Server Actions** (`src/actions/`) concentram toda mutação: `requireSession()` → parse Zod → query escopada → `revalidatePath`/`redirect`. Forms usam `useActionState` (React 19).
- **`proxy.ts`** guarda todas as rotas não-públicas (Edge-safe), com uma segunda checagem no layout do dashboard.
- Clientes de SDK externos (Gemini, Stripe, Resend) são instanciados **lazy** — nenhum deles quebra o build se a chave não estiver configurada.

## Rodando localmente

Pré-requisitos: Node.js 20+ e um PostgreSQL (recomendado: branch de dev no [Neon](https://neon.tech)).

```bash
git clone https://github.com/Gui-Porto/Lexo.git
cd Lexo/lexo
npm install

# Configure o .env — mínimo:
# DATABASE_URL=...        (conexão pooled)
# DIRECT_URL=...          (conexão direta, usada pelas migrations)
# AUTH_SECRET=...         (openssl rand -base64 32)
# NEXTAUTH_URL=http://localhost:3000

npx prisma generate
npx prisma migrate deploy
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e crie sua própria conta em `/registrar` — o cadastro gera a organização e o primeiro usuário `ADMIN` atomicamente.

Chaves opcionais por feature (sem elas o build passa normalmente, só a feature específica fica desativada):

```
GEMINI_API_KEY=...           # IA — aistudio.google.com/apikey (gratuito)
RESEND_API_KEY=...           # E-mails transacionais
STRIPE_SECRET_KEY=...        # Billing
STRIPE_WEBHOOK_SECRET=...
CRON_SECRET=...              # Protege /api/cron/notify-deadlines
```

## Estrutura do projeto

```
lexo/
├── prisma/
│   └── schema.prisma          # Organization, User, Client, Case, Deadline, Invoice, Task,
│                               # TimeEntry, AIThread, AuditLog, UserInvite...
├── src/
│   ├── actions/                # Server Actions por domínio (auth, clientes, processos,
│   │                           #  agenda, financeiro, usuarios, convite, totp, billing...)
│   ├── app/
│   │   ├── (dashboard)/        # Rotas autenticadas com sidebar
│   │   │   ├── processos/      # lista + kanban + detalhe (minutas, resumo, chat)
│   │   │   ├── clientes/
│   │   │   ├── agenda/
│   │   │   ├── financeiro/     # lista + relatório
│   │   │   ├── tarefas/
│   │   │   ├── timesheet/
│   │   │   ├── jurimetria/
│   │   │   ├── pesquisa-juridica/
│   │   │   ├── portal-cliente/
│   │   │   ├── planos/
│   │   │   └── configuracoes/  # usuários, segurança (2FA), auditoria
│   │   ├── portal/[token]/     # portal do cliente (sem login)
│   │   ├── api/                # IA, webhooks Stripe, cron, Google Calendar OAuth
│   │   ├── login/ · registrar/ · convite/[token]/
│   ├── components/             # UI por domínio + shadcn/ui
│   ├── lib/
│   │   ├── auth.ts             # NextAuth + Google OAuth + TOTP
│   │   ├── db.ts                # Prisma client (adapter-pg)
│   │   ├── session.ts          # requireSession()
│   │   ├── gemini.ts · stripe.ts · resend.ts   # clientes lazy
│   │   ├── google-calendar.ts  # sync bidirecional
│   │   ├── risk.ts             # score de risco de prazo
│   │   └── audit.ts · activity.ts
│   └── proxy.ts                # auth guard
```

## Segurança

- Toda query filtrada por `organizationId` — sem vazamento cross-tenant
- `updateMany`/`deleteMany` escopados por `{ id, organizationId }` — sem IDOR
- `requireSession()` obrigatório em toda Server Action
- 2FA (TOTP) para administradores
- Log de auditoria de ações sensíveis
- Rate limiting persistido em Postgres
- Headers de segurança (`X-Frame-Options`, `X-Content-Type-Options` etc.)

---

<div align="center">

Feito por **[Guilherme Porto](https://github.com/Gui-Porto)**

</div>
