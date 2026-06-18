---
name: security-hardening
description: Auditoria AppSec do Lexo (2026-06-18) — o que foi corrigido na dev e o que ficou pendente (TOTP em texto puro, sweep de logging). Consultar antes de mexer em auth, financeiro, rotas de IA ou headers.
metadata:
  type: project
---

Auditoria AppSec zero-trust executada em 2026-06-18, aplicada na branch `dev` (commits `6a1005d` e `af226d4`). Nota subiu de B- para A-. Base já era sólida (multi-tenancy por organizationId, Zod em toda mutação, webhook Stripe assinado, segredos fora do git).

**Corrigido (já na dev):**
- VULN-1: cron `/api/cron/notify-deadlines` era fail-open (sem CRON_SECRET, rodava aberto) → agora fail-secure.
- VULN-2: SECRETARIA contornava o bloqueio de `/financeiro` (que só existia no proxy) chamando Server Actions e `/api/relatorio/financeiro` direto. Novo `requireFinanceiroAccess()`/`requireRole()` em `src/lib/session.ts` aplicado no ponto de uso.
- VULN-3: rate limiting via modelo `RateHit` + `src/lib/rate-limit.ts` (`checkRateLimit`). Login 10/15min por email; rotas de IA 20/min por org; extrair-documento 10/min.
- VULN-4: CSV/formula injection neutralizado no relatório financeiro (prefixo `'` em `= + - @`).
- VULN-5: HSTS + CSP em `next.config.ts`. CSP usa `'unsafe-inline'` em script-src (App Router injeta scripts inline) — hardening = migrar para nonce.
- VULN-8: valida magic bytes `%PDF-` no upload (não confia no Content-Type).

**Pendente (precisa de decisão do usuário):**
- VULN-6: `totpSecret`/`totpPendingSecret` em texto puro no banco. Cifrar com AES-256-GCM (chave em env do Render) + migração dos seeds existentes. Bypass de 2FA se o banco vazar.
- VULN-7: sweep de error swallowing — vários `catch {}` sem log escondem falhas. Trocar por `console.error("[contexto]", e)` mantendo msg genérica ao usuário.

**Gotcha de deploy:** a migration do RateHit PRECISA rodar em prod (`prisma migrate deploy`) senão o login quebra. Ver gotcha em [[project-roadmap]].

**How to apply:** branch `dev` não foi mergeada na `master` (que auto-deploya). Antes do merge: garantir migrate deploy no Render e fazer smoke-test da CSP (hydration) e do login (rate limit + RateHit existe).
