---
name: feedback-auto-deploy-on-master
description: "Deploy de produção é automático via Render Auto-Deploy a cada push na master"
metadata:
  type: project
---

O deploy de produção do Lexo é **automático**: o serviço no Render está com **Auto-Deploy = "On Commit"** na branch `master`. Todo `git push origin master` dispara o build+deploy sozinho, pelo próprio Render.

**Why:** O usuário usa o plano gratuito do Render e quer deploy automático a cada merge na master; o Auto-Deploy nativo resolve isso sem precisar de Deploy Hook nem de eu disparar nada.

**How to apply:** Eu NÃO preciso (nem consigo, sem credenciais) disparar o deploy manualmente. Basta mergear na `master` e `git push origin master` — o Render faz o resto. Após o push, sugerir conferir a aba Events/Logs do serviço. Produção: https://lexo-45tf.onrender.com. Build quebra se SDK for instanciado no module scope sem env var — ver gotcha em [[project-roadmap]].
