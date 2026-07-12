import { WEEKDAY_LONG } from "@/lib/agenda-date";

/**
 * Formata uma data armazenada (DateTime do Prisma) como data-only em pt-BR.
 * Usa timeZone UTC para evitar o deslocamento de um dia: as datas são gravadas
 * como meia-noite UTC, então a exibição precisa ser interpretada em UTC também.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

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

/** Formata um valor numérico ou Decimal do Prisma como moeda em Real brasileiro. */
export function formatCurrency(amount: number | { toNumber: () => number }): string {
  const value = typeof amount === "number" ? amount : amount.toNumber();
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
