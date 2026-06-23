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
    bg: "rgb(248 113 113 / 0.12)",
    text: "#fca5a5",
    border: "rgb(248 113 113 / 0.30)",
  },
  urgente: {
    label: "Urgente",
    bg: "rgb(251 146 60 / 0.12)",
    text: "#fdba74",
    border: "rgb(251 146 60 / 0.30)",
  },
  alto: {
    label: "Alto",
    bg: "rgb(251 191 36 / 0.12)",
    text: "#fcd34d",
    border: "rgb(251 191 36 / 0.30)",
  },
  medio: {
    label: "Médio",
    bg: "rgb(96 165 250 / 0.12)",
    text: "#93c5fd",
    border: "rgb(96 165 250 / 0.30)",
  },
  baixo: {
    label: "Baixo",
    bg: "rgb(52 211 153 / 0.12)",
    text: "#6ee7b7",
    border: "rgb(52 211 153 / 0.30)",
  },
};
