import { getRiskLevel, RISK_META } from "@/lib/risk";

interface Props {
  date: Date;
  type: string;
  status: string;
}

export function RiskBadge({ date, type, status }: Props) {
  const level = getRiskLevel(date, type, status);
  if (!level) return null;

  const { label, bg, text, border } = RISK_META[level];

  return (
    <span
      className="inline-flex h-5 items-center rounded-full px-2 text-xs font-medium"
      style={{ background: bg, color: text, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  );
}
