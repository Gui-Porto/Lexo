import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { isPaidPlan, isTrialExpired, daysLeftInTrial, PLAN_LABELS } from "@/lib/billing";

const PLANS = [
  {
    key: "essencial",
    label: "Essencial",
    price: "R$ 79",
    period: "/mês",
    description: "Para escritórios em crescimento",
    priceEnvKey: "STRIPE_PRICE_ESSENCIAL",
    features: [
      { text: "Processos ilimitados", icon: "⚖️" },
      { text: "Agenda e controle de prazos", icon: "📅" },
      { text: "Clientes e contratos", icon: "👥" },
      { text: "Financeiro e relatórios", icon: "💰" },
      { text: "Histórico de atividades", icon: "📋" },
      { text: "Notificações por email", icon: "📧" },
    ],
  },
  {
    key: "pro",
    label: "Pro",
    price: "R$ 149",
    period: "/mês",
    description: "Para escritórios consolidados",
    priceEnvKey: "STRIPE_PRICE_PRO",
    highlight: true,
    features: [
      { text: "Tudo do Essencial", icon: "✅" },
      { text: "Usuários ilimitados", icon: "👨‍💼" },
      { text: "Relatórios avançados", icon: "📊" },
      { text: "Gerador de minutas com IA", icon: "🤖" },
      { text: "Extrator de documentos PDF", icon: "📄" },
      { text: "Suporte prioritário", icon: "⚡" },
    ],
  },
];

const FEATURES_COMPARE = [
  { label: "Processos ilimitados", essencial: true, pro: true },
  { label: "Clientes e contratos", essencial: true, pro: true },
  { label: "Agenda e prazos", essencial: true, pro: true },
  { label: "Financeiro e relatórios", essencial: true, pro: true },
  { label: "Notificações por email", essencial: true, pro: true },
  { label: "Usuários ilimitados", essencial: false, pro: true },
  { label: "Relatórios avançados", essencial: false, pro: true },
  { label: "Gerador de minutas com IA", essencial: false, pro: true },
  { label: "Extrator de PDF com IA", essencial: false, pro: true },
  { label: "Suporte prioritário", essencial: false, pro: true },
];

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { plan: true, trialEndsAt: true, stripeSubscriptionId: true, stripeCustomerId: true },
  });

  const currentPlan = org?.plan ?? "trial";
  const paid = isPaidPlan(currentPlan);
  const expired = isTrialExpired(currentPlan, org?.trialEndsAt ?? null);
  const daysLeft = daysLeftInTrial(org?.trialEndsAt ?? null);
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 900, margin: "0 auto", width: "100%" }}>

      {/* Success banner */}
      {sp.success && (
        <div
          style={{
            background: "linear-gradient(135deg, oklch(0.72 0.15 150 / 15%), oklch(0.155 0.02 264))",
            border: "1px solid oklch(0.72 0.15 150 / 35%)",
            borderRadius: 14,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>🎉</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.85 0.12 145)", margin: 0 }}>
              Assinatura ativada com sucesso!
            </p>
            <p style={{ fontSize: 13, color: "oklch(0.65 0.08 145)", marginTop: 2 }}>
              Obrigado por assinar o Lexo. Todos os recursos Pro estão liberados.
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "oklch(0.66 0.18 274 / 12%)",
            border: "1px solid oklch(0.66 0.18 274 / 25%)",
            borderRadius: 99,
            padding: "5px 14px",
            fontSize: 11,
            fontWeight: 600,
            color: "oklch(0.75 0.14 274)",
            letterSpacing: "0.08em",
            marginBottom: 16,
          }}
        >
          <span>⚡</span> PLANOS E PREÇOS
        </div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "oklch(0.97 0.008 264)",
            letterSpacing: "-0.8px",
            margin: "0 0 12px",
          }}
        >
          Escolha o plano ideal
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, oklch(0.66 0.18 274), oklch(0.72 0.14 300))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            para seu escritório
          </span>
        </h1>
        <p style={{ fontSize: 15, color: "oklch(0.60 0.02 264)", margin: 0 }}>
          Sem taxa de setup. Cancele quando quiser. Suporte incluído.
        </p>
      </div>

      {/* Current plan status */}
      <div
        style={{
          background: paid
            ? "linear-gradient(135deg, oklch(0.66 0.18 274 / 14%), oklch(0.155 0.02 264))"
            : expired
              ? "linear-gradient(135deg, oklch(0.70 0.18 30 / 14%), oklch(0.155 0.02 264))"
              : "oklch(0.155 0.02 264)",
          border: paid
            ? "1px solid oklch(0.66 0.18 274 / 30%)"
            : expired
              ? "1px solid oklch(0.70 0.18 30 / 30%)"
              : "1px solid oklch(1 0 0 / 7%)",
          borderRadius: 14,
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: paid
                ? "linear-gradient(135deg, oklch(0.66 0.18 274), oklch(0.72 0.14 300))"
                : "oklch(0.22 0.02 264)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {paid ? "⚡" : expired ? "⏰" : "🔄"}
          </div>
          <div>
            <p style={{ fontSize: 12, color: "oklch(0.55 0.02 264)", marginBottom: 3 }}>Plano atual</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "oklch(0.95 0.01 264)", margin: 0 }}>
              {PLAN_LABELS[currentPlan] ?? currentPlan}
            </p>
            {!paid && !expired && (
              <p style={{ fontSize: 12, color: "oklch(0.75 0.16 50)", marginTop: 2 }}>
                {daysLeft === 0
                  ? "Expira hoje — escolha um plano para continuar"
                  : `${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restantes no período de teste`}
              </p>
            )}
            {expired && (
              <p style={{ fontSize: 12, color: "oklch(0.70 0.18 30)", marginTop: 2 }}>
                Trial expirado — escolha um plano abaixo para reativar
              </p>
            )}
            {paid && (
              <p style={{ fontSize: 12, color: "oklch(0.72 0.15 150)", marginTop: 2 }}>
                Assinatura ativa · todos os recursos desbloqueados
              </p>
            )}
          </div>
        </div>
        {paid && isAdmin && org?.stripeCustomerId && (
          <form action={createPortalSession}>
            <button
              type="submit"
              style={{
                background: "oklch(0.20 0.018 264)",
                border: "1px solid oklch(1 0 0 / 12%)",
                borderRadius: 10,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 500,
                color: "oklch(0.85 0.01 264)",
                cursor: "pointer",
              }}
            >
              Gerenciar assinatura
            </button>
          </form>
        )}
      </div>

      {/* Plan cards */}
      <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {PLANS.map((plan) => {
          const priceId = process.env[plan.priceEnvKey];
          const isCurrent = currentPlan === plan.key;

          return (
            <div
              key={plan.key}
              style={{
                position: "relative",
                borderRadius: 20,
                padding: "28px 26px",
                display: "flex",
                flexDirection: "column",
                gap: 22,
                background: plan.highlight
                  ? "linear-gradient(165deg, oklch(0.66 0.18 274 / 16%), oklch(0.155 0.02 264) 60%)"
                  : "oklch(0.155 0.02 264)",
                border: plan.highlight
                  ? "1px solid oklch(0.66 0.18 274 / 40%)"
                  : "1px solid oklch(1 0 0 / 8%)",
                boxShadow: plan.highlight
                  ? "0 0 60px oklch(0.66 0.18 274 / 10%)"
                  : "none",
              }}
            >
              {plan.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(90deg, oklch(0.66 0.18 274), oklch(0.55 0.2 290))",
                    borderRadius: "0 0 10px 10px",
                    padding: "4px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  ⭐ MAIS POPULAR
                </div>
              )}

              {/* Plan header */}
              <div style={{ paddingTop: plan.highlight ? 8 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: plan.highlight
                        ? "linear-gradient(135deg, oklch(0.66 0.18 274), oklch(0.72 0.14 300))"
                        : "oklch(0.22 0.02 264)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    {plan.highlight ? "⚡" : "📦"}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: plan.highlight ? "oklch(0.75 0.14 274)" : "oklch(0.55 0.02 264)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                      {plan.label}
                    </p>
                    <p style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", margin: 0 }}>{plan.description}</p>
                  </div>
                  {isCurrent && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        fontWeight: 700,
                        background: "oklch(0.72 0.15 150 / 14%)",
                        color: "oklch(0.72 0.15 150)",
                        border: "1px solid oklch(0.72 0.15 150 / 30%)",
                        borderRadius: 99,
                        padding: "3px 10px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      ATUAL
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 38,
                      fontWeight: 700,
                      color: "oklch(0.97 0.008 264)",
                      letterSpacing: "-1.5px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 14, color: "oklch(0.50 0.02 264)" }}>{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f) => (
                  <li key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: plan.highlight
                          ? "oklch(0.66 0.18 274 / 16%)"
                          : "oklch(0.22 0.02 264)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {f.icon}
                    </span>
                    <span style={{ fontSize: 13, color: "oklch(0.78 0.01 264)" }}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div style={{ marginTop: "auto" }}>
                {isCurrent ? (
                  <div
                    style={{
                      background: "oklch(0.22 0.018 264)",
                      border: "1px solid oklch(1 0 0 / 8%)",
                      borderRadius: 12,
                      padding: "12px 20px",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "oklch(0.55 0.02 264)",
                    }}
                  >
                    Plano atual ✓
                  </div>
                ) : isAdmin && priceId ? (
                  <form action={createCheckoutSession.bind(null, priceId)}>
                    <button
                      type="submit"
                      style={{
                        width: "100%",
                        background: plan.highlight
                          ? "linear-gradient(135deg, oklch(0.66 0.18 274), oklch(0.55 0.2 290))"
                          : "oklch(0.22 0.018 264)",
                        border: plan.highlight ? "none" : "1px solid oklch(1 0 0 / 12%)",
                        borderRadius: 12,
                        padding: "12px 20px",
                        fontSize: 14,
                        fontWeight: 700,
                        color: plan.highlight ? "#fff" : "oklch(0.85 0.01 264)",
                        cursor: "pointer",
                        boxShadow: plan.highlight ? "0 6px 20px oklch(0.66 0.18 274 / 35%)" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {plan.highlight && <span>⚡</span>}
                      Assinar {plan.label}
                    </button>
                  </form>
                ) : (
                  <div
                    style={{
                      background: "oklch(0.18 0.016 264)",
                      border: "1px solid oklch(1 0 0 / 8%)",
                      borderRadius: 12,
                      padding: "12px 20px",
                      textAlign: "center",
                      fontSize: 13,
                      color: "oklch(0.45 0.02 264)",
                    }}
                  >
                    {isAdmin ? "Configure o Stripe para ativar" : "Fale com o administrador"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div
        className="r-tablewrap"
        style={{
          background: "oklch(0.155 0.02 264)",
          border: "1px solid oklch(1 0 0 / 7%)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 24px", borderBottom: "1px solid oklch(1 0 0 / 7%)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "oklch(0.95 0.008 264)", margin: 0 }}>
            Comparação de recursos
          </h3>
        </div>
        <div
          className="r-tablegrid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px 140px",
            gap: 0,
            padding: "10px 24px",
            background: "oklch(0.13 0.018 264)",
            borderBottom: "1px solid oklch(1 0 0 / 7%)",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: "oklch(0.45 0.02 264)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recurso</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "oklch(0.45 0.02 264)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>Essencial</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "oklch(0.66 0.18 274)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>Pro</span>
        </div>
        {FEATURES_COMPARE.map((feat, i) => (
          <div
            key={feat.label}
            className="r-tablegrid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px 140px",
              gap: 0,
              padding: "12px 24px",
              borderBottom: i < FEATURES_COMPARE.length - 1 ? "1px solid oklch(1 0 0 / 5%)" : "none",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "oklch(0.78 0.01 264)" }}>{feat.label}</span>
            <div style={{ textAlign: "center" }}>
              {feat.essencial ? (
                <span style={{ fontSize: 16, color: "oklch(0.72 0.15 150)" }}>✓</span>
              ) : (
                <span style={{ fontSize: 14, color: "oklch(0.35 0.02 264)" }}>—</span>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 16, color: "oklch(0.72 0.15 150)" }}>✓</span>
            </div>
          </div>
        ))}
      </div>

      {/* Trust strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          padding: "20px",
          flexWrap: "wrap",
        }}
      >
        {[
          { icon: "🔒", text: "Pagamento seguro via Stripe" },
          { icon: "🔄", text: "Cancele a qualquer momento" },
          { icon: "🇧🇷", text: "Dados no Brasil · LGPD" },
          { icon: "⚡", text: "Sem fidelidade" },
        ].map((item) => (
          <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{ fontSize: 12, color: "oklch(0.50 0.02 264)" }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
