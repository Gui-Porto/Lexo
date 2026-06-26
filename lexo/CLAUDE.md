# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

All commands run from the `lexo/` directory.

```bash
npm run dev        # start dev server on :3000
npm run build      # production build
npm run lint       # ESLint

# Prisma (requires DATABASE_URL in .env)
npx prisma generate          # regenerate client after schema changes
npx prisma migrate dev --name <name>   # create and apply a new migration
npx prisma migrate deploy    # apply pending migrations (CI / production)
npx prisma studio            # visual DB browser
```

`.env` minimum required for local dev:
```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<any-random-string>"
NEXTAUTH_URL="http://localhost:3000"
```

There is no test suite.

## Architecture

**Lexo** is a multi-tenant SaaS for law offices (escritórios de advocacia), built with Next.js 16 App Router.

### Multi-tenancy

Every database model has an `organizationId` field. All queries in Server Actions and page components **must** filter by `session.user.organizationId`. The pattern is `updateMany`/`deleteMany` with `{ id, organizationId }` — never a bare `update`/`delete` by id alone, as that would allow cross-tenant access.

### Auth flow

- `src/lib/auth.ts` — NextAuth v5 (Auth.js) configured with JWT strategy and a Credentials provider (email + bcrypt password).
- `src/proxy.ts` — exports a named `proxy` function (not a default `middleware`) that guards all non-public routes. Public paths: `/login`, `/registrar`.
- `src/app/(dashboard)/layout.tsx` — second auth check; redirects to `/login` if session is missing.
- `src/lib/session.ts` — `requireSession()` helper used at the top of every Server Action to get the session or throw.

### Server Actions

All mutations live in `src/actions/` as `"use server"` files. The pattern:
1. Call `requireSession()` to get session and implicitly verify auth.
2. Parse `formData` with a Zod schema.
3. Run the DB query scoped to `organizationId`.
4. Call `revalidatePath(...)` then `redirect(...)`.

Forms call Server Actions via `useActionState` (React 19) — state shape is `{ error: string } | undefined`.

### Database

SQLite via Prisma with the `@prisma/adapter-better-sqlite3` driver (configured in `src/lib/db.ts`). The Prisma client is generated to `src/generated/prisma/` — run `npx prisma generate` after any schema change.

Dates are stored as UTC midnight. Always display them with `formatDate()` from `src/lib/utils/format.ts`, which passes `{ timeZone: "UTC" }` to avoid off-by-one-day rendering.

### UI

- Components come from shadcn/ui built on **Base UI** primitives (not Radix). The `Button` component uses Base UI's `render` prop for polymorphism: `<Button render={<Link href="..." />}>` instead of `asChild`.
- Tailwind v4, dark mode is hardcoded (`className="dark"` on `<html>`).
- Toasts via `sonner` (`<Toaster />` in root layout).
- Currency: `formatCurrency()` from `src/lib/format.ts` formats as BRL.

## graphify

A knowledge graph of this codebase lives at `graphify-out/graph.json` (1374 nodes, 2065 edges, 44 communities).

**Before answering any question about the codebase** — architecture, data flow, what calls what, where something is defined — run:
```
graphify query "<question>"
```
using the Python interpreter at `graphify-out/.graphify_python`. This replaces reading raw files and saves context window.

To rebuild after significant code changes: `/graphify .` from the project root.

### Route structure

```
/                    → redirects to /processos or /login
/login               → public
/registrar           → public; creates Organization + first ADMIN user atomically
/(dashboard)/        → auth-guarded layout with sidebar nav
  /processos         → Case list and detail ([id])
  /clientes          → Client list and detail ([id])
  /agenda            → Deadline list (PRAZO / AUDIENCIA / REUNIAO / OUTRO)
  /financeiro        → Invoice list
```
