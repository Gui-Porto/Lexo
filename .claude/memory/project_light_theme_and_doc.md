---
name: project-light-theme-and-doc
description: "Migração do Lexo para tema CLARO premium + adoção das ideias do doc-mestre LEXO_CLAUDE_CODE.md (adaptadas ao stack grátis). EM ANDAMENTO na branch dev — checkpoint com próximos passos."
metadata:
  type: project
---

Em 2026-06-18 o usuário forneceu o doc-mestre `LEXO_CLAUDE_CODE.md` (visão ampliada do produto: command palette, contratos com editor, chat IA com RAG, Kanban/Timeline, portal do cliente). Decisões tomadas com o usuário:
- **Tema:** MIGRAR de dark "deep slate" para o **tema CLARO premium** do doc (#F9F9F8 fundo, #1A1A19 texto, #18181B primary/ink, #2563EB brand/azul, Inter + JetBrains Mono, radius 10px).
- **1ª feature nova:** **Command Palette ⌘K**.
- **Stack:** ADAPTAR o doc ao stack atual GRÁTIS, nunca migrar. Doc pede OpenAI/Supabase/Inngest/DocuSign/Vercel → usamos **Gemini**, **NextAuth+Prisma+Postgres**, **cron do Render**, pgvector (extensão grátis) p/ RAG, pular pagos. Ver [[project-zero-cost]]. Nomes: Organization≈Workspace, Case≈Process.

## Status: TEMA ESCURO RESTAURADO (2026-06-22)

O usuário confirmou que o tema deve ser escuro, conforme os wireframes originais do Claude Design. A tentativa de migração para tema claro foi descartada. O `:root` voltou para os tokens `oklch` deep slate premium.

**JÁ FEITO (convertido de oklch dark → tokens claros):**
- `src/app/globals.css`: `:root` agora é a paleta clara. Adicionados em `@theme inline`: `--color-brand`, `--color-brand-foreground`, `--color-success`, `--color-warning`, `--shadow-panel`, e fontes `--font-sans/--font-mono`. Utilitários `.glass/.hover-glow/.gradient-text/.glow-border/.shimmer-text/scrollbar` e keyframes `glow-pulse/border-glow` adaptados p/ azul/claro. Bloco `.dark` foi mantido (não aplicado) — permite toggle futuro.
- `src/app/layout.tsx`: fontes **Inter** (`--font-sans`) + **JetBrains_Mono** (`--font-mono`); removida a classe `dark` forçada no `<html>` (agora claro por padrão).
- `src/components/sidebar-nav.tsx`: item ativo = `bg-brand/10 text-brand` + borda azul; dot `bg-brand`.
- `src/components/page-header.tsx`: badge do ícone = `bg-brand/10 border-brand/20 text-brand`.
- `src/app/(dashboard)/layout.tsx`: sidebar clara (`bg-sidebar`, borda via `--sidebar-border`), avatar azul, luz ambiente sutil.
- `src/components/trial-banner.tsx`: 3 estados = tokens `destructive/warning/brand`.
- `src/components/ui/logo.tsx`: gradiente do wordmark trocado p/ ink→azul (legível no claro).
- `src/app/(dashboard)/dashboard/page.tsx`: KPIs com hex claros, cards = `bg-card border-border shadow-panel`, dots/badges convertidos.
- `src/lib/risk.ts`: `RISK_META` com tints claros (texto escuro + bg /0.12).

**FALTA converter (ainda têm `oklch()` dark inline — achar com: grep `oklch(` em src, exceto globals.css):**
- `src/components/ui/table.tsx` — container `oklch(0.155 0.02 264)` → `bg-card border border-border`; row hover `hover:bg-white/[0.03]` → `hover:bg-muted/50`.
- `src/components/ui/button.tsx` — variant `default` tem `hover:shadow-[0_0_20px_oklch(...)]` índigo → trocar p/ `hover:shadow-[0_0_18px_rgb(37_99_235_/_0.25)]`.
- `src/app/(dashboard)/agenda/page.tsx`
- `src/app/(dashboard)/configuracoes/seguranca/page.tsx` — cards `oklch(0.14 ...)` e bloco `<code>` com cores inline.
- `src/app/(dashboard)/configuracoes/auditoria/page.tsx`
- `src/app/(dashboard)/planos/page.tsx`
- `src/app/(dashboard)/financeiro/relatorio/page.tsx`
- `src/components/financeiro/export-report.tsx` e `print-button.tsx` (estilo de impressão — avaliar se precisa).

**Convenção de conversão:** trocar `style={{ background:"oklch(0.155...)", border:"1px solid oklch(1 0 0 /7%)" }}` por classes semânticas (`bg-card border border-border shadow-panel`), bordas `oklch(1 0 0 / x%)` → `border-border`, texto índigo → `text-brand`. Cores data-driven (KPI, risco, status) → hex claro com tint `/0.10–0.12`.

**Depois de terminar o tema:** `npm run build` (deve passar), smoke-test visual, commitar, e então implementar o **Command Palette ⌘K** (frontend puro, custo zero: dialog ⌘K com navegação + ações rápidas — ir p/ Processos/Clientes/Agenda/Financeiro, criar cliente/processo/prazo, gerar minuta, logout — no tema claro).

**Backlog do doc p/ depois (adaptado ao stack grátis, um por PR):** Kanban+Timeline em Processos · Chat IA com threads (Gemini, modelos AIThread/AIMessage) · Módulo de Contratos (TipTap) · Insights cron diário · Portal do cliente. Ver design atualizado em [[project-design-system]] (precisa ser atualizado p/ refletir o tema claro quando a migração terminar).