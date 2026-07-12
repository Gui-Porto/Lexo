# Redesign da Agenda — visões Dia/Semana/Mês estilo Google Calendar

## Contexto

A página `/agenda` hoje tem só uma visão de Mês (grid de dias com chips) e uma lista genérica embaixo. O usuário quer que a agenda seja "intuitiva e dinâmica" e funcione como um Google Calendar dentro do sistema — isso é citado como diferencial de produto. Gatilho imediato: ao navegar pra outro mês, o botão "Hoje" (atalho pra voltar ao mês atual) parecia uma mensagem de erro em vez de um botão de ação — problema de legibilidade, não de lógica.

Este spec cobre só o redesign da visualização/interação da agenda. A sincronização bidirecional com Google Calendar (webhook, near-real-time) é um projeto separado, já decidido em conversa mas não coberto aqui.

## Objetivo

Dar à agenda visões Dia / Semana / Mês como o Google Calendar, com criação rápida clicando num horário, mantendo a lista de prazos como visão complementar sempre visível.

## Decisões

### 1. Seletor de visão + botão "Hoje"
- Header da agenda ganha seletor `Dia | Semana | Mês` (substitui o toggle Lista/Calendário que foi removido na iteração anterior).
- Botão "Hoje" redesenhado como botão de ação real (ícone + texto, estilo outline, sempre visível no header) — leva pro dia/semana/mês atual. Hoje ele só aparecia como texto solto quando fora do mês atual e lia como erro; o comportamento (só habilitado/destacado quando fora do período atual) continua, só muda o design.
- URL: `?view=dia|semana|mes` (default `mes`), preserva `?month=`/`?date=` conforme a visão.

### 2. Horário no prazo (schema + form)
- `Deadline.date` deixa de ser sempre meia-noite UTC fixa. Passa a carregar hora real quando o usuário informar.
- Convenção: hora `00:00` = "dia inteiro" (comportamento atual, prazo processual sem hora específica). Qualquer outra hora = horário específico (audiência, reunião com hora marcada).
- Form (`deadline-form.tsx` e o popover novo) ganha campo de hora opcional, `<input type="time">`, vazio = dia inteiro.
- Nenhuma migration de schema necessária (campo já é `DateTime`) — só muda como o valor é montado no client/server (não zera mais a hora ao salvar).

### 3. Visão Semana / Dia — grid de horas
- Novo `week-view.tsx` (client component): 7 colunas × grade de horas 06h–22h (scroll pro resto do dia), prazos com hora posicionados na hora certa; prazos "dia inteiro" ficam numa faixa fixa no topo de cada coluna, fora da grade.
- Novo `day-view.tsx`: mesma grade, uma coluna larga.
- Mês (`calendar-view.tsx`, existente) não muda de formato — só herda o novo seletor no header.

### 4. Criar/editar clicando no calendário
- Novo `event-popover.tsx` (client component): clique num slot vazio da grade (Semana/Dia) abre popover compacto com título, tipo, processo, data/hora pré-preenchidas com o slot clicado; salva via Server Action `createDeadline` já existente. Sem navegação de página.
- Clique num bloco de prazo existente abre o mesmo popover em modo edição, usando `updateDeadline` já existente.
- Erros do Server Action aparecem inline no popover (mesmo padrão `{error}` que os forms de página já usam).
- Mês continua abrindo `/agenda/[id]` ao clicar num chip (sem popover) — não muda.

### 5. Lista embaixo — reagrupada por dia
- Sai do formato "linha solta por prazo" e passa a agrupar por data com cabeçalho relativo (Hoje / Amanhã / dia da semana + data), como a visão "Agenda" do Google Calendar.
- Filtros de status/tipo e busca continuam como estão.
- Paginação passa a paginar por blocos de dias em vez de por item individual.

### 6. Efeito colateral na sincronização Google
- `syncDeadlineToGoogle` (`src/lib/google-calendar.ts`) hoje sempre manda evento de dia inteiro (`start: { date }`). Com horário real, prazo com hora ≠ 00:00 passa a virar evento com hora no Google (`start: { dateTime }`); prazo dia inteiro continua como está. Ajuste direto na função existente, não é feature nova.

## Arquitetura

```
agenda/page.tsx
  ├─ decide visão (?view=) e busca só os dados do período necessário
  ├─ calendar-view.tsx      (Mês — existente, ganha seletor no header)
  ├─ week-view.tsx          (novo — client, grade de horas)
  ├─ day-view.tsx           (novo — client, grade de horas, 1 coluna)
  ├─ event-popover.tsx      (novo — client, cria/edita via createDeadline/updateDeadline)
  └─ lista reagrupada por dia (mesmo page.tsx, embaixo)
```

Sem dependência nova. Sem endpoint novo. Reusa `createDeadline`/`updateDeadline`/`deleteDeadline` já existentes em `src/actions/agenda.ts`.

## Fora de escopo (v1)

- Drag-and-drop pra reagendar arrastando.
- Sincronização bidirecional com Google (webhook) — spec separado.
- Múltiplos calendários sobrepostos, busca global, atalhos de teclado.

## Validação

Sem suíte automatizada no projeto. Validação manual via Playwright (`webapp-testing` skill) depois de implementado: troca de visão, clique pra criar em slot vazio, clique pra editar bloco existente, confere que Mês e lista embaixo continuam consistentes com os dados novos.
