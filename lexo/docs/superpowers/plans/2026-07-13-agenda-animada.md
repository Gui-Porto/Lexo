# Agenda Animada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a agenda animada e dinâmica (estilo Google Agenda): visão Ano nova, morph animado Ano→Mês→Dia, slide direcional no prev/next, e o Mês passa a criar/editar compromissos sem sair da página (como Dia/Semana já fazem).

**Architecture:** Usa a View Transitions API nativa do browser via `<ViewTransition>` do React (já embutido no bundle do Next 16 — confirmado em `node_modules/next/dist/compiled/react`), ligada com `experimental.viewTransition: true` no `next.config.ts`. Navegação continua 100% server-rendered via `<Link>`/query params (`?view=...`); nenhuma reescrita pra client-state/SPA. Popover de criar/editar reaproveita o componente `EventPopover` que Dia/Semana já usam.

**Tech Stack:** Next.js 16.2.9 App Router, React 19 (View Transitions via build do Next), Prisma, Base UI Popover.

## Global Constraints

- Sem suíte de testes no projeto (confirmado: só `dev`/`build`/`lint`/`migrate:deploy` em `package.json`, nenhum jest/vitest/playwright instalado). Verificação de cada task é `npx tsc --noEmit` + `npx eslint <arquivos>` + checagem manual no dev server (já rodando em `http://localhost:3000`), não testes automatizados.
- Convenção de data do projeto: tudo em UTC, chave de dia `"YYYY-MM-DD"` via `dayKey()` de `src/lib/agenda-date.ts` (nunca `Date` local).
- Estilo do projeto é inline `style={{...}}` com paleta `oklch(...)` — não introduzir Tailwind classes novas fora do que já existe (`animate-fade-up`, `animate-fade-in`, `r-grid-4`, `r-tablewrap`, `r-tablegrid`).
- `next.config.ts` tem `typescript.ignoreBuildErrors: true` — o erro pré-existente de tipo em `next.config.ts` (chave `eslint`) é ignorado, não mexer nele.
- Toda mutação de `Deadline` já passa por `src/actions/agenda.ts` (`createDeadline`/`updateDeadline`) via `EventPopover` — nenhuma task deste plano cria novas Server Actions.
- Respeitar `prefers-reduced-motion` em toda animação nova (CSS, não JS).

---

### Task 1: Base — config, helper de agrupamento, CSS de transição

**Files:**
- Modify: `next.config.ts`
- Modify: `src/lib/agenda-date.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `groupDeadlinesByDay<T extends { date: Date }>(items: T[]): Map<string, T[]>` em `src/lib/agenda-date.ts` — usado pelas Tasks 3 e 4.
- Produces: classe utilitária `.animate-today-pulse` e regras globais `::view-transition-*` (`.nav-forward`/`.nav-back`/`.morph`) — usadas pelas Tasks 2–4.

- [ ] **Step 1: Ligar View Transitions no Next**

Em `next.config.ts`, adicionar a chave `experimental` ao objeto `nextConfig` (depois de `eslint`, antes de `async headers()`):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    viewTransition: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Adicionar helper de agrupamento por dia**

Em `src/lib/agenda-date.ts`, adicionar ao final do arquivo (reaproveita `dayKey`, já definido acima nesse mesmo arquivo):

```ts
/** Agrupa itens com campo `date` por chave de dia UTC ("YYYY-MM-DD"). */
export function groupDeadlinesByDay<T extends { date: Date }>(items: T[]): Map<string, T[]> {
  const byDay = new Map<string, T[]>();
  for (const item of items) {
    const key = dayKey(new Date(item.date));
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(item);
  }
  return byDay;
}
```

- [ ] **Step 3: CSS das transições**

Em `src/app/globals.css`, adicionar aos `@keyframes` existentes (logo depois de `@keyframes border-glow { ... }`, dentro da seção `/* ─── Keyframes ─── */`):

```css
@keyframes today-pulse {
  0%, 100% { box-shadow: 0 0 0 0 oklch(0.66 0.18 274 / 0.45); }
  50%      { box-shadow: 0 0 0 5px oklch(0.66 0.18 274 / 0); }
}

@keyframes via-blur {
  30% { filter: blur(3px); }
}

@keyframes vt-slide {
  from { translate: var(--slide-offset); }
  to   { translate: 0; }
}
```

Na seção `@layer utilities` (logo depois de `.animate-fade-in { ... }`), adicionar:

```css
  .animate-today-pulse {
    animation: today-pulse 2.4s ease-in-out infinite;
  }
```

No final do arquivo (fora de qualquer `@layer`, mesmo nível dos `@keyframes` — são pseudo-elementos globais, não podem ir dentro de `@layer`), adicionar uma nova seção:

```css
/* ─── View Transitions (nativo, Next experimental.viewTransition) ── */

::view-transition-group(.morph) {
  animation-duration: 450ms;
}
::view-transition-image-pair(.morph) {
  animation-name: via-blur;
}

::view-transition-old(.nav-forward) {
  --slide-offset: -60px;
  animation: 150ms ease-in both fade-in reverse, 400ms ease-in-out both vt-slide reverse;
}
::view-transition-new(.nav-forward) {
  --slide-offset: 60px;
  animation: 210ms ease-out 150ms both fade-in, 400ms ease-in-out both vt-slide;
}
::view-transition-old(.nav-back) {
  --slide-offset: 60px;
  animation: 150ms ease-in both fade-in reverse, 400ms ease-in-out both vt-slide reverse;
}
::view-transition-new(.nav-back) {
  --slide-offset: -60px;
  animation: 210ms ease-out 150ms both fade-in, 400ms ease-in-out both vt-slide;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit` (a partir de `lexo/`)
Expected: mesmo único erro pré-existente em `next.config.ts` linha do `eslint` (não relacionado, já existia antes desta task) — nenhum erro novo.

Run: `npx eslint next.config.ts src/lib/agenda-date.ts src/app/globals.css`
Expected: sem erros novos.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts src/lib/agenda-date.ts src/app/globals.css
git commit -m "feat(agenda): liga View Transitions e prepara CSS/helper de animacao"
```

---

### Task 2: Slide direcional no prev/next + pill animado no toggle

**Files:**
- Modify: `src/components/agenda/agenda-header.tsx`
- Modify: `src/app/(dashboard)/agenda/page.tsx:275-284`

**Interfaces:**
- Consumes: `groupDeadlinesByDay` (não usado nesta task, só Task 1 base já commitada).
- Produces: nada consumido por outras tasks (é folha de UI), mas o wrapper `<ViewTransition>` adicionado no `page.tsx` em torno do bloco de views é reaproveitado pela Task 3 (o branch `view === "ano"` entra dentro do mesmo wrapper).

- [ ] **Step 1: `transitionTypes` nas setas prev/next + pill animado**

Reescrever `src/components/agenda/agenda-header.tsx` inteiro:

```tsx
import Link from "next/link";
import { ViewTransition } from "react";
import { CalendarDays } from "lucide-react";

export type AgendaView = "ano" | "dia" | "semana" | "mes";

const VIEWS: { value: AgendaView; label: string }[] = [
  { value: "ano", label: "Ano" },
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

const navBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, borderRadius: 8,
  border: "1px solid oklch(1 0 0 / 8%)",
  background: "oklch(0.155 0.02 264)",
  color: "oklch(0.70 0.02 264)",
  textDecoration: "none", fontSize: 18, lineHeight: 1,
};

export function AgendaHeader({
  view,
  label,
  prevHref,
  nextHref,
  todayHref,
  isCurrentPeriod,
  viewHref,
}: {
  view: AgendaView;
  label: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  isCurrentPeriod: boolean;
  viewHref: (v: AgendaView) => string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={prevHref} style={navBtnStyle} aria-label="Anterior" transitionTypes={["nav-back"]}>‹</Link>
        <Link href={nextHref} style={navBtnStyle} aria-label="Próximo" transitionTypes={["nav-forward"]}>›</Link>
        <span style={{ fontSize: 18, fontWeight: 700, color: "oklch(0.94 0.01 264)", letterSpacing: "-0.3px" }}>
          {label}
        </span>
        {isCurrentPeriod ? (
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: "oklch(0.45 0.02 264)",
              background: "oklch(0.155 0.02 264)", border: "1px solid oklch(1 0 0 / 8%)",
              borderRadius: 8, padding: "6px 12px", opacity: 0.6,
            }}
          >
            <CalendarDays size={14} /> Hoje
          </span>
        ) : (
          <Link
            href={todayHref}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: "oklch(0.66 0.18 274)",
              background: "oklch(0.66 0.18 274 / 12%)", border: "1px solid oklch(0.66 0.18 274 / 25%)",
              borderRadius: 8, padding: "6px 12px", textDecoration: "none",
            }}
          >
            <CalendarDays size={14} /> Hoje
          </Link>
        )}
      </div>

      <div style={{ display: "flex", background: "oklch(0.11 0.015 264)", border: "1px solid oklch(1 0 0 / 8%)", borderRadius: 10, padding: 3, gap: 2 }}>
        {VIEWS.map((v) => {
          const isActive = view === v.value;
          const linkStyle: React.CSSProperties = {
            padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
            textDecoration: "none", display: "block",
            background: isActive ? "oklch(0.66 0.18 274)" : "transparent",
            color: isActive ? "#fff" : "oklch(0.60 0.02 264)",
          };
          if (isActive) {
            return (
              <ViewTransition key={v.value} name="view-pill">
                <Link href={viewHref(v.value)} style={linkStyle}>{v.label}</Link>
              </ViewTransition>
            );
          }
          return (
            <Link key={v.value} href={viewHref(v.value)} style={linkStyle}>
              {v.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Envolver o bloco de views em `<ViewTransition>` direcional**

Em `src/app/(dashboard)/agenda/page.tsx`, adicionar o import no topo (junto aos outros imports de `react`/`next`):

```ts
import { ViewTransition } from "react";
```

Substituir o bloco (linhas 275-284 do arquivo atual):

```tsx
      {view === "mes" && (
        <CalendarView year={calYear} month={calMonth} deadlines={viewDeadlines} />
      )}

      {view === "semana" && (
        <WeekView weekStart={formatDateParam(weekStart)} deadlines={viewDeadlines} cases={cases} />
      )}
      {view === "dia" && (
        <DayView day={formatDateParam(dayStart)} deadlines={viewDeadlines} cases={cases} />
      )}
```

por:

```tsx
      <ViewTransition
        enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
        exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
        default="none"
      >
        {view === "mes" && (
          <CalendarView year={calYear} month={calMonth} deadlines={viewDeadlines} />
        )}

        {view === "semana" && (
          <WeekView weekStart={formatDateParam(weekStart)} deadlines={viewDeadlines} cases={cases} />
        )}
        {view === "dia" && (
          <DayView day={formatDateParam(dayStart)} deadlines={viewDeadlines} cases={cases} />
        )}
      </ViewTransition>
```

(A Task 3 adiciona o branch `view === "ano"` dentro deste mesmo `<ViewTransition>`; a Task 4 adiciona a prop `cases` no `<CalendarView>`.)

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit`
Expected: mesmo erro pré-existente do `next.config.ts`, nenhum erro novo.

Run: `npx eslint src/components/agenda/agenda-header.tsx "src/app/(dashboard)/agenda/page.tsx"`
Expected: sem erros novos.

Manual no browser (`http://localhost:3000/agenda`, logado):
1. Toggle Dia/Semana/Mês ainda funciona, "Ano" aparece mas cai em Mês (ainda não implementado — ok por enquanto).
2. Clicar ‹ / › no Mês → grid desliza (slide) em vez de trocar seco.
3. O "pill" roxo do toggle desliza entre os botões ao trocar de view.

- [ ] **Step 4: Commit**

```bash
git add src/components/agenda/agenda-header.tsx "src/app/(dashboard)/agenda/page.tsx"
git commit -m "feat(agenda): slide direcional no prev/next e pill animado no toggle"
```

---

### Task 3: Visão Ano (novo componente + wiring)

**Files:**
- Create: `src/components/agenda/year-view.tsx`
- Modify: `src/components/agenda/calendar-view.tsx` (só o wrapper `<ViewTransition>`, sem interatividade ainda)
- Modify: `src/app/(dashboard)/agenda/page.tsx`

**Interfaces:**
- Consumes: `groupDeadlinesByDay` (Task 1), `CalendarDeadline` type (já existe em `calendar-view.tsx`), `MONTH_NAMES`/`DAY_NAMES_SHORT` (já existem em `agenda-date.ts`).
- Produces: `YearView({ year, deadlines }: { year: number; deadlines: CalendarDeadline[] })` — usado só pelo `page.tsx`.
- Produces: `<ViewTransition name={`month-${monthParam}`}>` envolvendo o grid do Mês em `calendar-view.tsx` — o nome (`month-YYYY-MM`) precisa bater exatamente com o `name` usado nos cartões do `year-view.tsx` pro morph funcionar.

- [ ] **Step 1: Criar `year-view.tsx`**

```tsx
import Link from "next/link";
import { ViewTransition } from "react";
import { MONTH_NAMES, DAY_NAMES_SHORT, groupDeadlinesByDay } from "@/lib/agenda-date";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";

const TYPE_DOT_COLOR: Record<string, string> = {
  PRAZO: "oklch(0.66 0.18 274)",
  AUDIENCIA: "oklch(0.65 0.15 200)",
  REUNIAO: "oklch(0.72 0.15 150)",
  OUTRO: "oklch(0.55 0.02 264)",
};

export function YearView({
  year,
  deadlines,
}: {
  year: number;
  deadlines: CalendarDeadline[];
}) {
  const byDay = groupDeadlinesByDay(deadlines);
  const today = new Date();
  const todayY = today.getUTCFullYear();
  const todayM = today.getUTCMonth();
  const todayD = today.getUTCDate();

  return (
    <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {MONTH_NAMES.map((name, m) => {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const startDow = new Date(year, m, 1).getDay();
        const cells: (number | null)[] = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        const monthParam = `${year}-${String(m + 1).padStart(2, "0")}`;

        return (
          <ViewTransition key={monthParam} name={`month-${monthParam}`} share="morph">
            <Link
              href={`?view=mes&month=${monthParam}`}
              style={{
                display: "block", textDecoration: "none",
                border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 12,
                padding: 10, background: "oklch(0.11 0.015 264)",
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: "oklch(0.85 0.02 264)", margin: "0 0 8px", textAlign: "center" }}>
                {name}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {DAY_NAMES_SHORT.map((d) => (
                  <span key={d} style={{ fontSize: 8, color: "oklch(0.40 0.02 264)", textAlign: "center" }}>{d[0]}</span>
                ))}
                {cells.map((day, i) => {
                  if (day === null) return <span key={`pad-${i}`} />;
                  const isToday = year === todayY && m === todayM && day === todayD;
                  const dateKey = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const items = byDay.get(dateKey) ?? [];
                  const types = Array.from(new Set(items.map((it) => it.type))).slice(0, 3);
                  return (
                    <div key={dateKey} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "2px 0" }}>
                      <span
                        style={{
                          width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "50%", fontSize: 9,
                          background: isToday ? "oklch(0.66 0.18 274)" : "transparent",
                          color: isToday ? "#fff" : "oklch(0.60 0.02 264)",
                        }}
                      >
                        {day}
                      </span>
                      <div style={{ display: "flex", gap: 1, height: 3 }}>
                        {types.map((t) => (
                          <span key={t} style={{ width: 3, height: 3, borderRadius: "50%", background: TYPE_DOT_COLOR[t] ?? TYPE_DOT_COLOR.OUTRO }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Link>
          </ViewTransition>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: `<ViewTransition>` no grid do Mês**

Reescrever `src/components/agenda/calendar-view.tsx` completo (ainda server component, sem popover — isso é a Task 4; aqui só entra o import de `ViewTransition`, o cálculo de `monthParam` e o wrapper em volta do JSX existente):

```tsx
import Link from "next/link";
import { ViewTransition } from "react";

export type CalendarDeadline = {
  id: string;
  title: string;
  date: Date;
  type: string;
  status: string;
  description: string | null;
  caseId: string | null;
};

type Props = {
  year: number;
  month: number; // 0-indexed
  deadlines: CalendarDeadline[];
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PRAZO:    { bg: "oklch(0.66 0.18 274 / 22%)", color: "oklch(0.80 0.14 274)" },
  AUDIENCIA:{ bg: "oklch(0.65 0.15 200 / 22%)", color: "oklch(0.78 0.13 200)" },
  REUNIAO:  { bg: "oklch(0.72 0.15 150 / 22%)", color: "oklch(0.78 0.13 150)" },
  OUTRO:    { bg: "oklch(0.45 0.02 264 / 28%)", color: "oklch(0.65 0.02 264)" },
};

const TYPE_ICON: Record<string, string> = {
  PRAZO: "⏰", AUDIENCIA: "⚖️", REUNIAO: "🤝", OUTRO: "📌",
};

const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export function CalendarView({ year, month, deadlines }: Props) {
  const today = new Date();
  const todayY = today.getUTCFullYear();
  const todayM = today.getUTCMonth();
  const todayD = today.getUTCDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;

  // Group deadlines by "YYYY-MM-DD" (UTC date)
  const byDay = new Map<string, CalendarDeadline[]>();
  for (const d of deadlines) {
    const dt = new Date(d.date);
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(d);
  }

  // Build cell array: null for padding, number for day
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <ViewTransition name={`month-${monthParam}`} share="morph">
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Calendar grid */}
      <div className="r-tablewrap" style={{ border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 16, overflow: "hidden" }}>
        {/* Day headers */}
        <div className="r-tablegrid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "oklch(0.11 0.015 264)", borderBottom: "1px solid oklch(1 0 0 / 7%)" }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: i === 0 ? "oklch(0.65 0.14 30)" : "oklch(0.42 0.02 264)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="r-tablegrid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((day, i) => {
            const isLastRow = i >= cells.length - 7;
            const isLastCol = (i + 1) % 7 === 0;
            const borderRight  = !isLastCol ? "1px solid oklch(1 0 0 / 5%)" : "none";
            const borderBottom = !isLastRow ? "1px solid oklch(1 0 0 / 5%)" : "none";

            if (day === null) {
              return (
                <div key={`pad-${i}`} style={{ minHeight: 110, borderRight, borderBottom, background: "oklch(0.10 0.013 264 / 0.6)" }} />
              );
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = year === todayY && month === todayM && day === todayD;
            const items   = byDay.get(dateKey) ?? [];
            const MAX = 3;
            const visible  = items.slice(0, MAX);
            const overflow = items.length - MAX;

            return (
              <div
                key={dateKey}
                style={{
                  minHeight: 110, padding: "8px 6px", borderRight, borderBottom,
                  background: isToday ? "oklch(0.66 0.18 274 / 6%)" : "transparent",
                }}
              >
                {/* Day number */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
                  <span
                    style={{
                      width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "50%",
                      background: isToday ? "oklch(0.66 0.18 274)" : "transparent",
                      color: isToday ? "#fff" : (i % 7 === 0 ? "oklch(0.60 0.12 30)" : "oklch(0.55 0.02 264)"),
                      fontSize: 12, fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {day}
                  </span>
                </div>

                {/* Event chips */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {visible.map((ev) => {
                    const tc = TYPE_COLORS[ev.type] ?? TYPE_COLORS.OUTRO;
                    const isDone = ev.status === "CONCLUIDO";
                    const isLost = ev.status === "PERDIDO";
                    return (
                      <Link
                        key={ev.id}
                        href={`/agenda/${ev.id}`}
                        title={ev.title}
                        style={{
                          display: "flex", alignItems: "center", gap: 3,
                          background: isDone || isLost ? "oklch(0.18 0.015 264)" : tc.bg,
                          color: isDone || isLost ? "oklch(0.42 0.02 264)" : tc.color,
                          borderRadius: 5, padding: "2px 5px",
                          fontSize: 11, fontWeight: 500,
                          textDecoration: "none",
                          overflow: "hidden", whiteSpace: "nowrap",
                          opacity: isDone || isLost ? 0.65 : 1,
                        }}
                      >
                        <span style={{ flexShrink: 0, fontSize: 10 }}>{TYPE_ICON[ev.type] ?? "📌"}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                      </Link>
                    );
                  })}
                  {overflow > 0 && (
                    <span style={{ fontSize: 10, color: "oklch(0.46 0.02 264)", paddingLeft: 4 }}>
                      +{overflow} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { type: "PRAZO", label: "Prazo" },
          { type: "AUDIENCIA", label: "Audiência" },
          { type: "REUNIAO", label: "Reunião" },
          { type: "OUTRO", label: "Outro" },
        ].map(({ type, label }) => {
          const tc = TYPE_COLORS[type];
          return (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11 }}>{TYPE_ICON[type]}</span>
              <span style={{ fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color, borderRadius: 5, padding: "2px 7px" }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
    </ViewTransition>
  );
}
```

Nota: esta é uma versão intermediária (ainda sem popover, sem prop `cases`, sem `groupDeadlinesByDay`) — a Task 4 reescreve este mesmo arquivo de novo, já client-side e interativo.

- [ ] **Step 3: Wiring da view "ano" em `page.tsx`**

Adicionar o import no topo:

```ts
import { YearView } from "@/components/agenda/year-view";
```

Trocar a linha de parsing da view (linha 99 do arquivo atual):

```ts
  const view: AgendaView = viewStr === "dia" || viewStr === "semana" ? viewStr : "mes";
```

por:

```ts
  const view: AgendaView =
    viewStr === "dia" || viewStr === "semana" || viewStr === "ano" ? viewStr : "mes";
```

No bloco `if (view === "semana") {...} else if (view === "dia") {...} else {...}` (linhas 115-146), inserir um `else if` pra `"ano"` antes do `else` final (que trata "mes"):

```tsx
  } else if (view === "dia") {
    rangeStart = dayStart;
    rangeEnd = new Date(addDaysUTC(dayStart, 1).getTime() - 1);
    headerLabel = `${WEEKDAY_LONG[dayStart.getUTCDay()]}, ${dayStart.getUTCDate()} de ${MONTH_NAMES[dayStart.getUTCMonth()]}`;
    prevHref = `?view=dia&date=${formatDateParam(addDaysUTC(dayStart, -1))}`;
    nextHref = `?view=dia&date=${formatDateParam(addDaysUTC(dayStart, 1))}`;
    todayHref = `?view=dia`;
    isCurrentPeriod = dayKey(dayStart) === dayKey(todayUTC);
  } else if (view === "ano") {
    rangeStart = new Date(Date.UTC(calYear, 0, 1));
    rangeEnd   = new Date(Date.UTC(calYear, 11, 31, 23, 59, 59, 999));
    headerLabel = `${calYear}`;
    prevHref = `?view=ano&month=${calYear - 1}-01`;
    nextHref = `?view=ano&month=${calYear + 1}-01`;
    todayHref = `?view=ano`;
    isCurrentPeriod = calYear === now.getUTCFullYear();
  } else {
    rangeStart = monthStart;
    rangeEnd = monthEnd;
    headerLabel = `${MONTH_NAMES[calMonth]} ${calYear}`;
    const prevMonthDate = new Date(calYear, calMonth - 1, 1);
    const nextMonthDate = new Date(calYear, calMonth + 1, 1);
    const prevMonthParam = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
    const nextMonthParam = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;
    prevHref = `?view=mes&month=${prevMonthParam}`;
    nextHref = `?view=mes&month=${nextMonthParam}`;
    todayHref = `?view=mes`;
    isCurrentPeriod = calMonthParam === nowMonthStr;
  }
```

Dentro do `<ViewTransition>` adicionado na Task 2, adicionar o branch do Ano (antes do `{view === "mes" && ...}`):

```tsx
        {view === "ano" && (
          <YearView year={calYear} deadlines={viewDeadlines} />
        )}

        {view === "mes" && (
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit`
Expected: mesmo erro pré-existente, nenhum erro novo (checar especialmente que `AgendaView` inclui `"ano"` em todo lugar que o tipo é usado).

Run: `npx eslint src/components/agenda/year-view.tsx src/components/agenda/calendar-view.tsx "src/app/(dashboard)/agenda/page.tsx"`
Expected: sem erros novos.

Manual no browser (`http://localhost:3000/agenda?view=ano`):
1. Grid de 12 meses aparece, com pontinhos coloridos nos dias com prazo.
2. Clicar num mês → morpha (cresce/blur) até o grid grande daquele mês.
3. ‹ / › no Ano navegam ano a ano.
4. Clicar "Ano" no toggle a partir do Mês volta pro ano corrente.

- [ ] **Step 5: Commit**

```bash
git add src/components/agenda/year-view.tsx src/components/agenda/calendar-view.tsx "src/app/(dashboard)/agenda/page.tsx"
git commit -m "feat(agenda): visao Ano com morph animado pro mes"
```

---

### Task 4: Mês interativo (popover criar/editar, drill-in pro Dia, stagger, pulse)

**Files:**
- Modify: `src/components/agenda/calendar-view.tsx`
- Modify: `src/components/agenda/day-view.tsx`
- Modify: `src/app/(dashboard)/agenda/page.tsx:276` (prop `cases`)

**Interfaces:**
- Consumes: `EventPopover`/`PopoverSlot` (já existem em `event-popover.tsx`, usados sem alteração), `groupDeadlinesByDay` (Task 1).
- Produces: `CalendarView` passa a exigir prop `cases: { id: string; number: string }[]` — `page.tsx` precisa passar.
- Produces: `<ViewTransition name={`day-${dateKey}`}>` no número do dia (Mês) e em `day-view.tsx` — nomes precisam bater pro morph Mês→Dia funcionar.

- [ ] **Step 1: Reescrever `calendar-view.tsx` completo (client + popover + drill-in + stagger + pulse)**

```tsx
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ViewTransition } from "react";
import { EventPopover, type PopoverSlot } from "@/components/agenda/event-popover";
import { groupDeadlinesByDay } from "@/lib/agenda-date";

export type CalendarDeadline = {
  id: string;
  title: string;
  date: Date;
  type: string;
  status: string;
  description: string | null;
  caseId: string | null;
};

type Props = {
  year: number;
  month: number; // 0-indexed
  deadlines: CalendarDeadline[];
  cases: { id: string; number: string }[];
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PRAZO:    { bg: "oklch(0.66 0.18 274 / 22%)", color: "oklch(0.80 0.14 274)" },
  AUDIENCIA:{ bg: "oklch(0.65 0.15 200 / 22%)", color: "oklch(0.78 0.13 200)" },
  REUNIAO:  { bg: "oklch(0.72 0.15 150 / 22%)", color: "oklch(0.78 0.13 150)" },
  OUTRO:    { bg: "oklch(0.45 0.02 264 / 28%)", color: "oklch(0.65 0.02 264)" },
};

const TYPE_ICON: Record<string, string> = {
  PRAZO: "⏰", AUDIENCIA: "⚖️", REUNIAO: "🤝", OUTRO: "📌",
};

const DAY_NAMES = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const DEFAULT_CREATE_HOUR = 9; // ponytail: mês não tem grade de hora; hora default editável no popover

export function CalendarView({ year, month, deadlines, cases }: Props) {
  const [popover, setPopover] = useState<PopoverSlot | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  const today = new Date();
  const todayY = today.getUTCFullYear();
  const todayM = today.getUTCMonth();
  const todayD = today.getUTCDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;
  const byDay = groupDeadlinesByDay(deadlines);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function openCreate(e: React.MouseEvent<HTMLElement>, dateKey: string) {
    anchorRef.current = e.currentTarget;
    setPopover({ mode: "create", dateKey, hour: DEFAULT_CREATE_HOUR });
  }

  function openEdit(e: React.MouseEvent<HTMLElement>, deadline: CalendarDeadline) {
    e.stopPropagation();
    anchorRef.current = e.currentTarget;
    setPopover({ mode: "edit", deadline });
  }

  return (
    <ViewTransition name={`month-${monthParam}`} share="morph">
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Calendar grid */}
      <div className="r-tablewrap" style={{ border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 16, overflow: "hidden" }}>
        {/* Day headers */}
        <div className="r-tablegrid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "oklch(0.11 0.015 264)", borderBottom: "1px solid oklch(1 0 0 / 7%)" }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: i === 0 ? "oklch(0.65 0.14 30)" : "oklch(0.42 0.02 264)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="r-tablegrid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((day, i) => {
            const isLastRow = i >= cells.length - 7;
            const isLastCol = (i + 1) % 7 === 0;
            const borderRight  = !isLastCol ? "1px solid oklch(1 0 0 / 5%)" : "none";
            const borderBottom = !isLastRow ? "1px solid oklch(1 0 0 / 5%)" : "none";

            if (day === null) {
              return (
                <div key={`pad-${i}`} style={{ minHeight: 110, borderRight, borderBottom, background: "oklch(0.10 0.013 264 / 0.6)" }} />
              );
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = year === todayY && month === todayM && day === todayD;
            const items   = byDay.get(dateKey) ?? [];
            const MAX = 3;
            const visible  = items.slice(0, MAX);
            const overflow = items.length - MAX;

            return (
              <div
                key={dateKey}
                onClick={(e) => openCreate(e, dateKey)}
                style={{
                  minHeight: 110, padding: "8px 6px", borderRight, borderBottom, cursor: "pointer",
                  background: isToday ? "oklch(0.66 0.18 274 / 6%)" : "transparent",
                }}
              >
                {/* Day number — drill-in pra visão Dia */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
                  <ViewTransition name={`day-${dateKey}`}>
                    <Link
                      href={`?view=dia&date=${dateKey}`}
                      onClick={(e) => e.stopPropagation()}
                      className={isToday ? "animate-today-pulse" : undefined}
                      style={{
                        width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "50%", textDecoration: "none",
                        background: isToday ? "oklch(0.66 0.18 274)" : "transparent",
                        color: isToday ? "#fff" : (i % 7 === 0 ? "oklch(0.60 0.12 30)" : "oklch(0.55 0.02 264)"),
                        fontSize: 12, fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      {day}
                    </Link>
                  </ViewTransition>
                </div>

                {/* Event chips — clique abre popover de editar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {visible.map((ev, idx) => {
                    const tc = TYPE_COLORS[ev.type] ?? TYPE_COLORS.OUTRO;
                    const isDone = ev.status === "CONCLUIDO";
                    const isLost = ev.status === "PERDIDO";
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        title={ev.title}
                        onClick={(e) => openEdit(e, ev)}
                        className="animate-fade-up"
                        style={
                          {
                            "--delay": `${idx * 40}ms`,
                            display: "flex", alignItems: "center", gap: 3, border: "none", cursor: "pointer",
                            background: isDone || isLost ? "oklch(0.18 0.015 264)" : tc.bg,
                            color: isDone || isLost ? "oklch(0.42 0.02 264)" : tc.color,
                            borderRadius: 5, padding: "2px 5px",
                            fontSize: 11, fontWeight: 500, textAlign: "left",
                            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                            opacity: isDone || isLost ? 0.65 : 1,
                          } as React.CSSProperties
                        }
                      >
                        <span style={{ flexShrink: 0, fontSize: 10 }}>{TYPE_ICON[ev.type] ?? "📌"}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                      </button>
                    );
                  })}
                  {overflow > 0 && (
                    <span style={{ fontSize: 10, color: "oklch(0.46 0.02 264)", paddingLeft: 4 }}>
                      +{overflow} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { type: "PRAZO", label: "Prazo" },
          { type: "AUDIENCIA", label: "Audiência" },
          { type: "REUNIAO", label: "Reunião" },
          { type: "OUTRO", label: "Outro" },
        ].map(({ type, label }) => {
          const tc = TYPE_COLORS[type];
          return (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11 }}>{TYPE_ICON[type]}</span>
              <span style={{ fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color, borderRadius: 5, padding: "2px 7px" }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {popover && (
        <EventPopover
          slot={popover}
          cases={cases}
          anchorRef={anchorRef}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
    </ViewTransition>
  );
}
```

- [ ] **Step 2: Nome de transição pareado em `day-view.tsx`**

Reescrever `src/components/agenda/day-view.tsx` completo:

```tsx
"use client";

import { ViewTransition } from "react";
import { TimeGrid } from "@/components/agenda/time-grid";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";
import { dayKey, WEEKDAY_LONG } from "@/lib/agenda-date";

export function DayView({
  day,
  deadlines,
  cases,
}: {
  day: string; // "YYYY-MM-DD"
  deadlines: CalendarDeadline[];
  cases: { id: string; number: string }[];
}) {
  const d = new Date(`${day}T00:00:00.000Z`);
  const todayKey = dayKey(new Date());
  const key = dayKey(d);

  return (
    <ViewTransition name={`day-${key}`}>
      <TimeGrid
        days={[{ key, label: WEEKDAY_LONG[d.getUTCDay()], isToday: key === todayKey }]}
        deadlines={deadlines}
        cases={cases}
      />
    </ViewTransition>
  );
}
```

- [ ] **Step 3: Passar `cases` pro `CalendarView` em `page.tsx`**

Trocar (dentro do `<ViewTransition>` já adicionado na Task 2/3):

```tsx
        {view === "mes" && (
          <CalendarView year={calYear} month={calMonth} deadlines={viewDeadlines} />
        )}
```

por:

```tsx
        {view === "mes" && (
          <CalendarView year={calYear} month={calMonth} deadlines={viewDeadlines} cases={cases} />
        )}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit`
Expected: mesmo erro pré-existente, nenhum erro novo.

Run: `npx eslint src/components/agenda/calendar-view.tsx src/components/agenda/day-view.tsx "src/app/(dashboard)/agenda/page.tsx"`
Expected: sem erros novos.

Manual no browser (`http://localhost:3000/agenda?view=mes`):
1. Clicar em espaço vazio de um dia → popover de **criar** abre ancorado naquela célula; salvar cria o prazo e ele aparece no grid com stagger.
2. Clicar no número do dia → navega (com morph) pra visão Dia daquele dia.
3. Clicar num chip de evento → popover de **editar** abre (não navega mais pra `/agenda/[id]`); salvar atualiza o chip.
4. Dia de hoje pulsa sutilmente.
5. `prefers-reduced-motion` ligado (DevTools → Rendering → Emulate CSS media) → nenhuma das animações acima roda, tudo troca instantâneo.

- [ ] **Step 5: Commit**

```bash
git add src/components/agenda/calendar-view.tsx src/components/agenda/day-view.tsx "src/app/(dashboard)/agenda/page.tsx"
git commit -m "feat(agenda): mes interativo (popover criar/editar, drill-in pro dia)"
```
