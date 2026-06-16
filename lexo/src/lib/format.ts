/**
 * Formata uma data armazenada (DateTime do Prisma) como data-only em pt-BR.
 * Usa timeZone UTC para evitar o deslocamento de um dia: as datas são gravadas
 * como meia-noite UTC, então a exibição precisa ser interpretada em UTC também.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** Formata um valor numérico como moeda em Real brasileiro. */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
