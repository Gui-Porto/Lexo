---
name: feedback-save-incrementally
description: "Salvar e commitar alterações incrementalmente durante implementações longas, especialmente antes do limite de contexto"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 914c5db3-72e4-46e4-8c94-cff548fab774
---

Sempre commitar e pushar para o GitHub ao final de cada funcionalidade ou grupo de arquivos relacionados durante implementações longas — não acumular tudo para o final.

**Why:** Se o contexto acabar no meio de uma fase, as alterações não commitadas se perdem e a próxima sessão não sabe o que foi feito. O usuário explicitamente pediu isso para evitar perda de trabalho.

**How to apply:**
- Ao implementar uma fase com vários itens, fazer git commit + push a cada item concluído (ex: "Dashboard KPIs", "Filtros e busca", etc.)
- Antes de perceber que o contexto está chegando ao limite, commitar tudo que está pronto até aquele ponto
- Atualizar também a memória `project_roadmap.md` marcando os itens concluídos ([x]) após cada commit
- Nunca deixar mais de 2-3 arquivos modificados sem commitar durante uma sessão longa
