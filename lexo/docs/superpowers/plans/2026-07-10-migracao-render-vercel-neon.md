# Migração Render → Vercel + Neon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Most tasks in this plan involve manual actions in external dashboards (Render, Neon, Vercel, Stripe, Google Cloud Console) that only the human operator can perform — the agent's job is to give exact instructions, run the automatable commands, and verify each step before moving on.

**Goal:** Move the Lexo app off Render entirely — database to Neon (Postgres, no free-tier expiry), hosting to Vercel (free Hobby tier, includes cron) — with zero data loss and no downtime for existing users, then delete everything on Render.

**Architecture:** Two independent cutover stages. Stage 1 swaps only the database (Render Postgres → Neon) while the app keeps running on Render, so a DB problem is isolated from a hosting problem. Stage 2 swaps only the hosting (Render → Vercel) once the DB is confirmed stable. Render is decommissioned only after both stages are validated in production.

**Tech Stack:** PostgreSQL client tools (pg_dump/psql), Vercel (hosting + cron), Neon (Postgres), existing Prisma 7 / Next.js 16 app.

## Global Constraints

- Zero recurring cost — every service used (Vercel Hobby, Neon free tier) must stay on its free plan. [[project_zero_cost]]
- No custom domain exists yet — app is reachable at `lexo-45tf.onrender.com` today and will be reachable at `*.vercel.app` after migration. No DNS work.
- Render Postgres host confirmed: `dpg-d8pdha8k1i2s73aflgpg-a.oregon-postgres.render.com`, user `lexo_user`, db `lexo_abij`.
- App root directory inside the git repo is `lexo/` (repo root is `Lexo-Placeholder/`). Any Vercel project settings referencing "root directory" must be set to `lexo`.
- Never commit `.env` / `.env.local` or paste secrets into files under version control.
- `lexo/prisma.config.ts` and `lexo/vercel.json` already have uncommitted local changes prepared for this migration — reuse them, don't recreate.

---

### Task 1: Install local Postgres client tools

**Why:** `pg_dump`/`psql` are the only correct tool for a full schema+data copy of a production database with money-related tables (invoices, billing). Hand-rolling this in JS risks silent data loss on edge cases (sequences, enums, JSON columns) — not worth the risk for client billing data. Neither is installed locally yet, and Docker isn't available either.

**Files:** None.

- [ ] **Step 1: Install PostgreSQL (includes psql + pg_dump) via winget**

```powershell
winget install -e --id PostgreSQL.PostgreSQL.17
```

Accept the installer defaults. It's fine that this also installs a local Postgres server — it won't be used, only the bundled client tools (`psql`, `pg_dump`) matter here.

- [ ] **Step 2: Add the client tools to PATH for this session (if not picked up automatically)**

```powershell
$env:PATH += ";C:\Program Files\PostgreSQL\17\bin"
```

- [ ] **Step 3: Verify the tools are available**

Run: `psql --version` and `pg_dump --version`
Expected: both print a version string (e.g. `psql (PostgreSQL) 17.x`), no "not recognized" error.

---

### Task 2: Create the Neon project and capture connection strings

**Why:** Neon is the migration target for the database. Free tier, no expiry — this is what removes the Render Postgres 90-day-reset pain permanently.

**Files:** None (manual dashboard step).

- [ ] **Step 1: Create account / project at Neon**

Go to https://console.neon.tech, sign up (GitHub login is fastest), create a new project named `lexo`. Pick a region close to the Render Postgres region (Oregon → US West is a reasonable match) to minimize latency for the dump/restore in Task 3.

- [ ] **Step 2: Copy the two connection strings**

On the Neon project's Dashboard → Connection Details:
- Copy the **pooled** connection string (has `-pooler` in the hostname) — this becomes `DATABASE_URL`.
- Toggle "Pooled connection" off (or use the direct variant shown) to get the **direct** connection string (no `-pooler`) — this becomes `DIRECT_URL`.

Paste both into a scratch note for now (not into any tracked file). Note the default database name shown (usually `neondb`) — Task 3 restores into that database.

- [ ] **Step 3: Verify both strings work**

Run (replace with your actual direct connection string):
```powershell
psql "postgresql://<user>:<password>@<direct-host>/neondb?sslmode=require" -c "select 1;"
```
Expected: prints a `1` row, no connection error.

---

### Task 3: Dump Render Postgres and restore into Neon

**Why:** This is the actual data migration — everything downstream depends on Neon having an exact copy of production data.

**Files:** None (produces a local, untracked `backup.sql` — do not commit it).

- [ ] **Step 1: Get the full Render Postgres connection string**

Render dashboard → Postgres service → Info tab → copy the **External Database URL** (starts with `postgresql://lexo_user:...@dpg-d8pdha8k1i2s73aflgpg-a.oregon-postgres.render.com/lexo_abij`).

- [ ] **Step 2: Dump it to a local file**

Run from the `lexo/` directory (the file is gitignored territory — verify it doesn't get staged later):
```powershell
pg_dump --no-owner --no-privileges -f backup.sql "postgresql://lexo_user:<RENDER_PASSWORD>@dpg-d8pdha8k1i2s73aflgpg-a.oregon-postgres.render.com/lexo_abij"
```
Expected: command exits with no error, `backup.sql` is created and non-empty.

Run: `(Get-Item backup.sql).Length`
Expected: a positive byte count (not 0).

- [ ] **Step 3: Restore into Neon (direct connection string, not pooled)**

```powershell
psql "postgresql://<user>:<password>@<direct-host>/neondb?sslmode=require" -f backup.sql
```
Expected: a long stream of `CREATE TABLE`/`COPY`/`ALTER TABLE` output, no `ERROR:` lines (a few harmless `NOTICE:` lines about existing extensions are fine).

- [ ] **Step 4: Verify row counts match**

Run against Render:
```powershell
psql "postgresql://lexo_user:<RENDER_PASSWORD>@dpg-d8pdha8k1i2s73aflgpg-a.oregon-postgres.render.com/lexo_abij" -c "select 'Organization', count(*) from \"Organization\" union all select 'User', count(*) from \"User\" union all select 'Case', count(*) from \"Case\" union all select 'Deadline', count(*) from \"Deadline\" union all select 'Invoice', count(*) from \"Invoice\";"
```
Then the same query against the Neon direct connection string. Expected: identical counts on both sides for every table.

- [ ] **Step 5: Delete the local dump file**

It contains full production data including password hashes — don't leave it lying around.
```powershell
Remove-Item backup.sql
```

---

### Task 4: Point Render's running app at Neon and validate

**Why:** This is Stage 1's actual cutover — the app is still on Render, only its database target changes. If anything is wrong, it's isolated to the DB swap.

**Files:** `lexo/prisma.config.ts` (already modified locally, uncommitted — no further edits needed).

- [ ] **Step 1: Update env vars on the Render Web Service**

Render dashboard → Web Service (not the Postgres one) → Environment tab:
- Update `DATABASE_URL` to the Neon **pooled** connection string.
- Add a new var `DIRECT_URL` with the Neon **direct** connection string.

Save — Render will redeploy automatically.

- [ ] **Step 2: Watch the deploy log**

Render dashboard → Web Service → Logs. Expected: build succeeds, `prisma generate` and `prisma migrate deploy` (part of the `build` script) both succeed with no error — this is also the first real test that `prisma.config.ts`'s `DIRECT_URL` change works, since `migrate deploy` needs the advisory locks that only the direct connection supports.

- [ ] **Step 3: Manually verify the live app against Neon**

Open `https://lexo-45tf.onrender.com`, log in, open an existing processo/cliente/prazo (confirms the restored data is visible), create+delete a throwaway test record (confirms writes work).

- [ ] **Step 4: Commit the prisma.config.ts change**

```bash
cd lexo
git add prisma.config.ts
git commit -m "fix(prisma): usar DIRECT_URL do Neon nas migrations (pooler não suporta advisory locks)"
```

---

### Task 5: Decommission the Render Postgres instance

**Why:** Stage 1 is done and validated — the old database is now dead weight (and a stale copy of real client data sitting around is a liability, not a backup worth keeping).

**Files:** None.

- [ ] **Step 1: Delete the Postgres service on Render**

Render dashboard → Postgres service → Settings → Delete Database. Confirm.

- [ ] **Step 2: Confirm the app still works**

Reload `https://lexo-45tf.onrender.com` and log in again. Expected: works exactly as in Task 4 Step 3 (proves the app was actually reading from Neon, not accidentally still hitting the now-deleted Render DB).

---

### Task 6: Create the Vercel project

**Why:** This is Stage 2's target host. Using Vercel's Git integration (not a one-off file upload) is what preserves the "push to `master`, it deploys" workflow the project relies on today.

**Files:** None (manual dashboard step).

- [ ] **Step 1: Import the GitHub repo into Vercel**

Go to https://vercel.com/new, select the `Lexo-Placeholder` GitHub repo (authorize Vercel's GitHub App if this is the first import).

- [ ] **Step 2: Set the root directory**

In the import screen's "Configure Project" step, expand "Root Directory" and set it to `lexo`. This is required — the repo root has no `package.json`, the Next.js app lives in `lexo/`.

- [ ] **Step 3: Leave build settings on framework defaults**

Vercel auto-detects Next.js and fills in `npm run build` / `.next`. Don't override — the existing `npm run build` script (which runs `prisma generate`, `prisma migrate deploy`, `prisma db seed`, then `next build`) is exactly what should run here too.

- [ ] **Step 4: Add every environment variable before the first deploy**

Import screen → Environment Variables. Add each of these (values come from the Render Web Service's Environment tab, except where noted):

| Key | Value source |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (same one now used on Render) |
| `DIRECT_URL` | Neon direct connection string |
| `AUTH_SECRET` | copy from Render |
| `NEXTAUTH_URL` | `https://<your-vercel-project>.vercel.app` (the domain Vercel assigns — check the import screen or fill in after first deploy and redeploy) |
| `AUTH_URL` | same value as `NEXTAUTH_URL` |
| `TOTP_ENC_KEY` | copy from Render |
| `CRON_SECRET` | copy from Render |
| `RESEND_API_KEY` | copy from Render |
| `RESEND_FROM` | copy from Render |
| `STRIPE_SECRET_KEY` | copy from Render |
| `STRIPE_WEBHOOK_SECRET` | placeholder for now — real value comes from Task 8 |
| `STRIPE_PRICE_ESSENCIAL` | copy from Render |
| `STRIPE_PRICE_PRO` | copy from Render |
| `GEMINI_API_KEY` | copy from Render |
| `GOOGLE_CLIENT_ID` | copy from Render |
| `GOOGLE_CLIENT_SECRET` | copy from Render |

- [ ] **Step 5: Deploy**

Click Deploy. Wait for the build to finish.

- [ ] **Step 6: Check the build log for errors**

Use the Vercel dashboard, or:
```
mcp__vercel__get_deployment_build_logs (idOrUrl: <deployment URL from Step 5>, errorsOnly: true)
```
Expected: no errors. If `prisma migrate deploy` fails, double check `DIRECT_URL` is set correctly (Task 4 already proved this connection string works, so a failure here is almost certainly a copy-paste mismatch).

---

### Task 7: Wire up the cron and validate the Vercel deployment

**Why:** The daily deadline-notification cron only fires if `vercel.json` is committed (Vercel reads it from the repo, not from the dashboard) and `CRON_SECRET` matches.

**Files:** `lexo/vercel.json` (already created locally, uncommitted).

- [ ] **Step 1: Commit vercel.json**

```bash
cd lexo
git add vercel.json
git commit -m "chore(vercel): configura cron diário de notificação de prazos"
git push
```
This push triggers a new Vercel deployment (now with the cron config picked up).

- [ ] **Step 2: Confirm the cron is registered**

Vercel dashboard → Project → Cron Jobs tab. Expected: one entry, `/api/cron/notify-deadlines`, schedule `0 12 * * *`.

- [ ] **Step 3: Trigger it manually to verify auth + logic**

```powershell
curl -H "Authorization: Bearer <CRON_SECRET value>" https://<your-vercel-project>.vercel.app/api/cron/notify-deadlines
```
Expected: `{"sent":...}` JSON response, HTTP 200 — not 401.

- [ ] **Step 4: Full manual walkthrough on the Vercel URL**

Open `https://<your-vercel-project>.vercel.app`: log in, open a processo/cliente/prazo, check 2FA setup screen loads, check the dashboard KPIs render (proves Neon reads work from Vercel's serverless functions, not just from Render).

---

### Task 8: Update external integrations to the new domain

**Why:** Stripe and Google both have the *old* Render domain hardcoded in their own dashboards (webhook endpoint, OAuth redirect URI). Skip this and billing/calendar sync silently breaks after cutover.

**Files:** None (external dashboards).

- [ ] **Step 1: Add the new Stripe webhook endpoint**

Stripe dashboard → Developers → Webhooks → Add endpoint. URL: `https://<your-vercel-project>.vercel.app/api/webhooks/stripe`. Select the same events the existing Render endpoint listens to (check the existing endpoint's event list before creating the new one).

- [ ] **Step 2: Copy the new signing secret into Vercel**

The new endpoint gets its own signing secret (starts `whsec_`). Vercel dashboard → Project → Settings → Environment Variables → edit `STRIPE_WEBHOOK_SECRET` → paste it → Save → redeploy (Vercel → Deployments → latest → Redeploy).

- [ ] **Step 3: Update the Google OAuth redirect URI**

Google Cloud Console → APIs & Services → Credentials → the OAuth 2.0 Client ID used by `GOOGLE_CLIENT_ID` → Authorized redirect URIs → add `https://<your-vercel-project>.vercel.app/api/google-calendar/callback`. Leave the old Render one in place for now (harmless, removed in Task 10).

- [ ] **Step 4: Verify Stripe webhook delivery**

Trigger a test event: Stripe dashboard → the new webhook endpoint → "Send test webhook" (pick `checkout.session.completed` or similar). Expected: `200` response logged on the Stripe side.

- [ ] **Step 5: Verify Google Calendar connect flow**

In the Vercel-hosted app, go to the integration that starts the Google Calendar OAuth flow, connect a test account, confirm it redirects back successfully instead of showing a `redirect_uri_mismatch` error.

---

### Task 9: Cut over and decommission Render

**Why:** This is the actual "make Vercel the real production" moment, and the cleanup the user asked for ("depois exclui tudo no Render").

**Files:** `lexo/README.md`.

- [ ] **Step 1: Share the new URL going forward**

Since there's no custom domain, "cutover" just means: stop pointing anyone at the `onrender.com` URL and use the `vercel.app` one instead.

- [ ] **Step 2: Update README's deploy section**

Read the current section first (`lexo/README.md` around line 17 and lines 145-152, "Deploy: **Render**..." / "Auto-deploy no **Render**..."), then replace both mentions with Vercel + Neon equivalents, and fix line 10 (`Prisma 7 com PostgreSQL (produção) / SQLite (dev local)` → SQLite dev fallback is stale given `schema.prisma`'s `provider = "postgresql"` is now the only supported provider — say Postgres/Neon for both).

- [ ] **Step 3: Commit the README update**

```bash
cd lexo
git add README.md
git commit -m "docs: atualiza README para stack Vercel + Neon"
git push
```

- [ ] **Step 4: Delete the Render Web Service**

Render dashboard → Web Service → Settings → Delete Web Service. Confirm.

(The Render Postgres instance was already deleted in Task 5 — after this step, nothing remains on Render.)

- [ ] **Step 5: Remove the now-unused Google OAuth redirect URI**

Google Cloud Console → same OAuth Client → remove the old `lexo-45tf.onrender.com` redirect URI (kept as fallback since Task 8, no longer needed).

- [ ] **Step 6: Final smoke test**

Open the Vercel URL fresh (private/incognito window), log in, confirm the app works end to end with nothing left on Render.
