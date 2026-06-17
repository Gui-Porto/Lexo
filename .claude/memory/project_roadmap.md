---
name: project-roadmap
description: "Roadmap completo do Lexo SaaS Jurídico — 4 fases com tarefas pendentes, do produto ao billing e IA"
metadata: 
  node_type: memory
  type: project
  originSessionId: 914c5db3-72e4-46e4-8c94-cff548fab774
---

## Status atual
Fase 0 concluída e em produção em https://lexo-45tf.onrender.com (Render + PostgreSQL).

**Why:** Sessão de CTO/Arquiteto definiu o roadmap completo. Fase 0 foi executada e deployada.
**How to apply:** Usar este roadmap para priorizar o que implementar a seguir. Perguntar ao usuário por qual fase/item quer começar.

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

## 🔵 FASE 2 — Maturidade Operacional
- [ ] Notificações de prazo por email (aviso 3/7 dias antes, via Resend)
- [ ] Prazo automático como PERDIDO quando date < now e status PENDENTE
- [ ] Relatório financeiro — exportação PDF/CSV por período
- [ ] Histórico de atividades por processo
- [ ] Combobox de área jurídica (Cível, Trabalhista, Criminal, etc.)
- [ ] Validação CPF/CNPJ no cadastro de clientes

---

## 🟢 FASE 3 — Escala e Monetização
- [ ] Sistema de planos (trial 30 dias → Essencial R$79 → Pro R$149)
- [ ] Billing com Stripe (checkout, webhooks, portal do cliente)
- [ ] Convite de usuários por email com link temporário
- [ ] 2FA para administradores
- [ ] Auditoria de todas as ações por usuário

---

## 🤖 FASE 4 — IA (ordenada por ROI)
- [ ] Gerador de minutas/peças processuais via Claude API (ROI muito alto)
- [ ] Extrator de documentos PDF — IA preenche forms automaticamente (ROI alto)
- [ ] Score de risco de prazo — badge colorido de prioridade (ROI alto)
- [ ] Pesquisa jurisprudencial em linguagem natural (ROI médio)
- [ ] Resumo automático do processo (ROI médio)
