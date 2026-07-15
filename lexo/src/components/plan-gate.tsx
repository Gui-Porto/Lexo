import Link from "next/link";
import { Sparkles, Lock } from "lucide-react";

interface PlanGateProps {
  feature: string;
  description: string;
  requiredPlan?: "essencial" | "pro";
}

export function PlanGate({ feature, description, requiredPlan = "pro" }: PlanGateProps) {
  const planLabel = requiredPlan === "pro" ? "Pro" : "Essencial";
  const AC = "#cef79e";

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
            background: "#2c3b3c",
            border: "1px solid #cef79e4d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
            background: "#222f30",
            border: "1px solid #4d5757",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={13} color="#93a09f" />
        </div>
      </div>

      {/* Texto */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#cef79e1a",
            border: "1px solid #cef79e38",
            borderRadius: 99,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 700,
            color: "#cef79e",
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
            color: "#ffffff",
            letterSpacing: "-0.4px",
            margin: 0,
          }}
        >
          {feature}
        </h2>
        <p style={{ fontSize: 14, color: "#93a09f", lineHeight: 1.6, margin: 0 }}>
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
            background: "#cef79e",
            color: "#222f30",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ⚡ Ver planos e fazer upgrade
        </Link>
        <p style={{ fontSize: 12, color: "#93a09f", margin: 0 }}>
          Sem fidelidade · cancele quando quiser
        </p>
      </div>
    </div>
  );
}
