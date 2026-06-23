import Link from "next/link";
import { Sparkles, Lock } from "lucide-react";

interface PlanGateProps {
  feature: string;
  description: string;
  requiredPlan?: "essencial" | "pro";
}

export function PlanGate({ feature, description, requiredPlan = "pro" }: PlanGateProps) {
  const planLabel = requiredPlan === "pro" ? "Pro" : "Essencial";
  const AC = "oklch(0.66 0.18 274)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 32px",
        gap: 24,
        textAlign: "center",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Ícone */}
      <div style={{ position: "relative", display: "inline-flex" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, oklch(0.66 0.18 274 / 18%), oklch(0.55 0.20 290 / 12%))",
            border: "1px solid oklch(0.66 0.18 274 / 30%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px oklch(0.66 0.18 274 / 15%)",
          }}
        >
          <Sparkles size={30} color={AC} />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: -6,
            right: -6,
            width: 26,
            height: 26,
            borderRadius: 8,
            background: "oklch(0.13 0.018 264)",
            border: "1px solid oklch(1 0 0 / 10%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={13} color="oklch(0.55 0.02 264)" />
        </div>
      </div>

      {/* Texto */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "oklch(0.66 0.18 274 / 10%)",
            border: "1px solid oklch(0.66 0.18 274 / 22%)",
            borderRadius: 99,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 700,
            color: "oklch(0.72 0.12 274)",
            letterSpacing: "0.07em",
            marginBottom: 4,
          }}
        >
          ⚡ PLANO {planLabel.toUpperCase()} NECESSÁRIO
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "oklch(0.95 0.008 264)",
            letterSpacing: "-0.4px",
            margin: 0,
          }}
        >
          {feature}
        </h2>
        <p style={{ fontSize: 14, color: "oklch(0.55 0.02 264)", lineHeight: 1.6, margin: 0 }}>
          {description}
        </p>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
        <Link
          href="/planos"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "linear-gradient(135deg, oklch(0.66 0.18 274), oklch(0.55 0.2 290))",
            color: "#fff",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 6px 20px oklch(0.66 0.18 274 / 35%)",
          }}
        >
          ⚡ Ver planos e fazer upgrade
        </Link>
        <p style={{ fontSize: 12, color: "oklch(0.40 0.02 264)", margin: 0 }}>
          Sem fidelidade · cancele quando quiser
        </p>
      </div>
    </div>
  );
}
