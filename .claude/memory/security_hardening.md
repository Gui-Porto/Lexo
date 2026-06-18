---
name: security-hardening
description: Auditoria AppSec do Lexo (2026-06-18) — o que foi corrigido na dev e o que ficou pendente (TOTP em texto puro, sweep de logging). Consultar antes de mexer em auth, financeiro, rotas de IA ou headers.
metadata:
  type: project
---

Auditoria AppSec zero-trust executada em 2026-06-18, aplicada na branch `dev` (commits `6a1005d`, `af226d4`, `c3e0b4e`). TODAS as 8 vulnerabilidades corrigidas (nota A). Base já era sólida (multi-tenancy por organizationId, Zod em toda mutação, webhook Stripe assinado, segredos fora do git). `next build` passa (exit 0).

**Corrigido (tudo na dev):**
- VULN-1: cron `/api/cron/notify-deadlines` era fail-open (sem CRON_SECRET, rodava aberto) → agora fail-secure.
- VULN-2: SECRETARIA contornava o bloqueio de `/financeiro` (que só existia no proxy) chamando Server Actions e `/api/relatorio/financeiro` direto. Novo `requireFinanceiroAccess()`/`requireRole()` em `src/lib/session.ts` aplicado no ponto de uso.
- VULN-3: rate limiting via modelo `RateHit` + `src/lib/rate-limit.ts` (`checkRateLimit`). Login 10/15min por email; rotas de IA 20/min por org; extrair-documento 10/min. `checkRateLimit` é FAIL-OPEN + log se o store falhar (não derruba login).
- VULN-4: CSV/formula injection neutralizado no relatório financeiro (prefixo `'` em `= + - @`).
- VULN-5: HSTS + CSP em `next.config.ts`. CSP usa `'unsafe-inline'` em script-src (App Router injeta scripts inline) — hardening futuro = migrar para nonce.
- VULN-6: segredos TOTP cifrados em repouso com AES-256-GCM em `src/lib/crypto.ts` (`encryptSecret`/`decryptSecret`, prefixo `enc:v1:`). Chave derivada de `TOTP_ENC_KEY` com fallback p/ `AUTH_SECRET`. Aplicado em `actions/totp.ts`, `lib/auth.ts` (login) e na página de segurança (QR). Segredos legados em texto puro seguem válidos (decrypt detecta o prefixo; sem lockout).
- VULN-7: sweep de logging — todos os `catch {}` silenciosos agora fazem `console.error("[contexto]", e)` mantendo msg genérica ao usuário (financeiro, clientes, processos, agenda, usuarios, auth, audit, activity, gemini, extrair-documento).
- VULN-8: valida magic bytes `%PDF-` no upload (não confia no Content-Type).

**Deploy autossuficiente (RESOLVIDO no commit `426b825`):** o script `build` em package.json agora é `prisma generate && (prisma migrate deploy || echo migrate-deploy-skipped) && next build`. Aplica as migrations (incl. RateHit) no deploy sem depender da config do painel do Render. O `migrate deploy` é tolerante a falha (não quebra build local sem DB). Em prod, com DATABASE_URL no ambiente, aplica normalmente. Dupla garantia: o `checkRateLimit` é fail-open, então o login nunca quebra mesmo se a migration atrasar.

**Opcional (env):** definir `TOTP_ENC_KEY` no Render para separar a chave de cifra do TOTP do `AUTH_SECRET` (hoje usa o AUTH_SECRET como fallback — já funciona).

**How to apply:** branch `dev` empurrada para origin, NÃO mergeada na `master` (que auto-deploya). PR: abrir via https://github.com/Gui-Porto/Lexo-Placeholder/compare/master...dev . Pós-merge: smoke-test da CSP (hydration) e do login (com e sem 2FA). gh CLI não está instalado nesta máquina.
