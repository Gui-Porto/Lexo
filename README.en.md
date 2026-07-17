<div align="center">

<img src="lexo/public/favicon.svg" width="64" height="64" alt="Lexo logo" />

# Lexo

**The operating system for law firms.**

Multi-tenant SaaS with integrated legal AI — cases, deadlines, finance, team and clients in one place.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-purple)](https://authjs.dev)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-IA-8E75B2?logo=google-gemini&logoColor=white)](https://ai.google.dev)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

**[🔗 Live demo](https://lexo-six.vercel.app)**

🌐 **Language:** [Português](./README.md) | English

<br/>

<img src="docs/landing-page.png" alt="Lexo - landing page" width="800" />

</div>

---

## About the project

Small and mid-sized law firms often manage cases in spreadsheets, deadlines in paper agendas, and fees informally. **Lexo** replaces all of that with a single platform designed specifically for legal workflows: you log in, see your active cases, know which deadlines are coming up first, track finances, and have the full history of every client.

It is a real **multi-tenant** product — each firm has its own organization, with full data isolation — built and maintained solo from scratch, from design to production deployment, covering authentication, billing, AI, security and infrastructure.

> This project was built as a portfolio piece to demonstrate end-to-end full-stack architecture in a real SaaS product, not a sample CRUD app.

---

## Table of contents

[Technical highlights](#technical-highlights) · [Features](#features) · [Stack](#stack) · [Architecture](#architecture) · [Running locally](#running-locally) · [Project structure](#project-structure) · [Security](#security) · [Roadmap](#roadmap--future-improvements) · [License](#license)

---


## Technical highlights

What this project exercises, beyond making the feature work:

- **Real multi-tenancy** — every database model carries `organizationId`; every mutation uses scoped `updateMany`/`deleteMany` (`{ id, organizationId }`), never an isolated `update`/`delete` by id, closing the door to cross-tenant access (IDOR) by design.
- **Own auth, no vendor lock-in** — Auth.js v5 with a Credentials provider (bcrypt), a full Google OAuth login/sign-up flow (including linking to an existing account), email-based team invites with tokens, and **TOTP 2FA**.
- **Real AI integrated into the domain**, not a generic chatbot: streaming draft generation, structured PDF extraction, case summaries and case-law research — all via Google Gemini, with fallback and **lazily instantiated SDKs** (a missing API key never breaks the build, it just disables that feature at runtime).
- **Full recurring billing** — Stripe Checkout, Customer Portal and signed webhooks that automatically update the organization's plan, with plan-based RBAC (`PlanGate`) blocking Pro features on the server, not just in the UI.
- **Bidirectional Google Calendar sync** — deadlines created in Lexo go to Google Calendar and events created there come back to Lexo, with timezone resolution and deletion on both ends.
- **Production cron jobs** (Vercel Cron) for automatic deadline email notifications, protected by a secret.
- **Rate limiting with no paid dependency** — sliding window persisted in Postgres itself, no Redis/Upstash required.
- **Full audit log** — every sensitive action (who, what, when, IP) is recorded and visible to administrators.
- **Zero infrastructure cost** — Vercel + Neon (free tiers), Gemini free tier, Resend free tier: the whole product runs in production at no recurring cost.

## Features

### 📁 Cases
Register and track lawsuits with number, legal area, status and owner. List or Kanban view (drag between statuses), with a detail page bringing together deadlines, fees, activity history and the case's AI tools.

### 👥 Clients
Individual or corporate client registration with tax ID validation, and direct navigation to all linked cases and invoices.

### 📅 Calendar
Deadlines, hearings, meetings and other commitments, with a risk score based on how close the due date is and bidirectional sync with Google Calendar.

### 💰 Finance
Fees with amount, due date and status, reports exportable as CSV/PDF, and a summary by period.

### 🌐 Client Portal
A unique, secure link per client where they can track their own case progress without logging into the system.

### ✅ Tasks & ⏱️ Timesheet
A task board by priority and owner, and time tracking per case (timer or manual entry) — the base for productivity control and hourly billing.

### 🤖 Legal AI (Google Gemini)
- **Draft generator** with streaming, based on the case's real data
- **PDF document extractor** — automatically structures legal filings
- **Automatic case summary** with key points of attention
- **Case-law research** in natural language
- **AI chat** per case, with conversation history
- **Legal analytics ("Jurimetria")** — time and probability estimates based on similar cases (Pro plan)

### 🔐 Team & security
Email invites, three roles (`ADMIN`, `LAWYER`, `SECRETARY`) with distinct permissions, TOTP 2FA and audit log.

### 💳 Plans & billing
14-day trial, Essential and Pro plans via Stripe, with a subscription management portal for the client.

### 📧 Notifications
Automatic emails for upcoming deadlines (daily cron) and new user invites, via Resend.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma 7 + `adapter-pg` (Neon) |
| Authentication | Auth.js v5 — JWT + Credentials + Google OAuth + TOTP |
| UI | shadcn/ui on top of Base UI + Tailwind CSS v4 |
| AI | Google Gemini (`@google/genai`, free tier) |
| Payments | Stripe (Checkout, Customer Portal, Webhooks) |
| Email | Resend |
| Calendar | Google Calendar API (bidirectional sync) |
| Validation | Zod |
| Deploy | Vercel (hosting + cron), auto-deploy on the master branch |

---

## Architecture

```
Request → proxy.ts (auth guard) → Server Component / Server Action
│
requireSession() → scoped to organizationId
│
Zod parse → Prisma (scoped updateMany/deleteMany)
│
revalidatePath() → redirect()
```

Server Actions (`src/actions/`) hold all mutations: `requireSession()` → Zod parse → scoped query → `revalidatePath`/`redirect`. Forms use `useActionState` (React 19).
`proxy.ts` guards every non-public route (Edge-safe), with a second check in the dashboard layout.
External SDK clients (Gemini, Stripe, Resend) are instantiated **lazily** — none of them break the build if the key isn't configured.

---

## Running locally

Requirements: Node.js 20+ and a PostgreSQL instance (a Neon dev branch is recommended).

```bash
git clone https://github.com/Gui-Porto/Lexo.git
cd Lexo/lexo
npm install

# Configure your .env — minimum:
# DATABASE_URL=... (pooled connection)
# DIRECT_URL=... (direct connection, used by migrations)
# AUTH_SECRET=... (openssl rand -base64 32)
# NEXTAUTH_URL=http://localhost:3000

npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000 and create your own account at `/registrar` — sign-up atomically creates the organization and the first `ADMIN` user.

Optional keys per feature (without them the build passes normally, only that specific feature is disabled):

```
GEMINI_API_KEY=...   # AI — aistudio.google.com/apikey (free)
RESEND_API_KEY=...   # Transactional emails
STRIPE_SECRET_KEY=...        # Billing
STRIPE_WEBHOOK_SECRET=...
CRON_SECRET=...      # Protects /api/cron/notify-deadlines
```

---

## Project structure

```
lexo/
├── prisma/
│   └── schema.prisma    # Organization, User, Client, Case, Deadline, Invoice, Task,
│                         # TimeEntry, AIThread, AuditLog, UserInvite...
├── src/
│   ├── actions/          # Server Actions by domain (auth, clients, cases,
│   │                     # calendar, finance, users, invites, totp, billing...)
│   ├── app/
│   │   ├── (dashboard)/  # Authenticated routes with sidebar
│   │   │   ├── processos/    # list + kanban + detail (drafts, summary, chat)
│   │   │   ├── clientes/
│   │   │   ├── agenda/
│   │   │   ├── financeiro/   # list + report
│   │   │   ├── tarefas/
│   │   │   ├── timesheet/
│   │   │   ├── jurimetria/
│   │   │   ├── pesquisa-juridica/
│   │   │   ├── portal-cliente/
│   │   │   ├── planos/
│   │   │   └── configuracoes/  # users, security (2FA), audit
│   │   ├── portal/[token]/     # client portal (no login)
│   │   ├── api/                # AI, Stripe webhooks, cron, Google Calendar OAuth
│   │   ├── login/ · registrar/ · convite/[token]/
│   │   ├── components/     # domain UI + shadcn/ui
│   │   ├── lib/
│   │   │   ├── auth.ts     # NextAuth + Google OAuth + TOTP
│   │   │   ├── db.ts       # Prisma client (adapter-pg)
│   │   │   ├── session.ts  # requireSession()
│   │   │   ├── gemini.ts · stripe.ts · resend.ts   # lazy clients
│   │   │   ├── google-calendar.ts   # bidirectional sync
│   │   │   ├── risk.ts     # deadline risk score
│   │   │   └── audit.ts · activity.ts
│   │   └── proxy.ts    # auth guard
```

---

## Security

- Every query filtered by `organizationId` — no cross-tenant leakage
- `updateMany`/`deleteMany` scoped by `{ id, organizationId }` — no IDOR
- `requireSession()` mandatory on every Server Action
- TOTP 2FA for administrators
- Full audit log of sensitive actions
- Rate limiting persisted in Postgres
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.)

---

## Roadmap / Future improvements

- [ ] Full multi-language support in the UI (i18n, currently partial)
- [ ] Mobile app (React Native) for deadline lookup and client portal
- [ ] Public webhooks for third-party integrations (e.g. law firm ERPs)
- [ ] Automated end-to-end tests (Playwright) covering critical billing and auth flows
- [ ] Production observability (tracing and metrics via OpenTelemetry)
- [ ] Bulk data export (LGPD/GDPR data portability)

## License

This is a **proprietary** project, built and maintained by Guilherme Porto. The code is public solely for technical portfolio demonstration purposes — see the [LICENSE](./LICENSE) file for full terms. Reuse, redistribution or running this software in production is not permitted without prior authorization.

---

<div align="center">

Built by **[Guilherme Porto](https://github.com/Gui-Porto)**

</div>
