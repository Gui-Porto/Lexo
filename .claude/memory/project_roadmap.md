---
name: project-roadmap
description: "Roadmap completo do Lexo SaaS Jurídico — 4 fases com tarefas pendentes, do produto ao billing e IA"
metadata: 
  node_type: memory
  type: project
  originSessionId: 914c5db3-72e4-46e4-8c94-cff548fab774
---

## Status atual
Fases 0, 1, 2, 3 e 4 concluídas. Produção em https://lexo-45tf.onrender.com (Render + PostgreSQL).
Em 2026-06-18 o roadmap inteiro (Fases 2→4) foi implementado e o redesign visual finalizado.

**Why:** Sessão de CTO/Arquiteto definiu o roadmap completo; todas as fases foram executadas.
**How to apply:** Roadmap essencialmente completo — próximas conversas tendem a ser refinamento, bugs ou novas ideias fora do roadmap original. Perguntar ao usuário o que priorizar.

### Deploy no Render (gotcha importante)
Build de produção quebra se um cliente de SDK for instanciado no topo do módulo sem a env var. Caso resolvido: `src/lib/stripe.ts` instanciava `new Stripe(process.env.STRIPE_SECRET_KEY!)` no load → "Failed to collect page data for /api/webhooks/stripe". Corrigido com Proxy lazy + `export const dynamic = "force-dynamic"` na rota. Padrão a seguir: instanciar SDKs (Stripe/Anthropic/Resend) lazy ou dentro das funções, nunca no module scope.

---

## ✅ FASE 0 — Concluída (segurança + bugs críticos)
- [x] Middleware corrigido (proxy.ts → middleware.ts)
- [x] IDOR: validação de FK por tenant em todas as actions
- [x] JWT: validação antes de atribuir organizationId/role
- [x] requireSession() usa redirect() em vez de throw
- [x] redirect pós-delete e pós-update corrigidos
- [x] try/catch em todas as queries de banco
- [x] Race condition no registro (P2002 handler)
- [x] Zod validation em updateInvoiceStatus
- [x] Textarea nos campos de texto longo
- [x] Dialog de confirmação substituindo confirm() nativo
- [x] Migração para PostgreSQL (Render)
- [x] Headers de segurança (X-Frame-Options, etc.)
- [x] Edge Runtime fix: auth.config.ts separado para middleware

---

## ✅ FASE 1 — Fundação do Produto (concluída em 2026-06-17)
- [x] Dashboard com 4 KPIs (processos ativos, prazos 7 dias, faturas em aberto, clientes)
- [x] Filtros e busca nas 4 listagens (texto + filtro por status)
- [x] Paginação server-side (20 itens por página)
- [x] Atribuição de responsável por processo (campo responsavelId já existe no banco)
- [x] Edição de prazo e fatura (pages /agenda/[id] e /financeiro/[id])
- [x] Toasts de feedback pós-ação (flash query param + FlashToast component)
- [x] Confirmação de senha no registro
- [x] Gerenciamento de usuários (/configuracoes/usuarios — ADMIN convida, atribui roles)
- [x] RBAC: SECRETARIA sem acesso a financeiro; ADVOGADO vê só seus processos

## ✅ Redesign Visual — Identidade Lexo (concluído em 2026-06-17)
- [x] Logo SVG: LogoMark (ícone "strata" com barras ascendentes) + LogoWordmark com gradiente
- [x] Favicon SVG baseado no logomark (lexo/public/favicon.svg)
- [x] Dark mode "deep slate premium": fundo oklch(0.11) quasi-preto com matiz azul-índigo
- [x] Animações CSS reutilizáveis: fade-up, fade-in com stagger, shimmer, glow-pulse
- [x] Layout dashboard: sidebar glass morphism com borda luminosa ativa, header com avatar
- [x] Componente PageHeader reutilizável (ícone em badge + título + slot de ação)
- [x] Todas as páginas migradas para PageHeader
- [x] Dashboard redesenhado: KPI cards com ícone colorido e glow no hover
- [x] proxy.ts: renomeado e refatorado de middleware.ts (Edge-safe, exports named proxy)
- [x] seed-local.mjs para popular banco SQLite em dev
- [x] brand-concepts.html e brand-final.html: exploração de identidade visual

---

## ✅ FASE 2 — Maturidade Operacional (concluída em 2026-06-18)
- [x] Prazo automático como PERDIDO quando date < now e status PENDENTE (agenda/page.tsx)
- [x] Combobox de área jurídica (Cível, Trabalhista, Criminal, etc.) em case-form.tsx
- [x] Validação CPF/CNPJ no cadastro de clientes (src/lib/document.ts + refine() no Zod)
- [x] Histórico de atividades por processo (modelo ActivityLog + logActivity() helper)
- [x] Notificações de prazo por email via Resend (GET /api/cron/notify-deadlines, CRON_SECRET)
- [x] Relatório financeiro — CSV (/api/relatorio/financeiro) + PDF (impressão /financeiro/relatorio)

---

## ✅ FASE 3 — Escala e Monetização (concluída em 2026-06-18)
- [x] Sistema de planos (trial 30 dias → Essencial R$79 → Pro R$149) (2026-06-18)
- [x] Billing com Stripe (checkout, webhooks, portal do cliente) (2026-06-18)
- [x] Convite de usuários por email com link temporário (2026-06-18)
- [x] 2FA para administradores (2026-06-18)
- [x] Auditoria de todas as ações por usuário (2026-06-18)

---

## 🤖 FASE 4 — IA (ordenada por ROI)
- [x] Gerador de minutas/peças processuais (2026-06-18)
- [x] Extrator de documentos PDF — IA preenche forms automaticamente (2026-06-18)
- [x] Score de risco de prazo — badge colorido de prioridade (2026-06-18)
- [x] Pesquisa jurisprudencial em linguagem natural (2026-06-18)
- [x] Resumo automático do processo (2026-06-18)

### ⚠️ IA usa Gemini, NÃO Claude (migrado em 2026-06-18)
Para manter o projeto 100% gratuito, os 4 recursos de IA foram migrados da Anthropic (paga) para o **Google Gemini 2.5 Flash** (free tier do Google AI Studio). Helper central: `src/lib/gemini.ts` com `streamText()` (3 rotas de streaming) e `generateFromPdf()` (extração de PDF). SDK: `@google/genai`. Env var: `GEMINI_API_KEY` (pegar em aistudio.google.com/apikey). `@anthropic-ai/sdk` foi removido. NÃO sugerir voltar ao Claude sem o usuário pedir — a escolha foi explicitamente por custo zero.
