# Memory Index

- [Roadmap do Lexo — 4 fases](project_roadmap.md) — Fases 0–4 TODAS concluídas (IA agora via Gemini free tier, NÃO Claude; billing Stripe, 2FA, auditoria); em produção no Render; contém gotcha de deploy (instanciar SDKs lazy, nunca no module scope)
- [Sistema de Design Lexo](project_design_system.md) — paleta dark oklch, animações CSS, logo SVG, PageHeader, SidebarNav com stagger
- [Salvar incrementalmente](feedback_save_incrementally.md) — Commitar e pushar a cada item concluído; atualizar roadmap na memória; nunca acumular tudo para o final
- [Auto-deploy na master](feedback_auto_deploy_on_master.md) — Render com Auto-Deploy "On Commit" na master; todo push na master já deploya sozinho (não preciso disparar nada)
- [Projeto 100% gratuito](project_zero_cost.md) — Restrição central: sem custos recorrentes; usar free tiers (Render, Gemini, Resend, Stripe sem mensalidade)
- [Auditoria de segurança](security_hardening.md) — AppSec 2026-06-18 na branch dev: TODAS as 8 vulns corrigidas (cron fail-secure, access control financeiro, rate limiting resiliente, CSP/HSTS, cifra TOTP AES-GCM, logging, magic bytes); build OK; gotcha: rodar migration RateHit em prod
- [Skill auditoria-seguranca](../skills/auditoria-seguranca/SKILL.md) — /auditoria-seguranca: auditoria zero-trust (red+blue+testes), detecta anti-padrões de vibe coding
