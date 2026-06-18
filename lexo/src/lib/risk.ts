export type RiskLevel = "critico" | "urgente" | "alto" | "medio" | "baixo";

export function getRiskLevel(
  date: Date,
  type: string,
  status: string
): RiskLevel | null {
  if (status !== "PENDENTE") return null;

  const daysRemaining =
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  // PRAZO and AUDIENCIA carry higher stakes — effective deadline arrives sooner
  const factor = type === "PRAZO" ? 1.5 : type === "AUDIENCIA" ? 1.2 : 1;
  const effective = daysRemaining / factor;

  if (effective <= 1) return "critico";
  if (effective <= 3) return "urgente";
  if (effective <= 7) return "alto";
  if (effective <= 15) return "medio";
  return "baixo";
}

export const RISK_META: Record<
  RiskLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  critico: {
    label: "Crítico",
    bg: "oklch(0.65 0.22 25 / 0.15)",
    text: "oklch(0.82 0.20 25)",
    border: "oklch(0.65 0.22 25 / 0.35)",
  },
  urgente: {
    label: "Urgente",
    bg: "oklch(0.75 0.20 50 / 0.15)",
    text: "oklch(0.84 0.18 50)",
    border: "oklch(0.75 0.20 50 / 0.35)",
  },
  alto: {
    label: "Alto",
    bg: "oklch(0.82 0.18 85 / 0.12)",
    text: "oklch(0.86 0.16 85)",
    border: "oklch(0.82 0.18 85 / 0.30)",
  },
  medio: {
    label: "Médio",
    bg: "oklch(0.65 0.15 230 / 0.12)",
    text: "oklch(0.74 0.14 230)",
    border: "oklch(0.65 0.15 230 / 0.30)",
  },
  baixo: {
    label: "Baixo",
    bg: "oklch(0.65 0.15 145 / 0.12)",
    text: "oklch(0.74 0.14 145)",
    border: "oklch(0.65 0.15 145 / 0.30)",
  },
};
