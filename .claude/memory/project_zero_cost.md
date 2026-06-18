---
name: project-zero-cost
description: "Restrição central: o Lexo deve rodar 100% gratuito (sem custos recorrentes)"
metadata:
  type: project
---

O usuário exige que o Lexo seja **100% gratuito** — nenhum serviço com custo recorrente.

**Why:** Decisão explícita do usuário em 2026-06-18 ("quero que o projeto seja 100% gratuito"). Foi o motivo da migração da IA Anthropic→Gemini.

**How to apply:** Ao escolher qualquer serviço/dependência, preferir free tiers. Stack gratuita atual: Render (hospedagem free, dorme após inatividade), Postgres do Render (free), **Gemini free tier** para IA (ver [[project-roadmap]]), Resend free tier para emails (100/dia), Stripe (sem mensalidade, só % por transação real). Antes de sugerir algo pago, avisar o custo e oferecer alternativa grátis. Env vars de feature pendentes no Render: `GEMINI_API_KEY` e `RESEND_API_KEY` (ver [[feedback-auto-deploy-on-master]] para o fluxo de deploy).
