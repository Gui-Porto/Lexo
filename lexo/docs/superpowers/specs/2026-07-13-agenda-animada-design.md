# Agenda animada — visão Ano + navegação com View Transitions

**Data:** 2026-07-13
**Branch:** dev

## Objetivo

Tornar a agenda dinâmica e animada, no espírito do Google Agenda: o usuário
"entra" num mês com animação, navega entre Ano → Mês → Dia com transições
fluidas, e registra compromissos sem sair do calendário.

## Estado atual

- Toggle Dia / Semana / Mês (`agenda-header.tsx`), navegação via `<Link>` com
  query params (`?view=mes&month=YYYY-MM`). Cada troca é um reload seco, sem
  animação.
- Visão Mês (`calendar-view.tsx`) é um grid **estático** server-rendered:
  chips de evento são `<Link>` pra `/agenda/[id]`; célula de dia não é clicável
  pra criar.
- Visão Dia/Semana (`day-view.tsx` / `week-view.tsx` → `time-grid.tsx`) já é
  client, com grade de horas e popover ancorado (`event-popover.tsx`) pra
  criar/editar sem sair da página.
- Next 16.2.9 — `<ViewTransition>` do React disponível, mas
  `experimental.viewTransition` **não** está ligado.

## Escopo

### 1. Ligar View Transitions

`next.config.ts` → `experimental: { viewTransition: true }`. Como a navegação
já é via `<Link>`/query params, as transições ativam automaticamente.

### 2. Nova visão Ano

- 4º botão no toggle: **Ano / Mês / Semana / Dia** (Ano primeiro).
- Novo `year-view.tsx`: 12 mini-meses num grid responsivo (4×3 desktop, 2×6
  tablet, 1×12 mobile).
- Cada mini-mês: grid 7×N compacto. Dia com compromisso ganha **pontinho
  colorido por tipo** (estilo Google Agenda), sem texto. Máx. de pontos por dia
  limitado (ex. 3) pra não poluir.
- Dia de hoje destacado (círculo preenchido).
- Query leve: só `{ date, type }` dos deadlines do ano inteiro (sem `include`).
- Header no modo Ano: label = "2026", prev/next = ano ±1, "Hoje" volta pro ano
  atual.

### 3. Mês interativo

`calendar-view.tsx` vira client component e ganha popover (mesmo
`event-popover.tsx` usado em Dia/Semana):

- **Clique no número do dia** → navega pra visão Dia daquele dia
  (`?view=dia&date=YYYY-MM-DD`).
- **Clique em espaço vazio da célula** → abre popover de **criar** ancorado na
  célula (hour default = 9).
- **Clique num chip de evento** → abre popover de **editar** (hoje navega pra
  `/agenda/[id]`; padroniza com Dia/Semana).
- Passar `cases` como prop (page.tsx já busca).

### 4. Animações (View Transitions API nativa, sem lib)

| Transição | Efeito | Como |
|-----------|--------|------|
| **Ano → Mês** | mini-mês faz *morph* (cresce/reposiciona até virar o grid grande), blur leve no meio do voo, ~450ms | `<ViewTransition name={`month-${ano}-${mes}`}>` no mini-mês e no grid do mês; `share="morph"` + CSS `via-blur` |
| **Mês → Dia** | dia clicado expande/morpha pra visão Dia | `<ViewTransition name={`day-${YYYY-MM-DD}`}>` na célula e no header do Dia |
| **Prev / Next** (qualquer view) | slide direcional + fade (‹ = nav-back desliza p/ direita, › = nav-forward desliza p/ esquerda) | `transitionTypes={['nav-forward'|'nav-back']}` nos Links; `<ViewTransition>` no container mapeando os tipos; CSS de slide 60px |
| **Toggle de view** | pill ativo desliza entre botões | `<ViewTransition name="view-pill">` no elemento ativo do toggle |
| **Popover criar/editar** | scale+fade a partir do ponto clicado (~180ms) | CSS animation no `PopoverPopup` (Base UI já dá `data-open`/`data-closed`) |
| **Chips no mês** | stagger na montagem | reusa padrão CSS `stagger` do design system |
| **Dia de hoje** | micro-pulse sutil no círculo | CSS keyframe leve |

**Header fixo:** durante slides direcionais, o header (`agenda-header`) não se
move — `viewTransitionName: "agenda-header"` + CSS `animation: none`.

**Reduced motion:** bloco `@media (prefers-reduced-motion: reduce)` zera
duração/delay de todas as `::view-transition-*`.

CSS das transições vai em `globals.css` (ou arquivo dedicado importado nele).

## Arquivos afetados

- `next.config.ts` — liga `viewTransition` (nota: já tem erro de tipo
  preexistente em `eslint` key; não mexer nisso)
- `src/components/agenda/agenda-header.tsx` — +Ano no toggle, `transitionTypes`
  nos prev/next, `ViewTransition` no pill
- `src/components/agenda/calendar-view.tsx` — vira client, popover, cliques
- `src/components/agenda/year-view.tsx` — **novo**
- `src/app/(dashboard)/agenda/page.tsx` — branch `view==="ano"`, query do ano,
  labels/hrefs do header pro ano, passa `cases` pro CalendarView
- `src/components/agenda/agenda-header.tsx` type `AgendaView` += `"ano"`
- `src/app/globals.css` — keyframes + regras `::view-transition-*`

## Fora de escopo

- Drag-and-drop de eventos.
- Redimensionar evento na grade.
- Recorrência.

## Verificação

Sem suíte de testes no projeto. Validação manual no dev server:
1. Toggle Ano → grid de 12 meses com pontinhos nos dias certos.
2. Clicar num mês → morph anima até o grid do mês.
3. No mês: clicar dia vazio abre popover criar; criar aparece no grid.
4. No mês: clicar número do dia → visão Dia daquele dia (com slide).
5. Prev/Next → slide direcional coerente.
6. `prefers-reduced-motion` (DevTools) → sem animação, troca instantânea.
