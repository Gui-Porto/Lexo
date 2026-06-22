import Link from "next/link";

// ── Design tokens ──────────────────────────────────────────────────────────────
const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";
const F = "'Geist', var(--font-geist), sans-serif";
const FM = "'Geist Mono', var(--font-geist-mono), monospace";

// ── Data ───────────────────────────────────────────────────────────────────────
const features = [
  {
    title: "Gestão de processos",
    novo: false,
    desc: "Todos os processos, partes, prazos e documentos organizados e pesquisáveis em um clique.",
    icon: (
      <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
  {
    title: "Prazos & agenda",
    novo: false,
    desc: "Captura automática de publicações do diário oficial e cálculo de prazos sem digitação manual.",
    icon: (
      <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    title: "Lexo IA",
    novo: true,
    desc: "Resume autos, gera minutas e responde perguntas sobre qualquer processo do escritório.",
    icon: (
      <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z"/>
      </svg>
    ),
  },
  {
    title: "Jurimetria",
    novo: true,
    desc: "Probabilidade de êxito e tempo médio por vara, comarca e relator com base em dados reais.",
    icon: (
      <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>
      </svg>
    ),
  },
  {
    title: "Financeiro & honorários",
    novo: false,
    desc: "Faturamento, timesheet, cobrança recorrente e relatórios de rentabilidade por cliente.",
    icon: (
      <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
      </svg>
    ),
  },
  {
    title: "Portal do cliente",
    novo: true,
    desc: "Seus clientes acompanham processos, documentos e pagamentos por uma área dedicada.",
    icon: (
      <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a6 6 0 0 1 11 0"/>
      </svg>
    ),
  },
];

const stats = [
  { value: "+2.400",  label: "escritórios usando o Lexo" },
  { value: "1,2 mi", label: "processos monitorados" },
  { value: "9h",     label: "economizadas por advogado/semana" },
  { value: "99,9%",  label: "de disponibilidade (SLA)" },
];

const plans = [
  {
    name: "Solo",
    tagline: "Para advogados autônomos começando a organizar a rotina.",
    price: "R$ 79",
    period: "/usuário · mês",
    popular: false,
    accent: false,
    cta: "Começar grátis",
    items: ["Processos e prazos ilimitados", "Agenda e captura de publicações", "Financeiro básico", "Suporte por e-mail"],
  },
  {
    name: "Escritório",
    tagline: "Para equipes que querem IA e colaboração de verdade.",
    price: "R$ 149",
    period: "/usuário · mês",
    popular: true,
    accent: true,
    cta: "Começar teste de 14 dias",
    items: ["Tudo do plano Solo", "Lexo IA & Jurimetria", "Portal do Cliente", "Timesheet e relatórios", "Gestão de usuários e funções"],
  },
  {
    name: "Enterprise",
    tagline: "Para grandes bancas e departamentos jurídicos.",
    price: "Sob consulta",
    period: "",
    popular: false,
    accent: false,
    cta: "Falar com vendas",
    items: ["Tudo do plano Escritório", "SSO e permissões avançadas", "API e integrações dedicadas", "Gerente de conta", "Treinamento e SLA premium"],
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div
      style={{
        fontFamily: F,
        color: "oklch(0.95 0.01 264)",
        background: `radial-gradient(1100px 560px at 78% -8%, color-mix(in oklab,${AC} 14%,transparent), transparent 64%), radial-gradient(900px 500px at 8% 12%, oklch(0.62 0.14 300 / 0.10), transparent 60%), oklch(0.10 0.018 264)`,
        minHeight: "100vh",
        scrollBehavior: "smooth",
      }}
    >
      {/* ── NAV ── */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 20,
          display: "flex", alignItems: "center", gap: 22,
          padding: "15px 40px",
          borderBottom: "1px solid oklch(1 0 0 / 7%)",
          background: "oklch(0.10 0.018 264 / 0.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${AC},${AC2})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: F, fontSize: 17, fontWeight: 800, boxShadow: `0 4px 16px color-mix(in oklab,${AC} 45%,transparent)` }}>L</span>
          <span style={{ fontFamily: F, fontSize: 21, fontWeight: 700, letterSpacing: "-.5px", color: "oklch(0.98 0.008 264)" }}>Lexo</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 14 }}>
          {[["#recursos", "Recursos"], ["#ia", "Lexo IA"], ["#portal", "Portal do Cliente"], ["#precos", "Preços"]].map(([href, label]) => (
            <a key={href} href={href} style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: "oklch(0.66 0.02 264)", padding: "8px 13px", borderRadius: 8, textDecoration: "none" }}>{label}</a>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F, fontSize: 14, fontWeight: 600, color: "oklch(0.92 0.01 264)", border: "1px solid oklch(1 0 0 / 14%)", borderRadius: 10, padding: "9px 16px", background: "oklch(0.155 0.02 264)", textDecoration: "none" }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={8} r={4}/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
            Área do Cliente
          </Link>
          <Link href="/registrar" style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#fff", borderRadius: 10, padding: "10px 17px", background: AC, boxShadow: `0 6px 18px color-mix(in oklab,${AC} 40%,transparent)`, textDecoration: "none" }}>
            Agendar demo
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header style={{ maxWidth: 1180, margin: "0 auto", padding: "78px 40px 60px", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 54, alignItems: "center" }}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FM, fontSize: 12, fontWeight: 500, color: "oklch(0.78 0.06 274)", border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, background: `color-mix(in oklab,${AC} 12%,transparent)`, borderRadius: 999, padding: "6px 13px", letterSpacing: ".3px" }}>
            ✦ Agora com Lexo IA &amp; Jurimetria
          </span>

          <h1 style={{ fontFamily: F, fontSize: 52, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-1.6px", color: "oklch(0.98 0.008 264)", margin: "22px 0 0" }}>
            O sistema que cuida do escritório enquanto você cuida da causa.
          </h1>

          <p style={{ fontFamily: F, fontSize: 18, fontWeight: 400, lineHeight: 1.6, color: "oklch(0.66 0.02 264)", maxWidth: 520, margin: "20px 0 0" }}>
            Processos, prazos, financeiro e relacionamento com o cliente em um só lugar — com inteligência artificial que lê os autos, calcula prazos e antecipa decisões.
          </p>

          <div style={{ display: "flex", gap: 13, marginTop: 32, flexWrap: "wrap" }}>
            <Link href="/registrar" style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: F, fontSize: 15, fontWeight: 600, color: "#fff", borderRadius: 11, padding: "14px 24px", background: AC, boxShadow: `0 10px 26px color-mix(in oklab,${AC} 42%,transparent)`, textDecoration: "none" }}>
              Começar teste de 14 dias
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
            <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: F, fontSize: 15, fontWeight: 600, color: "oklch(0.92 0.01 264)", border: "1px solid oklch(1 0 0 / 16%)", borderRadius: 11, padding: "14px 22px", background: "oklch(0.155 0.02 264)", textDecoration: "none" }}>
              Entrar na Área do Cliente
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 34, fontFamily: F, fontSize: 13, color: "oklch(0.55 0.02 264)" }}>
            {["Sem cartão de crédito", "Migração assistida", "LGPD & ISO 27001"].map((t) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: AC }}>✓</span>{t}</span>
            ))}
          </div>
        </div>

        {/* App mockup */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: "-12% -8% -8% -8%", background: `radial-gradient(closest-side,color-mix(in oklab,${AC} 22%,transparent),transparent)`, filter: "blur(34px)", zIndex: 0 }} />
          <div style={{ position: "relative", zIndex: 1, borderRadius: 16, border: "1px solid oklch(1 0 0 / 10%)", background: "oklch(0.13 0.018 264)", boxShadow: "0 30px 70px oklch(0 0 0 / 0.5)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 14px", borderBottom: "1px solid oklch(1 0 0 / 7%)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "oklch(0.55 0.15 25)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "oklch(0.78 0.14 80)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "oklch(0.72 0.15 150)" }} />
              <span style={{ marginLeft: 10, fontFamily: FM, fontSize: 11, color: "oklch(0.5 0.02 264)" }}>app.lexo.com.br/dashboard</span>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 13 }}>
              <div style={{ display: "flex", gap: 11 }}>
                {[
                  { label: "Processos ativos", value: "148", accent: false },
                  { label: "Prazos urgentes",  value: "9",    accent: true },
                  { label: "Horas faturáveis", value: "312h", accent: false },
                ].map(({ label, value, accent }) => (
                  <div key={label} style={{ flex: 1, background: accent ? `linear-gradient(160deg,color-mix(in oklab,${AC} 20%,oklch(0.16 0.02 264)),oklch(0.16 0.02 264))` : "oklch(0.16 0.02 264)", border: accent ? `1px solid color-mix(in oklab,${AC} 30%,transparent)` : "1px solid oklch(1 0 0 / 7%)", borderRadius: 11, padding: 13 }}>
                    <div style={{ fontFamily: F, fontSize: 10, fontWeight: 500, color: accent ? "oklch(0.74 0.05 274)" : "oklch(0.58 0.02 264)" }}>{label}</div>
                    <div style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: "oklch(0.97 0.008 264)", marginTop: 5 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "oklch(0.16 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 11, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
                  <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "oklch(0.86 0.01 264)" }}>Resumo gerado pela Lexo IA</span>
                  <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 500, color: AC, border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, borderRadius: 99, padding: "2px 8px" }}>IA</span>
                </div>
                {[96, 82, 64].map((w) => <div key={w} style={{ height: 7, borderRadius: 99, background: "oklch(1 0 0 / 9%)", marginBottom: 8, width: `${w}%` }} />)}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", background: "oklch(0.16 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 11, padding: "12px 14px" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "oklch(0.78 0.14 80)", flexShrink: 0 }} />
                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: "oklch(0.82 0.01 264)" }}>Contestação · Proc. 1023-45</span>
                <span style={{ marginLeft: "auto", fontFamily: FM, fontSize: 11, fontWeight: 500, color: "oklch(0.78 0.14 80)" }}>vence em 2 dias</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── TRUST BAR ── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 40px 18px" }}>
        <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 500, color: "oklch(0.45 0.02 264)", textAlign: "center", letterSpacing: "1px", marginBottom: 18 }}>
          USADO POR ESCRITÓRIOS E DEPARTAMENTOS JURÍDICOS EM TODO O BRASIL
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 46, flexWrap: "wrap", opacity: .62 }}>
          {["Andrade Adv.", "Mendonça & Cruz", "Vector Legal", "Bittencourt Adv.", "Núcleo Jurídico"].map((n) => (
            <span key={n} style={{ fontFamily: F, fontSize: 19, fontWeight: 700, color: "oklch(0.7 0.02 264)", letterSpacing: "-.5px" }}>{n}</span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="recursos" style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 40px 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
          <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 500, color: AC, letterSpacing: "1.5px", marginBottom: 12 }}>PLATAFORMA COMPLETA</div>
          <h2 style={{ fontFamily: F, fontSize: 38, fontWeight: 800, letterSpacing: "-1px", color: "oklch(0.98 0.008 264)", margin: 0 }}>Tudo que o escritório precisa, sem trocar de aba</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {features.map(({ title, novo, desc, icon }) => (
            <div key={title} style={{ background: "oklch(0.13 0.018 264)", border: "1px solid oklch(1 0 0 / 8%)", borderRadius: 16, padding: 24 }}>
              <span style={{ width: 42, height: 42, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", color: AC, background: `color-mix(in oklab,${AC} 14%,transparent)`, border: `1px solid color-mix(in oklab,${AC} 26%,transparent)` }}>{icon}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "16px 0 7px" }}>
                <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: "oklch(0.95 0.01 264)" }}>{title}</span>
                {novo && <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 600, color: AC, background: `color-mix(in oklab,${AC} 16%,transparent)`, border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, padding: "1px 7px", borderRadius: 999, letterSpacing: ".5px" }}>NOVO</span>}
              </div>
              <p style={{ fontFamily: F, fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: "oklch(0.62 0.02 264)", margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEXO IA ── */}
      <section id="ia" style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 40px" }}>
        <div style={{ borderRadius: 22, border: `1px solid color-mix(in oklab,${AC} 26%,transparent)`, background: `linear-gradient(150deg,color-mix(in oklab,${AC} 14%,oklch(0.12 0.018 264)),oklch(0.12 0.018 264) 62%)`, padding: 46, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 46, alignItems: "center" }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FM, fontSize: 11, fontWeight: 600, color: AC, border: `1px solid color-mix(in oklab,${AC} 32%,transparent)`, borderRadius: 999, padding: "5px 12px", letterSpacing: ".5px" }}>✦ LEXO IA</span>
            <h2 style={{ fontFamily: F, fontSize: 34, fontWeight: 800, letterSpacing: "-1px", color: "oklch(0.98 0.008 264)", margin: "18px 0 0", lineHeight: 1.1 }}>
              Uma inteligência treinada para o jurídico brasileiro
            </h2>
            <p style={{ fontFamily: F, fontSize: 16, lineHeight: 1.62, color: "oklch(0.68 0.02 264)", margin: "16px 0 0" }}>
              Resuma processos de centenas de páginas em segundos, gere minutas, calcule prazos a partir das publicações e descubra padrões de decisão por vara, comarca e relator.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 26 }}>
              {[
                ["Resumo de autos", "— todo o processo em um briefing objetivo."],
                ["Prazos automáticos", "— a partir do diário oficial, sem digitação."],
                ["Jurimetria", "— probabilidade de êxito com base em dados reais."],
              ].map(([bold, text]) => (
                <div key={bold as string} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <span style={{ color: AC, marginTop: 2 }}>✓</span>
                  <span style={{ fontFamily: F, fontSize: 15, color: "oklch(0.82 0.01 264)" }}>
                    <b style={{ color: "oklch(0.95 0.01 264)", fontWeight: 600 }}>{bold}</b> {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Chat demo */}
          <div style={{ background: "oklch(0.11 0.018 264 / 0.7)", border: "1px solid oklch(1 0 0 / 9%)", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "oklch(0.2 0.02 264)", flexShrink: 0 }} />
              <div style={{ background: "oklch(0.165 0.02 264)", borderRadius: "12px 12px 12px 3px", padding: "11px 14px", fontFamily: F, fontSize: 13, color: "oklch(0.8 0.01 264)", lineHeight: 1.5 }}>
                Resuma o processo 1023-45 e me diga os próximos prazos.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: "row-reverse" }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${AC},${AC2})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z"/></svg>
              </span>
              <div style={{ background: `color-mix(in oklab,${AC} 14%,oklch(0.165 0.02 264))`, border: `1px solid color-mix(in oklab,${AC} 26%,transparent)`, borderRadius: "12px 3px 12px 12px", padding: "13px 15px" }}>
                <div style={{ fontFamily: F, fontSize: 13, color: "oklch(0.88 0.01 264)", lineHeight: 1.55, marginBottom: 10 }}>
                  Ação trabalhista, fase de instrução. Audiência designada e contestação já protocolada. Próximos prazos:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {[["Razões finais", "2 dias", "oklch(0.78 0.14 80)"], ["Audiência una", "14 dias", "oklch(0.72 0.15 150)"]].map(([label, prazo, color]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 9, background: "oklch(0.11 0.018 264 / 0.6)", borderRadius: 8, padding: "8px 11px" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: "oklch(0.85 0.01 264)" }}>{label}</span>
                      <span style={{ marginLeft: "auto", fontFamily: FM, fontSize: 11, fontWeight: 500, color }}>{prazo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 40px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, textAlign: "center" }}>
          {stats.map(({ value, label }) => (
            <div key={value} style={{ padding: 18 }}>
              <div style={{ fontFamily: F, fontSize: 40, fontWeight: 800, letterSpacing: "-1.5px", background: `linear-gradient(120deg,oklch(0.98 0.008 264),color-mix(in oklab,${AC} 70%,oklch(0.9 0.01 264)))`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{value}</div>
              <div style={{ fontFamily: F, fontSize: 14, color: "oklch(0.6 0.02 264)", marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PORTAL DO CLIENTE ── */}
      <section id="portal" style={{ maxWidth: 1180, margin: "0 auto", padding: "60px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50, alignItems: "center" }}>
          <div style={{ borderRadius: 16, border: "1px solid oklch(1 0 0 / 10%)", background: "oklch(0.13 0.018 264)", boxShadow: "0 24px 60px oklch(0 0 0 / 0.45)", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,oklch(0.55 0.1 210),oklch(0.6 0.1 230))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 13, fontWeight: 600, color: "#fff" }}>MS</span>
              <div>
                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "oklch(0.93 0.01 264)" }}>Maria Silva</div>
                <div style={{ fontFamily: F, fontSize: 11, color: "oklch(0.55 0.02 264)" }}>Acompanhamento do processo</div>
              </div>
              <span style={{ marginLeft: "auto", fontFamily: FM, fontSize: 10, fontWeight: 500, color: "oklch(0.72 0.15 150)", background: "oklch(0.72 0.15 150 / 0.14)", borderRadius: 99, padding: "3px 10px" }}>Em dia</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "oklch(0.16 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 11, padding: 13 }}>
                <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 500, color: "oklch(0.55 0.02 264)", marginBottom: 6 }}>PROC. 1023-45</div>
                <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "oklch(0.86 0.01 264)" }}>Última movimentação: juntada de petição</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[["Honorários", "Em dia", "oklch(0.72 0.15 150)"], ["Documentos", "7 arquivos", "oklch(0.88 0.01 264)"]].map(([label, value, color]) => (
                  <div key={label} style={{ flex: 1, background: "oklch(0.16 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 11, padding: 12 }}>
                    <div style={{ fontFamily: F, fontSize: 10, color: "oklch(0.55 0.02 264)" }}>{label}</div>
                    <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color, marginTop: 3 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 500, color: AC, letterSpacing: "1.5px", marginBottom: 12 }}>PORTAL DO CLIENTE</div>
            <h2 style={{ fontFamily: F, fontSize: 34, fontWeight: 800, letterSpacing: "-1px", color: "oklch(0.98 0.008 264)", margin: 0, lineHeight: 1.1 }}>
              Seu cliente acompanha tudo, sem ligar para o escritório
            </h2>
            <p style={{ fontFamily: F, fontSize: 16, lineHeight: 1.62, color: "oklch(0.68 0.02 264)", margin: "16px 0 0" }}>
              Pelo acesso à <b style={{ color: "oklch(0.92 0.01 264)", fontWeight: 600 }}>Área do Cliente</b>, ele vê o andamento dos processos, documentos, audiências e situação financeira — com transparência e em tempo real.
            </p>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 26, fontFamily: F, fontSize: 15, fontWeight: 600, color: "#fff", borderRadius: 11, padding: "13px 22px", background: AC, boxShadow: `0 10px 26px color-mix(in oklab,${AC} 42%,transparent)`, textDecoration: "none" }}>
              Acessar Área do Cliente
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="precos" style={{ maxWidth: 1180, margin: "0 auto", padding: "60px 40px" }}>
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 44px" }}>
          <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 500, color: AC, letterSpacing: "1.5px", marginBottom: 12 }}>PLANOS</div>
          <h2 style={{ fontFamily: F, fontSize: 38, fontWeight: 800, letterSpacing: "-1px", color: "oklch(0.98 0.008 264)", margin: 0 }}>Preço por usuário, sem surpresas</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{ borderRadius: 18, padding: 28, position: "relative", border: plan.accent ? `1px solid color-mix(in oklab,${AC} 40%,transparent)` : "1px solid oklch(1 0 0 / 9%)", background: plan.accent ? `linear-gradient(160deg,color-mix(in oklab,${AC} 14%,oklch(0.13 0.018 264)),oklch(0.13 0.018 264))` : "oklch(0.13 0.018 264)" }}>
              {plan.popular && (
                <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontFamily: FM, fontSize: 10, fontWeight: 600, color: "#fff", background: AC, borderRadius: 999, padding: "4px 13px", letterSpacing: ".5px", whiteSpace: "nowrap" }}>MAIS POPULAR</span>
              )}
              <div style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: "oklch(0.95 0.01 264)" }}>{plan.name}</div>
              <div style={{ fontFamily: F, fontSize: 13, color: "oklch(0.6 0.02 264)", marginTop: 5, minHeight: 38 }}>{plan.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, margin: "16px 0 4px" }}>
                <span style={{ fontFamily: F, fontSize: 38, fontWeight: 800, color: "oklch(0.98 0.008 264)", letterSpacing: "-1.5px" }}>{plan.price}</span>
                {plan.period && <span style={{ fontFamily: F, fontSize: 13, color: "oklch(0.58 0.02 264)" }}>{plan.period}</span>}
              </div>
              <Link href="/registrar" style={{ display: "block", textAlign: "center", margin: "18px 0 20px", fontFamily: F, fontSize: 14, fontWeight: 600, borderRadius: 10, padding: 12, color: plan.accent ? "#fff" : "oklch(0.92 0.01 264)", background: plan.accent ? AC : "oklch(0.18 0.02 264)", border: plan.accent ? "none" : "1px solid oklch(1 0 0 / 14%)", textDecoration: "none" }}>
                {plan.cta}
              </Link>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {plan.items.map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontFamily: F, fontSize: 13, color: "oklch(0.74 0.02 264)" }}>
                    <span style={{ color: AC, flexShrink: 0, marginTop: 1 }}>✓</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 40px 70px" }}>
        <div style={{ borderRadius: 22, border: `1px solid color-mix(in oklab,${AC} 28%,transparent)`, background: `radial-gradient(700px 320px at 50% -30%,color-mix(in oklab,${AC} 28%,transparent),transparent 70%), oklch(0.13 0.018 264)`, padding: "56px 40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: F, fontSize: 38, fontWeight: 800, letterSpacing: "-1.2px", color: "oklch(0.98 0.008 264)", margin: 0, lineHeight: 1.1 }}>
            Pronto para tirar o escritório do caos?
          </h2>
          <p style={{ fontFamily: F, fontSize: 17, color: "oklch(0.68 0.02 264)", margin: "14px auto 0", maxWidth: 480 }}>
            Comece grátis hoje. Migramos seus processos e treinamos sua equipe sem custo.
          </p>
          <div style={{ display: "flex", gap: 13, justifyContent: "center", marginTop: 30, flexWrap: "wrap" }}>
            <Link href="/registrar" style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: "#fff", borderRadius: 11, padding: "14px 26px", background: AC, boxShadow: `0 10px 26px color-mix(in oklab,${AC} 42%,transparent)`, textDecoration: "none" }}>
              Começar teste de 14 dias
            </Link>
            <Link href="/registrar" style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: "oklch(0.92 0.01 264)", border: "1px solid oklch(1 0 0 / 16%)", borderRadius: 11, padding: "14px 24px", background: "oklch(0.155 0.02 264)", textDecoration: "none" }}>
              Falar com vendas
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid oklch(1 0 0 / 7%)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: 40, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${AC},${AC2})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 800 }}>L</span>
            <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "oklch(0.95 0.01 264)" }}>Lexo</span>
          </Link>
          <span style={{ fontFamily: F, fontSize: 13, color: "oklch(0.5 0.02 264)" }}>
            © 2026 Lexo Tecnologia Jurídica · LGPD &amp; ISO 27001
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
            {[["#recursos", "Recursos"], ["#precos", "Preços"]].map(([href, label]) => (
              <a key={href} href={href} style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "oklch(0.6 0.02 264)", textDecoration: "none" }}>{label}</a>
            ))}
            <Link href="/login" style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "oklch(0.6 0.02 264)", textDecoration: "none" }}>Área do Cliente</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
