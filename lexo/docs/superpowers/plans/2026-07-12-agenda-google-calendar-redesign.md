# Redesign da Agenda (Dia/Semana/Mês) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar à página `/agenda` visões Dia / Semana / Mês estilo Google Calendar, com criação/edição rápida clicando num horário, prazos com hora real, e a lista inferior reagrupada por dia.

**Architecture:** `agenda/page.tsx` decide a visão via `?view=`, busca só os dados do período (mês/semana/dia) e da lista paginada por dia, e renderiza um `AgendaHeader` compartilhado (seletor de visão + navegação + "Hoje") acima de `CalendarView` (mês, existente) ou `WeekView`/`DayView` (novos, ambos client components que reusam um `TimeGrid` interno). Clicar num slot vazio ou num evento existente abre `EventPopover` (Base UI Popover ancorado no elemento clicado), que reusa as Server Actions `createDeadline`/`updateDeadline` já existentes.

**Tech Stack:** Next.js 16 App Router, Server Actions + `useActionState`, Prisma (Postgres/Neon), Base UI (`@base-ui/react`) para o novo `Popover`, Tailwind v4 pros formulários, estilo inline oklch (convenção já usada em `calendar-view.tsx`/`page.tsx`) pra grade/header.

## Global Constraints

- Sem dependência nova (spec, seção Arquitetura). `@base-ui/react` já está instalado e já expõe `popover/`.
- Sem endpoint novo — reusa `createDeadline`/`updateDeadline`/`deleteDeadline` de `src/actions/agenda.ts`.
- Sem migration de schema — `Deadline.date` já é `DateTime`.
- Toda query de prazo deve permanecer escopada por `organizationId` (regra multi-tenant do `CLAUDE.md`).
- Convenção existente: datas são gravadas com os componentes UTC representando o "horário de parede" (sem fuso real) — `formatDate()` já força `timeZone: "UTC"` pra evitar off-by-one. Todo código novo usa getters/setters `UTC*` explicitamente, nunca locais, pra não introduzir uma segunda convenção.
- Fora de escopo (não implementar): drag-and-drop, sync bidirecional com Google (webhook), múltiplos calendários, busca global, atalhos de teclado.

---

## Task 1: Helpers de data/hora compartilhados

**Files:**
- Create: `src/lib/agenda-date.ts`
- Modify: `src/lib/format.ts`

**Interfaces:**
- Produces (usado por todas as tasks seguintes):
  - `MONTH_NAMES: string[]`, `DAY_NAMES_SHORT: string[]`, `WEEKDAY_LONG: string[]`
  - `dayKey(date: Date): string` → `"YYYY-MM-DD"` (UTC)
  - `startOfDayUTC(date: Date): Date`
  - `startOfWeekUTC(date: Date): Date` (domingo 00:00 UTC)
  - `addDaysUTC(date: Date, days: number): Date`
  - `formatDateParam(date: Date): string` (alias de `dayKey`, usado em querystring)
  - `parseDateParam(param: string | undefined, fallback: Date): Date`
  - `isAllDayUTC(date: Date): boolean`
  - `combineDateTimeUTC(dateStr: string, timeStr?: string): Date`
  - `dateInputValue(date: Date): string` (pra `<input type="date">`)
  - `timeInputValue(date: Date): string` (pra `<input type="time">`; `""` quando dia inteiro)
  - `formatTime(date: Date | string): string` e `formatRelativeDay(date: Date | string, today: Date): string` em `format.ts`

- [ ] **Step 1: Criar `src/lib/agenda-date.ts`**

```ts
export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const DAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAY_LONG = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

/** Chave "YYYY-MM-DD" em UTC — usada pra agrupar prazos por dia. */
export function dayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Meia-noite UTC do dia de `date` (zera hora/minuto/segundo/ms). */
export function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Domingo 00:00 UTC da semana que contém `date`. */
export function startOfWeekUTC(date: Date): Date {
  const d = startOfDayUTC(date);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}

export function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** "YYYY-MM-DD" pra usar em querystring (?date=). */
export function formatDateParam(date: Date): string {
  return dayKey(date);
}

/** Parseia "?date=YYYY-MM-DD"; usa meia-noite UTC de `fallback` se ausente/inválido. */
export function parseDateParam(param: string | undefined, fallback: Date): Date {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    return new Date(`${param}T00:00:00.000Z`);
  }
  return startOfDayUTC(fallback);
}

/** Convenção do projeto: hora UTC 00:00 = prazo "dia inteiro". */
export function isAllDayUTC(date: Date): boolean {
  return date.getUTCHours() === 0 && date.getUTCMinutes() === 0;
}

/** Combina "YYYY-MM-DD" + "HH:mm" (opcional) num Date em UTC. Hora ausente/inválida = dia inteiro. */
export function combineDateTimeUTC(dateStr: string, timeStr?: string): Date {
  const time = timeStr && /^\d{2}:\d{2}$/.test(timeStr) ? timeStr : "00:00";
  return new Date(`${dateStr}T${time}:00.000Z`);
}

/** "YYYY-MM-DD" pra <input type="date"> a partir de um DateTime UTC. */
export function dateInputValue(date: Date): string {
  return dayKey(date);
}

/** "HH:mm" pra <input type="time">; "" quando o prazo é dia inteiro. */
export function timeInputValue(date: Date): string {
  if (isAllDayUTC(date)) return "";
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}
```

- [ ] **Step 2: Adicionar `formatTime` e `formatRelativeDay` em `src/lib/format.ts`**

Adicionar ao final do arquivo (depois de `formatCurrency`):

```ts
import { WEEKDAY_LONG } from "@/lib/agenda-date";

/** Formata a hora (HH:mm) de um DateTime em UTC — mesma convenção de formatDate. */
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("pt-BR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Cabeçalho relativo pra listas agrupadas por dia: "Hoje", "Amanhã" ou "Segunda-feira, 14/07/2026". */
export function formatRelativeDay(date: Date | string, today: Date): string {
  const d = new Date(date);
  const dKey = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  const todayKey = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;
  if (dKey === todayKey) return "Hoje";

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowKey = `${tomorrow.getUTCFullYear()}-${tomorrow.getUTCMonth()}-${tomorrow.getUTCDate()}`;
  if (dKey === tomorrowKey) return "Amanhã";

  return `${WEEKDAY_LONG[d.getUTCDay()]}, ${formatDate(d)}`;
}
```

Mover o `import` pro topo do arquivo (junto de qualquer import futuro) em vez de inline — `src/lib/format.ts` hoje não tem imports, então basta adicionar a linha `import { WEEKDAY_LONG } from "@/lib/agenda-date";` como primeira linha do arquivo.

- [ ] **Step 3: Verificação rápida (sem framework de teste no projeto)**

Criar um script descartável e rodar com `tsx` (já é devDependency):

```bash
cd lexo
cat > /tmp/check-agenda-date.ts <<'EOF'
import assert from "node:assert";
import {
  dayKey, startOfWeekUTC, addDaysUTC, parseDateParam,
  isAllDayUTC, combineDateTimeUTC, timeInputValue,
} from "./src/lib/agenda-date";

assert.strictEqual(dayKey(new Date("2026-07-13T15:30:00.000Z")), "2026-07-13");
assert.strictEqual(dayKey(startOfWeekUTC(new Date("2026-07-15T00:00:00.000Z"))), "2026-07-12"); // domingo
assert.strictEqual(dayKey(addDaysUTC(new Date("2026-07-13T00:00:00.000Z"), 7)), "2026-07-20");
assert.strictEqual(dayKey(parseDateParam(undefined, new Date("2026-07-13T23:00:00.000Z"))), "2026-07-13");
assert.strictEqual(isAllDayUTC(new Date("2026-07-13T00:00:00.000Z")), true);
assert.strictEqual(isAllDayUTC(new Date("2026-07-13T14:00:00.000Z")), false);
assert.strictEqual(combineDateTimeUTC("2026-07-13", "14:30").toISOString(), "2026-07-13T14:30:00.000Z");
assert.strictEqual(combineDateTimeUTC("2026-07-13").toISOString(), "2026-07-13T00:00:00.000Z");
assert.strictEqual(timeInputValue(new Date("2026-07-13T00:00:00.000Z")), "");
assert.strictEqual(timeInputValue(new Date("2026-07-13T14:05:00.000Z")), "14:05");
console.log("agenda-date.ts OK");
EOF
npx tsx /tmp/check-agenda-date.ts
```

Expected: `agenda-date.ts OK` sem erros de assert. Apagar o script depois (`rm /tmp/check-agenda-date.ts`).

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: sem erros novos.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agenda-date.ts src/lib/format.ts
git commit -m "feat(agenda): helpers de data/hora pra visões Dia/Semana/Mês"
```

---

## Task 2: Primitivo `Popover` (Base UI)

**Files:**
- Create: `src/components/ui/popover.tsx`

**Interfaces:**
- Produces: `Popover`, `PopoverPortal`, `PopoverPositioner`, `PopoverPopup`, `PopoverClose`, `PopoverTitle` — mesmo padrão de `src/components/ui/dialog.tsx`, usados pelo `EventPopover` (Task 7).
- Consumes: `@base-ui/react/popover` (já em `node_modules`, confirmado: `Root`, `Portal`, `Positioner` com prop `anchor?: Element | React.RefObject<Element | null> | ...`, `Popup`, `Close`, `Title`).

- [ ] **Step 1: Criar `src/components/ui/popover.tsx`**

```tsx
"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

function PopoverPositioner({
  className,
  sideOffset = 6,
  ...props
}: PopoverPrimitive.Positioner.Props) {
  return (
    <PopoverPrimitive.Positioner
      data-slot="popover-positioner"
      sideOffset={sideOffset}
      className={cn("isolate z-50", className)}
      {...props}
    />
  )
}

function PopoverPopup({ className, ...props }: PopoverPrimitive.Popup.Props) {
  return (
    <PopoverPrimitive.Popup
      data-slot="popover-content"
      className={cn(
        "w-72 origin-(--transform-origin) rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      {...props}
    />
  )
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-heading text-sm leading-none font-medium", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverPortal,
  PopoverPositioner,
  PopoverPopup,
  PopoverClose,
  PopoverTitle,
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros (confirma que os tipos de `@base-ui/react/popover` batem com o uso acima).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/popover.tsx
git commit -m "feat(ui): adiciona primitivo Popover (Base UI) pro event-popover da agenda"
```

---

## Task 3: Horário no prazo (schema/actions/form)

Decisão #2 do spec — `Deadline.date` passa a carregar hora real; `00:00` continua significando "dia inteiro".

**Files:**
- Modify: `src/actions/agenda.ts`
- Modify: `src/components/agenda/deadline-form.tsx`
- Modify: `src/app/(dashboard)/agenda/[id]/page.tsx`

**Interfaces:**
- Consumes: `combineDateTimeUTC`, `dateInputValue`, `timeInputValue` de `src/lib/agenda-date.ts` (Task 1).
- Produces: `createDeadline`/`updateDeadline` continuam com a mesma assinatura pública, só passam a aceitar um campo `time` opcional em `formData`.

- [ ] **Step 1: Atualizar schema e combinação de data+hora em `src/actions/agenda.ts`**

No topo do arquivo, adicionar import:

```ts
import { combineDateTimeUTC } from "@/lib/agenda-date";
```

Substituir o schema (linhas 12-18):

```ts
const deadlineSchema = z.object({
  caseId:      z.string().min(1, "Selecione um processo"),
  title:       z.string().min(1, "Título é obrigatório"),
  type:        z.enum(["PRAZO", "AUDIENCIA", "REUNIAO", "OUTRO"]),
  date:        z.string().min(1, "Data é obrigatória"),
  time:        z.string().optional(),
  description: z.string().optional(),
});
```

Em `createDeadline`, no parse do formData (linhas 36-42), adicionar `time`:

```ts
  const parsed = deadlineSchema.safeParse({
    caseId:      formData.get("caseId"),
    title:       formData.get("title"),
    type:        formData.get("type") ?? "PRAZO",
    date:        formData.get("date"),
    time:        formData.get("time") || undefined,
    description: formData.get("description") || undefined,
  });
```

Logo depois da validação de `ownCase` (antes do `try` do `db.deadline.create`), calcular a data combinada uma vez e reusar no `create` e no sync do Google:

```ts
  const deadlineDate = combineDateTimeUTC(parsed.data.date, parsed.data.time);

  let created: { id: string };
  try {
    created = await db.deadline.create({
      data: {
        caseId:      parsed.data.caseId,
        title:       parsed.data.title,
        type:        parsed.data.type,
        description: parsed.data.description,
        date:        deadlineDate,
        organizationId: session.user.organizationId,
      },
      select: { id: true },
    });
  } catch (e) {
    console.error("[agenda] erro ao salvar prazo:", e);
    return { error: "Erro ao salvar prazo. Tente novamente." };
  }
```

E no bloco de sync do Google logo abaixo, trocar `date: new Date(parsed.data.date)` por `date: deadlineDate`:

```ts
  const refreshToken = await getUserGoogleToken(session.user.id);
  if (refreshToken) {
    const eventId = await syncDeadlineToGoogle(refreshToken, {
      id:          created.id,
      title:       parsed.data.title,
      type:        parsed.data.type,
      date:        deadlineDate,
      description: parsed.data.description,
    });
    if (eventId) {
      await db.deadline.update({
        where: { id: created.id },
        data: { googleEventId: eventId },
      });
    }
  }
```

Repetir o mesmo padrão em `updateDeadline`: adicionar `time` no parse, calcular `const deadlineDate = combineDateTimeUTC(parsed.data.date, parsed.data.time);` antes do `try` do `updateMany`, usar `date: deadlineDate` no `data` do `updateMany`, e `date: deadlineDate` no `syncDeadlineToGoogle`.

- [ ] **Step 2: Adicionar campo Hora em `src/components/agenda/deadline-form.tsx`**

Atualizar o tipo `DeadlineFormValues` (linha 21-27):

```ts
type DeadlineFormValues = {
  caseId?: string;
  title: string;
  type: string;
  date: string;
  time?: string;
  description: string | null;
};
```

Substituir o bloco do campo Data (linhas 86-89) por Data + Hora lado a lado:

```tsx
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" defaultValue={defaultValues?.date} required />
              </div>
              <div className="w-32 space-y-2">
                <Label htmlFor="time">
                  Hora <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input id="time" name="time" type="time" defaultValue={defaultValues?.time ?? ""} />
              </div>
            </div>
```

- [ ] **Step 3: Separar data/hora ao editar em `src/app/(dashboard)/agenda/[id]/page.tsx`**

Adicionar import:

```ts
import { dateInputValue, timeInputValue } from "@/lib/agenda-date";
```

Substituir `defaultValues` (linhas 45-51):

```tsx
        defaultValues={{
          caseId: deadline.caseId ?? undefined,
          title: deadline.title,
          type: deadline.type,
          date: dateInputValue(deadline.date),
          time: timeInputValue(deadline.date),
          description: deadline.description,
        }}
```

- [ ] **Step 4: Verificação manual**

Run: `npm run dev` (na pasta `lexo/`).
1. Abrir `/agenda/novo`, criar um prazo com Hora = `14:30`. Confirmar redirect com toast de sucesso.
2. Abrir esse prazo em `/agenda/[id]`, confirmar que o campo Hora mostra `14:30`.
3. Criar outro prazo sem preencher Hora. Editar — confirmar que o campo Hora aparece vazio (dia inteiro).

Run: `npx tsc --noEmit` e `npm run lint` — expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/actions/agenda.ts src/components/agenda/deadline-form.tsx "src/app/(dashboard)/agenda/[id]/page.tsx"
git commit -m "feat(agenda): campo de hora opcional no prazo (dia inteiro quando vazio)"
```

---

## Task 4: Sync com Google respeita horário

Decisão #6 do spec — efeito colateral direto em `syncDeadlineToGoogle`, sem feature nova.

**Files:**
- Modify: `src/lib/google-calendar.ts`

**Interfaces:**
- Consumes: `isAllDayUTC` de `src/lib/agenda-date.ts` (Task 1).

- [ ] **Step 1: Atualizar `syncDeadlineToGoogle`**

Adicionar import no topo:

```ts
import { isAllDayUTC } from "@/lib/agenda-date";
```

Substituir a construção do `event` dentro de `syncDeadlineToGoogle` (linhas 52-58 do arquivo original):

```ts
    const allDay = isAllDayUTC(deadline.date);
    const dateStr = deadline.date.toISOString().split("T")[0];
    // ponytail: sem campo de duração no schema; evento com hora usa 1h fixa como padrão.
    const event = allDay
      ? {
          summary: `[${TYPE_LABEL[deadline.type] ?? "Prazo"}] ${deadline.title}`,
          description: deadline.description ?? "",
          start: { date: dateStr },
          end:   { date: dateStr },
        }
      : {
          summary: `[${TYPE_LABEL[deadline.type] ?? "Prazo"}] ${deadline.title}`,
          description: deadline.description ?? "",
          start: { dateTime: deadline.date.toISOString(), timeZone: "UTC" },
          end:   { dateTime: new Date(deadline.date.getTime() + 60 * 60 * 1000).toISOString(), timeZone: "UTC" },
        };
```

O restante da função (`if (deadline.googleEventId) { ... } / calendar.events.insert(...)`) permanece igual, apenas usando esse `event`.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros.

- [ ] **Step 3: Verificação manual (requer conta Google conectada)**

Se houver uma conta de teste com Google Calendar conectado (`/agenda`, ver botão de conectar): criar um prazo com hora, confirmar no Google Calendar que o evento aparece como horário marcado (não dia inteiro); criar um prazo sem hora, confirmar que continua como evento de dia inteiro. Se não houver conta de teste disponível neste ambiente, documentar como pendente de validação manual — não é bloqueante pro resto do plano (a função já tinha fallback `try/catch` que não quebra o fluxo de criação do prazo).

- [ ] **Step 4: Commit**

```bash
git add src/lib/google-calendar.ts
git commit -m "fix(google-calendar): prazo com hora vira evento com horário, não dia inteiro"
```

---

## Task 5: Header da agenda (seletor de visão + navegação + Hoje)

Decisão #1 do spec. `page.tsx` passa a decidir a visão (`?view=`) e o período (`?month=` pro mês, `?date=` pra semana/dia); `AgendaHeader` fica em cima de qualquer visão; `CalendarView` perde a navegação própria (sobe pro header).

**Files:**
- Create: `src/components/agenda/agenda-header.tsx`
- Modify: `src/components/agenda/calendar-view.tsx`
- Modify: `src/app/(dashboard)/agenda/page.tsx`

**Interfaces:**
- Produces: `AgendaHeader` (props abaixo), `type AgendaView = "dia" | "semana" | "mes"`.
- Consumes: `MONTH_NAMES`, `WEEKDAY_LONG`, `dayKey`, `startOfDayUTC`, `startOfWeekUTC`, `addDaysUTC`, `formatDateParam`, `parseDateParam` de `src/lib/agenda-date.ts`.
- `CalendarView` passa a exportar `CalendarDeadline` com campos extras (`description`, `caseId`) — usados pelas Tasks 6/7 pro popover de edição.

- [ ] **Step 1: Criar `src/components/agenda/agenda-header.tsx`**

```tsx
import Link from "next/link";
import { CalendarDays } from "lucide-react";

export type AgendaView = "dia" | "semana" | "mes";

const VIEWS: { value: AgendaView; label: string }[] = [
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
        <Link href={prevHref} style={navBtnStyle} aria-label="Anterior">‹</Link>
        <Link href={nextHref} style={navBtnStyle} aria-label="Próximo">›</Link>
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
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            href={viewHref(v.value)}
            style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
              textDecoration: "none",
              background: view === v.value ? "oklch(0.66 0.18 274)" : "transparent",
              color: view === v.value ? "#fff" : "oklch(0.60 0.02 264)",
            }}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Remover a navegação embutida de `src/components/agenda/calendar-view.tsx`**

Substituir o arquivo inteiro por esta versão (mesma grade/legenda, sem o bloco "Month navigation" e sem a prop `currentMonthParam`):

```tsx
import Link from "next/link";

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
  );
}
```

- [ ] **Step 3: Orquestrar visão/período em `src/app/(dashboard)/agenda/page.tsx`**

Adicionar imports (junto dos existentes):

```ts
import { AgendaHeader, type AgendaView } from "@/components/agenda/agenda-header";
import {
  MONTH_NAMES, WEEKDAY_LONG, addDaysUTC, dayKey,
  formatDateParam, parseDateParam, startOfDayUTC, startOfWeekUTC,
} from "@/lib/agenda-date";
```

Atualizar a assinatura de `searchParams` pra incluir `view` e `date`:

```ts
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string; month?: string; view?: string; date?: string }>;
```

E `const { q, status, type, page: pageStr, month: monthStr, view: viewStr, date: dateStr } = sp;`.

Logo depois do bloco que calcula `calYear`/`calMonth`/`calMonthParam` (o `if (monthStr && ...)` existente, mantido sem alteração), adicionar o cálculo de visão/período — isso substitui a query antiga de `calendarDeadlines` (linhas 89-96 do arquivo original) e o uso de `<CalendarView ... currentMonthParam={calMonthParam} />` mais abaixo:

```ts
  // Visão ativa e período de dados
  const view: AgendaView = viewStr === "dia" || viewStr === "semana" ? viewStr : "mes";
  const todayUTC = startOfDayUTC(now);
  const nowMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const pivotDate = parseDateParam(dateStr, now);
  const weekStart = startOfWeekUTC(pivotDate);
  const dayStart  = startOfDayUTC(pivotDate);

  let rangeStart: Date;
  let rangeEnd: Date;
  let headerLabel: string;
  let prevHref: string;
  let nextHref: string;
  let todayHref: string;
  let isCurrentPeriod: boolean;

  if (view === "semana") {
    rangeStart = weekStart;
    rangeEnd = new Date(addDaysUTC(weekStart, 7).getTime() - 1);
    const weekEnd = addDaysUTC(weekStart, 6);
    headerLabel = weekStart.getUTCMonth() === weekEnd.getUTCMonth()
      ? `${weekStart.getUTCDate()}–${weekEnd.getUTCDate()} de ${MONTH_NAMES[weekStart.getUTCMonth()]} ${weekStart.getUTCFullYear()}`
      : `${weekStart.getUTCDate()} de ${MONTH_NAMES[weekStart.getUTCMonth()]} – ${weekEnd.getUTCDate()} de ${MONTH_NAMES[weekEnd.getUTCMonth()]} ${weekEnd.getUTCFullYear()}`;
    prevHref = `?view=semana&date=${formatDateParam(addDaysUTC(weekStart, -7))}`;
    nextHref = `?view=semana&date=${formatDateParam(addDaysUTC(weekStart, 7))}`;
    todayHref = `?view=semana`;
    isCurrentPeriod = dayKey(weekStart) === dayKey(startOfWeekUTC(now));
  } else if (view === "dia") {
    rangeStart = dayStart;
    rangeEnd = new Date(addDaysUTC(dayStart, 1).getTime() - 1);
    headerLabel = `${WEEKDAY_LONG[dayStart.getUTCDay()]}, ${dayStart.getUTCDate()} de ${MONTH_NAMES[dayStart.getUTCMonth()]}`;
    prevHref = `?view=dia&date=${formatDateParam(addDaysUTC(dayStart, -1))}`;
    nextHref = `?view=dia&date=${formatDateParam(addDaysUTC(dayStart, 1))}`;
    todayHref = `?view=dia`;
    isCurrentPeriod = dayKey(dayStart) === dayKey(todayUTC);
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

  const viewDeadlines = await db.deadline.findMany({
    where: { organizationId: orgId, date: { gte: rangeStart, lte: rangeEnd } },
    select: { id: true, title: true, date: true, type: true, status: true, description: true, caseId: true },
    orderBy: { date: "asc" },
  });

  const cases = await db.case.findMany({
    where: { organizationId: orgId },
    select: { id: true, number: true },
    orderBy: { number: "asc" },
  });
```

Remover a query antiga de `calendarDeadlines` (o bloco `// Calendário: prazos do mês` com `monthStart`/`monthEnd`/`calendarDeadlines` — **manter** `monthStart`/`monthEnd`, só remover o `db.deadline.findMany` que populava `calendarDeadlines`, já que `viewDeadlines` cobre os três casos agora).

No JSX, substituir o bloco `{/* ── Calendário (visão principal) ── */} <CalendarView .../>` por:

```tsx
      <AgendaHeader
        view={view}
        label={headerLabel}
        prevHref={prevHref}
        nextHref={nextHref}
        todayHref={todayHref}
        isCurrentPeriod={isCurrentPeriod}
        viewHref={(v) => `?view=${v}`}
      />

      {view === "mes" && (
        <CalendarView year={calYear} month={calMonth} deadlines={viewDeadlines} />
      )}
```

(As visões `semana`/`dia` entram na Task 6 — por enquanto, pra manter o app funcionando a cada task, adicionar um placeholder simples nessas duas branches; será substituído na Task 6):

```tsx
      {view !== "mes" && (
        <p style={{ fontSize: 13, color: "oklch(0.50 0.02 264)" }}>
          Visão {view} — implementada na Task 6.
        </p>
      )}
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros (confirma que nenhum outro arquivo ainda referencia `currentMonthParam`).

- [ ] **Step 5: Verificação manual**

Run: `npm run dev`.
1. Abrir `/agenda` — visão Mês deve continuar idêntica (grade + legenda), agora com o seletor Dia/Semana/Mês e "Hoje" no header acima.
2. Clicar `‹`/`›` — mês navega, "Hoje" fica ativo/inativo corretamente.
3. Clicar em "Semana" e "Dia" no seletor — devem navegar pra `?view=semana`/`?view=dia` sem erro (mostrando o placeholder por enquanto).

- [ ] **Step 6: Commit**

```bash
git add src/components/agenda/agenda-header.tsx src/components/agenda/calendar-view.tsx "src/app/(dashboard)/agenda/page.tsx"
git commit -m "feat(agenda): header com seletor Dia/Semana/Mês e botão Hoje redesenhado"
```

---

## Task 6: Grade de horas — Semana e Dia

Decisão #3 do spec.

**Files:**
- Create: `src/components/agenda/time-grid.tsx`
- Create: `src/components/agenda/week-view.tsx`
- Create: `src/components/agenda/day-view.tsx`
- Modify: `src/app/(dashboard)/agenda/page.tsx`

**Interfaces:**
- Consumes: `CalendarDeadline` de `calendar-view.tsx` (Task 5); `dayKey`, `addDaysUTC`, `DAY_NAMES_SHORT`, `WEEKDAY_LONG`, `isAllDayUTC` de `agenda-date.ts`; `formatTime` de `format.ts`.
- Produces: `TimeGrid` (usado só por `WeekView`/`DayView`), `WeekView`, `DayView`. `TimeGrid` abre `EventPopover` (Task 7) — nesta task, deixar o clique no slot já preparado (estado `popover`), mas o `EventPopover` só existe na Task 7, então o import fica comentado/o componente é criado como stub mínimo aqui e substituído na Task 7. Pra evitar retrabalho, esta task já importa `EventPopover` do caminho final (`@/components/agenda/event-popover`) — o arquivo será criado na Task 7, então a Task 6 sozinha não compila isoladamente; execute Task 6 e Task 7 em sequência antes de rodar `tsc`/`lint` (ou crie `event-popover.tsx` como stub — ver Step 4 abaixo — e a Task 7 substitui o conteúdo).

- [ ] **Step 1: Criar `src/components/agenda/time-grid.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import { formatTime } from "@/lib/format";
import { dayKey, isAllDayUTC } from "@/lib/agenda-date";
import { EventPopover, type PopoverSlot } from "@/components/agenda/event-popover";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06h..22h
const ROW_HEIGHT = 48; // px por hora

export type DayColumn = {
  key: string;   // "YYYY-MM-DD"
  label: string;
  isToday: boolean;
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PRAZO:    { bg: "oklch(0.66 0.18 274 / 22%)", color: "oklch(0.80 0.14 274)" },
  AUDIENCIA:{ bg: "oklch(0.65 0.15 200 / 22%)", color: "oklch(0.78 0.13 200)" },
  REUNIAO:  { bg: "oklch(0.72 0.15 150 / 22%)", color: "oklch(0.78 0.13 150)" },
  OUTRO:    { bg: "oklch(0.45 0.02 264 / 28%)", color: "oklch(0.65 0.02 264)" },
};
const TYPE_ICON: Record<string, string> = { PRAZO: "⏰", AUDIENCIA: "⚖️", REUNIAO: "🤝", OUTRO: "📌" };

export function TimeGrid({
  days,
  deadlines,
  cases,
}: {
  days: DayColumn[];
  deadlines: CalendarDeadline[];
  cases: { id: string; number: string }[];
}) {
  const [popover, setPopover] = useState<PopoverSlot | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  const byDay = new Map<string, CalendarDeadline[]>();
  for (const d of deadlines) {
    const k = dayKey(new Date(d.date));
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(d);
  }

  function openCreate(e: React.MouseEvent<HTMLElement>, dateKey: string, hour: number) {
    anchorRef.current = e.currentTarget;
    setPopover({ mode: "create", dateKey, hour });
  }

  function openEdit(e: React.MouseEvent<HTMLElement>, deadline: CalendarDeadline) {
    e.stopPropagation();
    anchorRef.current = e.currentTarget;
    setPopover({ mode: "edit", deadline });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 16, overflow: "hidden" }}>
      {/* Cabeçalho dos dias */}
      <div style={{ display: "grid", gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, background: "oklch(0.11 0.015 264)", borderBottom: "1px solid oklch(1 0 0 / 7%)" }}>
        <div />
        {days.map((d) => (
          <div key={d.key} style={{ padding: "10px 6px", textAlign: "center", fontSize: 12, fontWeight: 700, color: d.isToday ? "oklch(0.80 0.14 274)" : "oklch(0.60 0.02 264)" }}>
            {d.label}
          </div>
        ))}
      </div>

      {/* Faixa dia inteiro */}
      <div style={{ display: "grid", gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, borderBottom: "1px solid oklch(1 0 0 / 7%)", minHeight: 34 }}>
        <div style={{ fontSize: 10, color: "oklch(0.42 0.02 264)", padding: "6px 6px", textAlign: "right" }}>dia</div>
        {days.map((d) => {
          const items = (byDay.get(d.key) ?? []).filter((ev) => isAllDayUTC(new Date(ev.date)));
          return (
            <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "4px 4px", borderLeft: "1px solid oklch(1 0 0 / 5%)" }}>
              {items.map((ev) => {
                const tc = TYPE_COLORS[ev.type] ?? TYPE_COLORS.OUTRO;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => openEdit(e, ev)}
                    style={{
                      display: "flex", alignItems: "center", gap: 3, border: "none", cursor: "pointer",
                      background: tc.bg, color: tc.color, borderRadius: 5, padding: "2px 5px",
                      fontSize: 11, fontWeight: 500, textAlign: "left",
                      overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}
                  >
                    <span>{TYPE_ICON[ev.type] ?? "📌"}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Grade de horas */}
      <div style={{ display: "grid", gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, maxHeight: 560, overflowY: "auto" }}>
        <div>
          {HOURS.map((h) => (
            <div key={h} style={{ height: ROW_HEIGHT, borderTop: "1px solid oklch(1 0 0 / 5%)", fontSize: 10, color: "oklch(0.42 0.02 264)", textAlign: "right", padding: "2px 6px" }}>
              {String(h).padStart(2, "0")}h
            </div>
          ))}
        </div>

        {days.map((d) => {
          const timed = (byDay.get(d.key) ?? []).filter((ev) => !isAllDayUTC(new Date(ev.date)));
          return (
            <div key={d.key} style={{ position: "relative", borderLeft: "1px solid oklch(1 0 0 / 5%)" }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  onClick={(e) => openCreate(e, d.key, h)}
                  style={{ height: ROW_HEIGHT, borderTop: "1px solid oklch(1 0 0 / 5%)", cursor: "pointer" }}
                />
              ))}
              {timed.map((ev) => {
                const dt = new Date(ev.date);
                const hour = dt.getUTCHours();
                const minute = dt.getUTCMinutes();
                if (hour < HOURS[0] || hour > HOURS[HOURS.length - 1]) return null;
                const top = (hour - HOURS[0]) * ROW_HEIGHT + (minute / 60) * ROW_HEIGHT;
                const tc = TYPE_COLORS[ev.type] ?? TYPE_COLORS.OUTRO;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => openEdit(e, ev)}
                    style={{
                      position: "absolute", left: 2, right: 2, top, height: 26,
                      display: "flex", alignItems: "center", gap: 4, border: "none", cursor: "pointer",
                      background: tc.bg, color: tc.color, borderRadius: 5, padding: "0 5px",
                      fontSize: 11, fontWeight: 500, textAlign: "left", zIndex: 1,
                      overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{formatTime(ev.date)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                  </button>
                );
              })}
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
  );
}
```

- [ ] **Step 2: Criar `src/components/agenda/week-view.tsx`**

```tsx
"use client";

import { TimeGrid } from "@/components/agenda/time-grid";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";
import { addDaysUTC, DAY_NAMES_SHORT, dayKey } from "@/lib/agenda-date";

export function WeekView({
  weekStart,
  deadlines,
  cases,
}: {
  weekStart: string; // "YYYY-MM-DD", domingo
  deadlines: CalendarDeadline[];
  cases: { id: string; number: string }[];
}) {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const todayKey = dayKey(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDaysUTC(start, i);
    const key = dayKey(d);
    return {
      key,
      label: `${DAY_NAMES_SHORT[d.getUTCDay()]} ${d.getUTCDate()}`,
      isToday: key === todayKey,
    };
  });

  return <TimeGrid days={days} deadlines={deadlines} cases={cases} />;
}
```

- [ ] **Step 3: Criar `src/components/agenda/day-view.tsx`**

```tsx
"use client";

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
    <TimeGrid
      days={[{ key, label: WEEKDAY_LONG[d.getUTCDay()], isToday: key === todayKey }]}
      deadlines={deadlines}
      cases={cases}
    />
  );
}
```

- [ ] **Step 4: Stub temporário de `event-popover.tsx` (só pra Task 6 compilar isoladamente)**

Se for executar a Task 6 antes da Task 7, criar `src/components/agenda/event-popover.tsx` com este conteúdo mínimo (a Task 7 substitui o arquivo inteiro):

```tsx
"use client";

import type { CalendarDeadline } from "@/components/agenda/calendar-view";

export type PopoverSlot =
  | { mode: "create"; dateKey: string; hour: number }
  | { mode: "edit"; deadline: CalendarDeadline };

export function EventPopover(_props: {
  slot: PopoverSlot;
  cases: { id: string; number: string }[];
  anchorRef: React.RefObject<Element | null>;
  onClose: () => void;
}) {
  return null;
}
```

- [ ] **Step 5: Ligar `WeekView`/`DayView` em `src/app/(dashboard)/agenda/page.tsx`**

Adicionar imports:

```ts
import { WeekView } from "@/components/agenda/week-view";
import { DayView } from "@/components/agenda/day-view";
```

Substituir o placeholder da Task 5 (`{view !== "mes" && <p>...</p>}`) por:

```tsx
      {view === "semana" && (
        <WeekView weekStart={formatDateParam(weekStart)} deadlines={viewDeadlines} cases={cases} />
      )}
      {view === "dia" && (
        <DayView day={formatDateParam(dayStart)} deadlines={viewDeadlines} cases={cases} />
      )}
```

- [ ] **Step 6: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros.

- [ ] **Step 7: Verificação manual**

Run: `npm run dev`.
1. `/agenda?view=semana` — grade de 7 colunas, horas 06h–22h, prazos existentes aparecem na hora certa (dia inteiro na faixa do topo).
2. `/agenda?view=dia` — mesma grade, 1 coluna.
3. Clicar num slot vazio ou num evento — por enquanto não abre nada (stub), sem erro no console.

- [ ] **Step 8: Commit**

```bash
git add src/components/agenda/time-grid.tsx src/components/agenda/week-view.tsx src/components/agenda/day-view.tsx src/components/agenda/event-popover.tsx "src/app/(dashboard)/agenda/page.tsx"
git commit -m "feat(agenda): grade de horas pras visões Semana e Dia"
```

---

## Task 7: Criar/editar clicando no calendário

Decisão #4 do spec — substitui o stub da Task 6 pelo `EventPopover` real.

**Files:**
- Modify: `src/components/agenda/event-popover.tsx` (substituir o stub)
- Modify: `src/actions/agenda.ts` (campo `returnTo` pra não perder o contexto de visão/período no redirect)

**Interfaces:**
- Consumes: `Popover`/`PopoverPortal`/`PopoverPositioner`/`PopoverPopup`/`PopoverTitle` (Task 2); `createDeadline`/`updateDeadline`/`ActionResult` de `src/actions/agenda.ts`; `dateInputValue`/`timeInputValue` de `agenda-date.ts`.

- [ ] **Step 1: Adicionar `returnTo` opcional nas Server Actions (`src/actions/agenda.ts`)**

O popover fica em `/agenda?view=semana&date=...`; sem isso, o redirect padrão das actions (`/agenda?toast=...`) jogaria o usuário de volta pra visão Mês, o que contraria "sem navegação de página" do spec (decisão #4).

Adicionar `returnTo` ao schema:

```ts
const deadlineSchema = z.object({
  caseId:      z.string().min(1, "Selecione um processo"),
  title:       z.string().min(1, "Título é obrigatório"),
  type:        z.enum(["PRAZO", "AUDIENCIA", "REUNIAO", "OUTRO"]),
  date:        z.string().min(1, "Data é obrigatória"),
  time:        z.string().optional(),
  description: z.string().optional(),
  returnTo:    z.string().optional(),
});
```

Adicionar um helper de sanitização perto do topo do arquivo (evita open-redirect — só aceita caminho relativo começando com `/agenda`):

```ts
function safeReturnTo(value: string | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/agenda")) return null;
  if (value.startsWith("//") || value.includes("://")) return null;
  return value;
}
```

Em `createDeadline`, incluir `returnTo` no parse do formData:

```ts
    returnTo:    formData.get("returnTo") || undefined,
```

E trocar o redirect final:

```ts
  revalidatePath("/agenda");
  redirect(safeReturnTo(parsed.data.returnTo) ?? `/agenda?toast=${encodeURIComponent("Prazo criado com sucesso")}`);
```

Repetir os dois ajustes (parse + redirect) em `updateDeadline`, com a mensagem `"Prazo atualizado com sucesso"`.

- [ ] **Step 2: Substituir `src/components/agenda/event-popover.tsx` pelo componente real**

```tsx
"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverPortal, PopoverPositioner, PopoverPopup, PopoverTitle,
} from "@/components/ui/popover";
import { createDeadline, updateDeadline, type ActionResult } from "@/actions/agenda";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";
import { dateInputValue, timeInputValue } from "@/lib/agenda-date";

const TYPE_OPTIONS = ["PRAZO", "AUDIENCIA", "REUNIAO", "OUTRO"];

export type PopoverSlot =
  | { mode: "create"; dateKey: string; hour: number }
  | { mode: "edit"; deadline: CalendarDeadline };

export function EventPopover({
  slot,
  cases,
  anchorRef,
  onClose,
}: {
  slot: PopoverSlot;
  cases: { id: string; number: string }[];
  anchorRef: React.RefObject<Element | null>;
  onClose: () => void;
}) {
  const searchParams = useSearchParams();
  const isEdit = slot.mode === "edit";
  const action = isEdit ? updateDeadline.bind(null, slot.deadline.id) : createDeadline;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, undefined);

  const successMessage = isEdit ? "Prazo atualizado com sucesso" : "Prazo criado com sucesso";
  const qs = searchParams.toString();
  const returnTo = `/agenda?${qs ? `${qs}&` : ""}toast=${encodeURIComponent(successMessage)}`;

  const defaultDate = isEdit ? dateInputValue(new Date(slot.deadline.date)) : slot.dateKey;
  const defaultTime = isEdit
    ? timeInputValue(new Date(slot.deadline.date))
    : `${String(slot.hour).padStart(2, "0")}:00`;

  return (
    <Popover open onOpenChange={(open) => { if (!open) onClose(); }}>
      <PopoverPortal>
        <PopoverPositioner anchor={anchorRef} side="right" align="start">
          <PopoverPopup>
            <PopoverTitle>{isEdit ? "Editar compromisso" : "Novo compromisso"}</PopoverTitle>
            <form action={formAction} className="mt-3 space-y-3">
              <input type="hidden" name="returnTo" value={returnTo} />

              <div className="space-y-1.5">
                <Label htmlFor="ep-title">Título</Label>
                <Input id="ep-title" name="title" defaultValue={isEdit ? slot.deadline.title : ""} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ep-caseId">Processo</Label>
                <Select name="caseId" defaultValue={isEdit ? (slot.deadline.caseId ?? undefined) : undefined}>
                  <SelectTrigger id="ep-caseId" className="w-full">
                    <SelectValue placeholder="Selecione um processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ep-type">Tipo</Label>
                <Select name="type" defaultValue={isEdit ? slot.deadline.type : "PRAZO"}>
                  <SelectTrigger id="ep-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="ep-date">Data</Label>
                  <Input id="ep-date" name="date" type="date" defaultValue={defaultDate} required />
                </div>
                <div className="w-28 space-y-1.5">
                  <Label htmlFor="ep-time">Hora</Label>
                  <Input id="ep-time" name="time" type="time" defaultValue={defaultTime} />
                </div>
              </div>

              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros. Se `useActionState<ActionResult, FormData>(action, undefined)` reclamar de tipos por causa do `.bind()` condicional, anotar `action` explicitamente como `(prevState: ActionResult, formData: FormData) => Promise<ActionResult>` na declaração do `const action =`.

- [ ] **Step 4: Verificação manual**

Run: `npm run dev`.
1. `/agenda?view=semana` — clicar num slot vazio às 10h de uma terça: popover abre ancorado no slot, com Data/Hora pré-preenchidas (terça, 10:00).
2. Preencher Título + Processo, salvar: popover fecha, volta pra `/agenda?view=semana&date=...` (mesma semana, não pro mês), toast "Prazo criado com sucesso", evento aparece na grade.
3. Clicar no evento recém-criado: popover abre em modo edição com os dados certos; alterar título e salvar; confirma atualização.
4. Clicar fora do popover (sem salvar): popover fecha sem criar nada.
5. Repetir 1-3 em `/agenda?view=dia`.
6. Confirmar que a visão Mês continua abrindo `/agenda/[id]` ao clicar num chip (sem popover) — comportamento inalterado.

- [ ] **Step 5: Commit**

```bash
git add src/components/agenda/event-popover.tsx src/actions/agenda.ts
git commit -m "feat(agenda): criar/editar prazo clicando na grade (popover ancorado)"
```

---

## Task 8: Lista reagrupada por dia + paginação por blocos

Decisão #5 do spec.

**Files:**
- Modify: `src/app/(dashboard)/agenda/page.tsx`

**Interfaces:**
- Consumes: `formatRelativeDay` (Task 1), `dayKey` (Task 1), `Pagination` (existente, já genérico o bastante — `page`/`total`/`pageSize`).

- [ ] **Step 1: Trocar a paginação por item pela paginação por dia**

Remover a constante `const PAGE_SIZE = 20;` e o bloco de query antigo (`listWhere` continua igual; o que muda é como `deadlines`/`total`/`page` são calculados). Substituir o trecho:

```ts
  const [deadlines, total] = await Promise.all([
    db.deadline.findMany({
      where: listWhere,
      include: { case: true },
      orderBy: { date: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.deadline.count({ where: listWhere }),
  ]);
```

por:

```ts
  const DAY_PAGE_SIZE = 5; // ponytail: dias por página; ajustar se ficar apertado na prática

  const matchingDates = await db.deadline.findMany({
    where: listWhere,
    select: { date: true },
    orderBy: { date: "asc" },
  });
  const uniqueDayKeys = Array.from(new Set(matchingDates.map((d) => dayKey(d.date))));
  const totalDays = uniqueDayKeys.length;
  const pageDayKeys = uniqueDayKeys.slice((page - 1) * DAY_PAGE_SIZE, page * DAY_PAGE_SIZE);

  const pageDeadlines = pageDayKeys.length
    ? await db.deadline.findMany({
        where: {
          ...listWhere,
          date: {
            gte: new Date(`${pageDayKeys[0]}T00:00:00.000Z`),
            lte: new Date(new Date(`${pageDayKeys[pageDayKeys.length - 1]}T00:00:00.000Z`).getTime() + 86400000 - 1),
          },
        },
        include: { case: true },
        orderBy: { date: "asc" },
      })
    : [];

  const groupedByDay = pageDayKeys.map((key) => ({
    key,
    date: new Date(`${key}T00:00:00.000Z`),
    items: pageDeadlines.filter((d) => dayKey(d.date) === key),
  }));
```

Adicionar import: `import { dayKey, formatRelativeDay } from "@/lib/agenda-date";` — se `dayKey` já foi importado na Task 5, só adicionar `formatRelativeDay` ao import existente. E `formatRelativeDay` também precisa vir de `@/lib/format` (foi definida lá na Task 1) — corrigir o import pra:

```ts
import { formatDate, formatRelativeDay } from "@/lib/format";
```

(mantendo `dayKey` vindo de `@/lib/agenda-date`, já importado na Task 5).

- [ ] **Step 2: Atualizar o JSX da lista**

Substituir o bloco:

```tsx
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {deadlines.length === 0 && ( ... )}
            {deadlines.map((d) => { ... })}
          </div>
```

por:

```tsx
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {groupedByDay.length === 0 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "60px 32px", gap: 12,
                background: "oklch(0.09 0.015 264)",
                border: "1px dashed oklch(0.25 0.018 264)", borderRadius: 16,
              }}>
                <span style={{ fontSize: 32 }}>📅</span>
                <p style={{ fontSize: 14, color: "oklch(0.50 0.02 264)", margin: 0 }}>Nenhum prazo encontrado.</p>
              </div>
            )}

            {groupedByDay.map((group) => (
              <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "oklch(0.55 0.02 264)", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>
                  {formatRelativeDay(group.date, todayUTC)}
                </h3>

                {group.items.map((d) => {
                  const tc = TYPE_COLORS[d.type] ?? TYPE_COLORS.OUTRO;
                  const isLost = d.status === "PERDIDO";
                  const isDone = d.status === "CONCLUIDO";

                  return (
                    <div
                      key={d.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 16,
                        background: "oklch(0.155 0.02 264)",
                        border: `1px solid ${isLost ? "oklch(0.70 0.18 30 / 20%)" : isDone ? "oklch(0.72 0.15 150 / 15%)" : "oklch(1 0 0 / 7%)"}`,
                        borderRadius: 12, padding: "14px 18px",
                        opacity: isLost ? 0.65 : 1,
                      }}
                    >
                      <DeadlineToggle deadlineId={d.id} completed={isDone} />

                      <span style={{ fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color, borderRadius: 8, padding: "4px 9px", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 13 }}>{TYPE_ICON[d.type] ?? "📌"}</span>
                        {d.type}
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: isDone || isLost ? "oklch(0.55 0.02 264)" : "oklch(0.92 0.01 264)", textDecoration: isLost ? "line-through" : "none", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.title}
                        </p>
                        <p style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", marginTop: 3, fontFamily: "monospace" }}>
                          {d.case ? d.case.number : "Sem processo"} · {formatDate(d.date)}
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        {!isLost && !isDone && <RiskBadge date={d.date} type={d.type} status={d.status} />}
                        {isLost && (
                          <span style={{ fontSize: 11, fontWeight: 600, background: "oklch(0.70 0.18 30 / 14%)", color: "oklch(0.70 0.18 30)", borderRadius: 99, padding: "3px 10px" }}>Perdido</span>
                        )}
                        {isDone && (
                          <span style={{ fontSize: 11, fontWeight: 600, background: "oklch(0.72 0.15 150 / 14%)", color: "oklch(0.72 0.15 150)", borderRadius: 99, padding: "3px 10px" }}>Concluído</span>
                        )}
                        <Link href={`/agenda/${d.id}`} style={{ fontSize: 12, color: "oklch(0.55 0.02 264)", textDecoration: "none", padding: "5px 10px", borderRadius: 7, border: "1px solid oklch(1 0 0 / 8%)" }}>
                          Editar
                        </Link>
                        <DeleteButton action={deleteDeadline.bind(null, d.id)} label="Excluir" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
```

E a `<Pagination>` logo abaixo passa a usar as contagens por dia:

```tsx
          <Suspense>
            <Pagination page={page} total={totalDays} pageSize={DAY_PAGE_SIZE} />
          </Suspense>
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit` e `npm run lint`
Expected: sem erros (confirma que não sobrou nenhuma referência a `deadlines`/`PAGE_SIZE` antigos no arquivo).

- [ ] **Step 3: Verificação manual**

Run: `npm run dev`.
1. `/agenda` — lista embaixo mostra cabeçalhos "Hoje"/"Amanhã"/"Segunda-feira, ..." agrupando os prazos por dia.
2. Com mais de 5 dias distintos com prazos, confirmar que a paginação avança por blocos de dias (não por item).
3. Filtros de status/tipo/busca continuam refletindo na lista agrupada.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/agenda/page.tsx"
git commit -m "feat(agenda): lista reagrupada por dia com paginação por blocos de dias"
```

---

## Task 9: Validação manual completa (Playwright)

Conforme a seção "Validação" do spec — não há suíte automatizada no projeto.

**Files:** nenhum (só validação).

- [ ] **Step 1: Rodar o app e usar a skill `webapp-testing`**

```bash
cd lexo && npm run dev
```

Usando a skill `webapp-testing` (Playwright), roteiro:
1. Troca de visão: Mês → Semana → Dia → Mês, confirmando que a URL (`?view=`) e o header refletem a visão ativa em cada troca.
2. Navegação prev/next em cada visão + botão "Hoje" (deve ficar desabilitado no período atual e navegável fora dele).
3. Clique pra criar num slot vazio (Semana e Dia) — popover abre ancorado, salva, evento aparece na grade, permanece na mesma visão/data.
4. Clique pra editar um bloco existente — popover abre preenchido, altera e salva.
5. Clique num chip da visão Mês — confirma que ainda abre `/agenda/[id]` (sem popover), comportamento inalterado.
6. Prazo criado com hora aparece corretamente posicionado na grade Semana/Dia e mostra a hora no chip.
7. Prazo "dia inteiro" aparece na faixa superior, não na grade de horas.
8. Lista embaixo consistente com os dados do mês/semana/dia visualizados (mesmos prazos, quando aplicável).
9. Paginação da lista avança por blocos de dias corretamente.

- [ ] **Step 2: Registrar resultado**

Se algum item falhar, criar um follow-up (não corrigir "no meio" da validação sem entender a causa raiz — usar `superpowers:systematic-debugging` se for um bug não óbvio).

Nenhum commit nesta task (é só validação).

---

## Self-Review

- **Cobertura do spec:** decisão #1 → Task 5; #2 → Task 3; #3 → Task 6; #4 → Task 7; #5 → Task 8; #6 → Task 4; Validação → Task 9. Arquitetura (`agenda-header`, `week-view`, `day-view`, `event-popover`) → Tasks 5-7, todos os nomes de arquivo batem com a seção Arquitetura do spec.
- **Sem dependência nova:** confirmado — `@base-ui/react/popover` já existe em `node_modules` (Task 2, Step 2 valida via `tsc`).
- **Sem migration:** confirmado — `Deadline.date` já é `DateTime`, nenhuma task toca `schema.prisma`.
- **Consistência de tipos:** `CalendarDeadline` (Task 5) é a única fonte de verdade do shape de prazo usado por `CalendarView`, `TimeGrid`, `WeekView`, `DayView` e `EventPopover` — todas as tasks posteriores importam do mesmo lugar (`@/components/agenda/calendar-view`), evitando duplicação de tipo.
- **`returnTo`:** adicionado na Task 7 especificamente pra cumprir "sem navegação de página" da decisão #4 sem alterar o comportamento de redirect das páginas `/agenda/novo` e `/agenda/[id]`, que não enviam esse campo.
