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
    bg: "rgb(225 29 72 / 0.12)",
    text: "#be123c",
    border: "rgb(225 29 72 / 0.30)",
  },
  urgente: {
    label: "Urgente",
    bg: "rgb(234 88 12 / 0.12)",
    text: "#c2410c",
    border: "rgb(234 88 12 / 0.30)",
  },
  alto: {
    label: "Alto",
    bg: "rgb(217 119 6 / 0.12)",
    text: "#b45309",
    border: "rgb(217 119 6 / 0.30)",
  },
  medio: {
    label: "Médio",
    bg: "rgb(37 99 235 / 0.12)",
    text: "#1d4ed8",
    border: "rgb(37 99 235 / 0.30)",
  },
  baixo: {
    label: "Baixo",
    bg: "rgb(5 150 105 / 0.12)",
    text: "#047857",
    border: "rgb(5 150 105 / 0.30)",
  },
};
