---
name: feedback-auto-deploy-on-master
description: "Deploy de produção é automático via Render Auto-Deploy a cada push na master"
metadata:
  type: project
---

O deploy de produção do Lexo deveria ser automático (Render Auto-Deploy na `master`), MAS em 2026-06-18 o merge do PR #1 na `master` (via GitHub) **NÃO disparou o deploy sozinho** — foi preciso **Manual Deploy → "Deploy latest commit"** no painel do Render. Causa provável: toggle Auto-Deploy desligado OU o filtro "Root Directory: lexo" (mudanças fora de `lexo/` não disparam). Config confirmada no painel: Branch `master`, Root Directory `lexo`, Build Command `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` (logo, migrations rodam no deploy).

**Why:** O usuário usa o plano gratuito do Render e quer deploy automático; mas não dá para assumir que todo push/merge na master deploya sozinho — já falhou uma vez.

**How to apply:** Após `git push origin master`, NÃO assumir que está no ar. **Verificar de verdade**: `curl -sS -I https://lexo-45tf.onrender.com/login` e conferir se os headers novos (ex.: `content-security-policy`, `strict-transport-security`) aparecem. Se o código não subiu, orientar o usuário a fazer **Manual Deploy** no Render e/ou ligar o toggle **Auto-Deploy** em Settings. Atenção: free tier hiberna e faz cold-start nas requisições (o log `npm start`/`next start` pode ser só o serviço antigo acordando, não um deploy novo). Produção: https://lexo-45tf.onrender.com. Ver também [[security-hardening]] e gotcha de build em [[project-roadmap]].
