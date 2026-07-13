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
