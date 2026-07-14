"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Design tokens (Integrated Biosciences — "bioluminescent lab at midnight") ──
const BG    = "#222f30"; // Abyssal Ink — canvas
const AC    = "#cef79e"; // Bioluminescent Lime — micro-surfaces only
const AC2   = AC;
const AC3   = AC;
const AC_CY = AC;
const AC_MG = AC;
const SURF1 = "#1a2526"; // dark card surface (mockups / large panels)
const SURF2 = "#222f30"; // card on canvas
const LINE  = "#4d5757"; // Graphite — hairline borders / secondary text
const LINE2 = "#c9cbbe"; // Lichen — light borders / metadata
const TXT   = "#ffffff"; // primary text on dark
const TXT2  = "#4d5757"; // secondary (graphite) text
const LIGHT = "#f7f7f5"; // Bone White — light section canvas
const F     = "'Inter Tight', var(--font-inter-tight), sans-serif";
const FM    = "'Roboto Mono', var(--font-roboto-mono), monospace";

const HERO_BG = "/landing/hero-a.png";

// ── Data ───────────────────────────────────────────────────────────────────────
const features = [
  {
    title: "Gestão de processos",
    novo: false,
    hue: AC,
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
    hue: AC3,
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
    hue: AC2,
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
    hue: AC_CY,
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
    hue: AC_MG,
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
    hue: AC3,
    desc: "Seus clientes acompanham processos, documentos e pagamentos por uma área dedicada.",
    icon: (
      <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a6 6 0 0 1 11 0"/>
      </svg>
    ),
  },
];

type StatItem = {
  display: string;
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimal?: number;
  thousands?: boolean;
};

const statsData: StatItem[] = [
  { display: "620+",    target: 620,   suffix: "+",                  label: "escritórios usando o Lexo" },
  { display: "+1.200",  target: 1200, prefix: "+", thousands: true,  label: "processos monitorados" },
  { display: "9h",     target: 9,     suffix: "h",                   label: "economizadas por advogado/semana" },
  { display: "99,9%",  target: 99.9,  suffix: "%",   decimal: 1,    label: "de disponibilidade (SLA)" },
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

const trustNames = ["Andrade Adv.", "Mendonça & Cruz", "Vector Legal", "Bittencourt Adv.", "Núcleo Jurídico"];

const steps = [
  { n: "01", title: "Migre em minutos", desc: "Importe processos, clientes e prazos. A Lexo organiza tudo automaticamente — sem planilhas e sem retrabalho." },
  { n: "02", title: "A IA assume a rotina", desc: "Captura publicações do diário, calcula prazos, resume autos e gera minutas enquanto você foca na estratégia." },
  { n: "03", title: "Acompanhe e cresça", desc: "Dashboards, jurimetria e portal do cliente em um só lugar. Decisões baseadas em dados reais do escritório." },
];

const testimonials = [
  {
    quote: "Reduzi em 70% o tempo gasto com controle de prazos. A captação automática do diário sozinha já paga o sistema.",
    name: "Dra. Camila Andrade",
    role: "Sócia · Andrade Advocacia",
    initial: "CA",
  },
  {
    quote: "A Lexo IA resume um processo de 300 páginas em segundos. Minha equipe ganhou horas de volta toda semana.",
    name: "Dr. Rafael Mendonça",
    role: "Sócio · Mendonça & Cruz",
    initial: "RM",
  },
  {
    quote: "O portal acabou com as ligações de 'como está meu processo?'. Os clientes adoram a transparência em tempo real.",
    name: "Dra. Letícia Bittencourt",
    role: "Titular · Bittencourt Advocacia",
    initial: "LB",
  },
];

const NAV_ITEMS = [
  ["#recursos", "Recursos"],
  ["#como-funciona", "Como funciona"],
  ["#ia", "Lexo IA"],
  ["#portal", "Portal do Cliente"],
  ["#precos", "Preços"],
] as const;

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
  [data-reveal] {
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 800ms cubic-bezier(0.22, 1, 0.36, 1), transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  [data-reveal].reveal-visible { opacity: 1; transform: translateY(0); }

  @keyframes hero-drift {
    0%   { transform: scale(1.1) translate(0, 0); }
    50%  { transform: scale(1.16) translate(-1.6%, -1.2%); }
    100% { transform: scale(1.1) translate(0, 0); }
  }
  @keyframes hero-glow {
    0%, 100% { filter: brightness(1) saturate(1); }
    50%      { filter: brightness(1.09) saturate(1.14); }
  }
  .hero-bg {
    animation: hero-drift 26s ease-in-out infinite, hero-glow 12s ease-in-out infinite;
    will-change: transform, filter;
  }

  .feature-card { transition: border-color 300ms ease, background 300ms ease; }
  .feature-card:hover { border-color: ${LINE2} !important; }
  .pricing-card { transition: border-color 300ms ease; }
  .pricing-card:not(.pricing-popular):hover { border-color: ${LINE2} !important; }
  .light-card { transition: border-color 300ms ease; }
  .light-card:hover { border-color: ${LINE} !important; }

  .arrow-cta { transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1); }
  .arrow-cta:hover .arrow-square { transform: translateX(3px); }
  .arrow-square { transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1); }

  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .marquee-inner { display: flex; width: max-content; animation: marquee 32s linear infinite; }

  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  .cursor-blink { animation: blink 0.8s step-end infinite; }

  @keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
  .live-dot { position: relative; display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${AC}; flex-shrink: 0; }
  .live-dot::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: ${AC}; animation: ping 1.5s ease-out infinite; }

  @keyframes chat-appear { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .chat-item-late { opacity: 0; animation: chat-appear 400ms ease-out 1.4s forwards; }

  .nav-link { transition: color 250ms ease; }
  .nav-pill { transition: transform 520ms cubic-bezier(0.34, 1.18, 0.64, 1), width 400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease; }
  .nav-hover-pill { transition: transform 160ms cubic-bezier(0.25, 1, 0.5, 1), width 160ms cubic-bezier(0.25, 1, 0.5, 1), opacity 110ms ease; }
  .nav-shell { transition: background 400ms ease, border-color 400ms ease; }

  @keyframes wf-populate { 0%, 10% { opacity: 0; transform: translateY(7px); } 26%, 82% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(7px); } }
  @keyframes wf-pop { 0%, 38% { opacity: 0; transform: scale(0.82); } 50%, 90% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.82); } }
  @keyframes wf-bar { 0%, 100% { transform: scaleY(0.18); } 50% { transform: scaleY(1); } }
  @keyframes wf-dash { to { stroke-dashoffset: -24; } }
  @keyframes wf-arrow { 0%, 100% { transform: translateY(0); opacity: 0.45; } 50% { transform: translateY(4px); opacity: 1; } }
  .wf-curve { stroke-dasharray: 5 7; animation: wf-dash 0.9s linear infinite; }
  .wf-arrow { animation: wf-arrow 1.5s ease-in-out infinite; }
  .wf-row { animation: wf-populate 4.5s ease-in-out infinite; }
  .wf-pop { animation: wf-pop 4s ease-in-out infinite; }
  .wf-bar { transform-origin: bottom; animation: wf-bar 2.4s ease-in-out infinite; }

  @keyframes wordmark-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .wordmark { animation: wordmark-float 9s ease-in-out infinite; }

  @media (prefers-reduced-motion: reduce) {
    [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
    .hero-bg, .wordmark { animation: none !important; }
    .marquee-inner { animation: none !important; }
    .live-dot::before, .cursor-blink, .chat-item-late { animation: none !important; opacity: 1 !important; }
    .nav-pill, .nav-hover-pill { transition: none !important; }
    .wf-curve, .wf-arrow, .wf-row, .wf-pop { animation: none !important; opacity: 1 !important; transform: none !important; }
    .wf-bar { animation: none !important; transform: scaleY(1) !important; }
  }

  /* ── RESPONSIVO ─────────────────────────────────────────────── */
  html, body { max-width: 100%; overflow-x: clip; background: ${BG}; }
  @media (max-width: 1024px) {
    .lp-hero-h { font-size: clamp(46px, 9vw, 88px) !important; }
    .lp-grid-3 { grid-template-columns: 1fr 1fr !important; }
    .lp-grid-4 { grid-template-columns: 1fr 1fr !important; }
    .lp-ia, .lp-portal { grid-template-columns: 1fr !important; }
    .lp-ia { padding: 34px !important; gap: 34px !important; }
    .hero-card { left: auto !important; right: 0 !important; }
  }
  @media (max-width: 768px) {
    .lp-nav { padding-left: 16px !important; padding-right: 16px !important; }
    .lp-navlinks { display: none !important; }
    .lp-section { padding-left: 20px !important; padding-right: 20px !important; }
    .lp-grid-2, .lp-grid-3 { grid-template-columns: 1fr !important; }
    .lp-step { width: 100% !important; grid-template-columns: 1fr !important; }
    .lp-stats { grid-template-columns: 1fr 1fr !important; gap: 28px 16px !important; }
    .lp-stats > div { border-right: none !important; margin-right: 0 !important; padding-right: 0 !important; }
    .hero-card { display: none !important; }
    .lp-ia { padding: 24px !important; }
    .lp-wordmark { font-size: clamp(64px, 22vw, 150px) !important; }
  }
  @media (max-width: 480px) {
    .lp-grid-4 { grid-template-columns: 1fr !important; }
    .lp-stats { grid-template-columns: 1fr !important; }
    .lp-navcta-label { display: none !important; }
  }
`;

// ── Reusable IB primitives ──────────────────────────────────────────────────────
function CounterPill({ n, light = false }: { n: string; light?: boolean }) {
  return (
    <span style={{ display: "inline-block", fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: light ? TXT2 : LINE2, border: `1px solid ${light ? LINE2 : LINE}`, borderRadius: 9999, padding: "4px 12px" }}>
      {n}
    </span>
  );
}

function ArrowSquare({ size = 40 }: { size?: number }) {
  return (
    <span className="arrow-square" style={{ width: size, height: size, borderRadius: 8, background: AC, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </span>
  );
}

// Dark-filled pill button paired with the lime arrow square (the model's primary combo)
function FilledArrowCTA({ href, label, onLight = false }: { href: string; label: string; onLight?: boolean }) {
  return (
    <Link href={href} className="arrow-cta" style={{ display: "inline-flex", alignItems: "stretch", gap: 6, textDecoration: "none" }}>
      <span style={{ display: "inline-flex", alignItems: "center", fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", textTransform: "uppercase", color: onLight ? "#fff" : BG, background: onLight ? BG : "#fff", borderRadius: 8, padding: "0 18px", height: 40 }}>
        {label}
      </span>
      <ArrowSquare />
    </Link>
  );
}

function GhostButton({ href, label, dark = true }: { href: string; label: string; dark?: boolean }) {
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", height: 40, fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", textTransform: "uppercase", color: dark ? LINE2 : BG, border: `1px solid ${dark ? LINE : LINE2}`, borderRadius: 8, padding: "0 18px", background: "transparent", textDecoration: "none" }}>
      {label}
    </Link>
  );
}

function Dot({ size = 6, color = AC }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

// Scroll-driven heading: the tail sweeps from muted → filled as it scrolls up (model's signature)
function ScrollFillHeading({ lead, tail, dark = true, size = "clamp(28px, 4.6vw, 42px)", style }: { lead: string; tail: string; dark?: boolean; size?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [p, setP] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0
  );
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.88, end = vh * 0.42;
      const prog = (start - r.top) / (start - end);
      setP(Math.max(0, Math.min(1, prog)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    raf = requestAnimationFrame(compute);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const filled = dark ? TXT : BG;
  const muted = dark ? LINE : LINE2;
  const stop = p * 100;
  return (
    <h2 ref={ref} style={{ fontFamily: F, fontSize: size, letterSpacing: "-0.5px", lineHeight: 1.15, margin: 0, ...style }}>
      <span style={{ color: filled }}>{lead}</span>
      <span
        style={{
          backgroundImage: `linear-gradient(90deg, ${filled} ${stop}%, ${muted} ${Math.min(stop + 10, 100)}%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {tail}
      </span>
    </h2>
  );
}

// ── Wireframes (recolored to IB lime) ────────────────────────────────────────────
function Wireframe({ i }: { i: number }) {
  if (i === 0) {
    return (
      <div style={{ background: SURF1, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: LINE }}>PROCESSOS</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FM, fontSize: 11, color: TXT2, border: `1px solid ${LINE}`, borderRadius: 99, padding: "2px 8px" }}><Dot />+128 importados</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="wf-row" style={{ display: "flex", alignItems: "center", gap: 9, animationDelay: `${r * 0.35}s` }}>
              <Dot size={7} />
              <span style={{ height: 7, borderRadius: 4, background: LINE, flex: 1 }} />
              <span style={{ height: 7, width: 46, borderRadius: 4, background: SURF2 }} />
              <span style={{ height: 14, width: 38, borderRadius: 5, background: SURF2, border: `1px solid ${LINE}`, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (i === 1) {
    return (
      <div style={{ background: SURF1, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: SURF2, border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 12px" }}>
          <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: LINE, marginBottom: 7 }}>DIÁRIO OFICIAL · INTIMAÇÃO</div>
          <div style={{ height: 6, width: "92%", borderRadius: 3, background: LINE, marginBottom: 5 }} />
          <div style={{ height: 6, width: "64%", borderRadius: 3, background: LINE }} />
        </div>
        <svg className="wf-arrow" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ alignSelf: "center" }}><path d="M12 5v14M6 13l6 6 6-6" /></svg>
        <div className="wf-pop" style={{ display: "flex", alignItems: "center", gap: 9, alignSelf: "center", background: SURF2, border: `1px solid ${AC}`, borderRadius: 10, padding: "9px 14px" }}>
          <Dot size={7} />
          <span style={{ fontFamily: F, fontSize: 13, color: TXT }}>Prazo calculado:</span>
          <span style={{ fontFamily: FM, fontSize: 12, color: TXT2 }}>5 dias</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: SURF1, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: LINE }}>JURIMETRIA</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FM, fontSize: 11, color: TXT2, border: `1px solid ${LINE}`, borderRadius: 99, padding: "2px 9px" }}><Dot />68% êxito</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 64 }}>
        {[34, 52, 42, 64, 48].map((h, b) => (
          <div key={b} className="wf-bar" style={{ flex: 1, height: h, borderRadius: "4px 4px 0 0", background: AC, opacity: 0.55, animationDelay: `${b * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

function CurvedArrow({ toRight }: { toRight: boolean }) {
  const W = 760, H = 84;
  const x1 = toRight ? W * 0.3 : W * 0.7;
  const x2 = toRight ? W * 0.7 : W * 0.3;
  const d = `M ${x1} 0 C ${x1} ${H * 0.55} ${x2} ${H * 0.45} ${x2} ${H - 2}`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true" style={{ display: "block", margin: "2px 0", opacity: 0.4 }}>
      <path className="wf-curve" d={d} stroke={LINE} strokeWidth={2.2} strokeLinecap="round" />
      <polyline points={`${x2 - 7},${H - 12} ${x2},${H - 2} ${x2 + 7},${H - 12}`} stroke={LINE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroMockupRef  = useRef<HTMLDivElement>(null);
  const heroCardRef    = useRef<HTMLDivElement>(null);
  const statsRef       = useRef<HTMLDivElement>(null);
  const statValueRefs  = useRef<(HTMLSpanElement | null)[]>([]);
  const lightRef       = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [navLight, setNavLight] = useState(false);
  const navLinkRefs    = useRef<(HTMLAnchorElement | null)[]>([]);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const pillRef        = useRef<HTMLDivElement>(null);
  const hoverPillRef   = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<string | null>(null);
  const scrollTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll reveals
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reveals = document.querySelectorAll("[data-reveal]");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("reveal-visible"); }),
      { threshold: 0.12 }
    );
    reveals.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Hero mount animation
  useEffect(() => {
    requestAnimationFrame(() => {
      heroMockupRef.current?.classList.add("reveal-visible");
      heroCardRef.current?.classList.add("reveal-visible");
    });
  }, []);

  // Nav flip: white shell while the light section sits under the nav
  useEffect(() => {
    const el = lightRef.current;
    if (!el) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      setNavLight(r.top <= 64 && r.bottom >= 64);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Active section via IntersectionObserver
  useEffect(() => {
    const intersecting = new Set<string>();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const id = "#" + e.target.id;
        if (e.isIntersecting) intersecting.add(id);
        else intersecting.delete(id);
      });
      const active = NAV_ITEMS.map(([href]) => href).find(href => intersecting.has(href)) ?? null;
      if (!scrollTargetRef.current) setActiveSection(active);
    }, { threshold: 0.3 });
    NAV_ITEMS.forEach(([href]) => {
      const el = document.getElementById(href.slice(1));
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Active pill position
  useEffect(() => {
    const pill = pillRef.current;
    const container = navContainerRef.current;
    if (!pill || !container) return;
    const idx = NAV_ITEMS.findIndex(([href]) => href === activeSection);
    if (idx === -1) { pill.style.opacity = "0"; return; }
    const link = navLinkRefs.current[idx];
    if (!link) return;
    const cRect = container.getBoundingClientRect();
    const lRect = link.getBoundingClientRect();
    pill.style.opacity = "1";
    pill.style.transform = `translateX(${lRect.left - cRect.left}px)`;
    pill.style.width = `${lRect.width}px`;
  }, [activeSection]);

  // Hover pill position
  useEffect(() => {
    const pill = hoverPillRef.current;
    const container = navContainerRef.current;
    if (!pill || !container) return;
    if (!hoveredHref) { pill.style.opacity = "0"; return; }
    const idx = NAV_ITEMS.findIndex(([href]) => href === hoveredHref);
    if (idx === -1) { pill.style.opacity = "0"; return; }
    const link = navLinkRefs.current[idx];
    if (!link) return;
    const cRect = container.getBoundingClientRect();
    const lRect = link.getBoundingClientRect();
    pill.style.opacity = "1";
    pill.style.transform = `translateX(${lRect.left - cRect.left}px)`;
    pill.style.width = `${lRect.width}px`;
  }, [hoveredHref]);

  // Count-up on stats enter
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const container = statsRef.current;
    if (!container) return;
    let started = false;
    const obs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || started) return;
      started = true;
      obs.disconnect();
      const duration = 1200;
      const t0 = performance.now();
      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        const ep = easeOutQuart(p);
        statValueRefs.current.forEach((el, i) => {
          if (!el) return;
          const s = statsData[i];
          const cur = ep * s.target;
          let fmt: string;
          if (s.decimal !== undefined) fmt = cur.toFixed(s.decimal).replace(".", ",");
          else if (s.thousands) fmt = Math.round(cur).toLocaleString("pt-BR");
          else fmt = Math.round(cur).toString();
          el.textContent = (s.prefix ?? "") + fmt + (s.suffix ?? "");
        });
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: F, color: TXT, background: BG, minHeight: "100vh", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── NAV (floating pill shell) ── */}
      <nav className="lp-nav" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", gap: 22, padding: "16px 24px" }}>
        <Link href="/" className="nav-shell" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", background: navLight ? "rgba(255,255,255,0.9)" : "rgba(26,37,38,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${navLight ? LINE2 : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "8px 14px 8px 10px" }}>
          <span style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: navLight ? BG : SURF1 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4.5V15H15" />
              <path d="M5 19.5h14" stroke={AC} strokeWidth={2} />
            </svg>
          </span>
          <span style={{ fontFamily: F, fontSize: 19, letterSpacing: "-0.6px", color: navLight ? BG : TXT }}>Lexo</span>
        </Link>

        <div
          ref={navContainerRef}
          className="lp-navlinks nav-shell"
          onMouseLeave={() => setHoveredHref(null)}
          style={{ display: "flex", alignItems: "center", gap: 4, position: "relative", background: navLight ? "rgba(255,255,255,0.9)" : "rgba(26,37,38,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${navLight ? LINE2 : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: 5 }}
        >
          <div ref={hoverPillRef} className="nav-hover-pill" style={{ position: "absolute", top: 5, bottom: 5, left: 0, width: 0, borderRadius: 9, background: navLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)", opacity: 0, pointerEvents: "none", zIndex: 0 }} />
          <div ref={pillRef} className="nav-pill" style={{ position: "absolute", top: 5, bottom: 5, left: 0, width: 0, borderRadius: 9, background: AC, opacity: 0, pointerEvents: "none", zIndex: 1 }} />
          {NAV_ITEMS.map(([href, label], i) => (
            <a
              key={href}
              href={href}
              ref={el => { navLinkRefs.current[i] = el; }}
              onClick={e => {
                e.preventDefault();
                if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
                scrollTargetRef.current = href;
                setActiveSection(href);
                document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
                scrollTimerRef.current = setTimeout(() => { scrollTargetRef.current = null; }, 1400);
              }}
              onMouseEnter={() => setHoveredHref(href)}
              className="nav-link"
              style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", textTransform: "uppercase", color: activeSection === href ? BG : (navLight ? TXT2 : LINE2), padding: "7px 12px", borderRadius: 9, textDecoration: "none", position: "relative", zIndex: 2, whiteSpace: "nowrap" }}
            >
              {label}
            </a>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "stretch", gap: 6 }}>
          <Link href="/login" className="nav-shell lp-navcta-label" style={{ display: "inline-flex", alignItems: "center", fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", textTransform: "uppercase", color: navLight ? TXT2 : LINE2, background: navLight ? "rgba(255,255,255,0.9)" : "rgba(26,37,38,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${navLight ? LINE2 : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "0 16px", height: 42, textDecoration: "none" }}>
            Área do Cliente
          </Link>
          <Link href="/registrar" className="arrow-cta" style={{ display: "inline-flex", alignItems: "stretch", gap: 5, textDecoration: "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", textTransform: "uppercase", color: navLight ? "#fff" : BG, background: navLight ? BG : "#fff", borderRadius: 8, padding: "0 14px", height: 42 }}>Criar conta</span>
            <span className="arrow-square" style={{ width: 42, height: 42, borderRadius: 8, background: AC, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </Link>
        </div>
      </nav>

      {/* ── HERO (animated render background) ── */}
      <header style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", padding: "132px 40px 48px" }}>
        {/* Animated background */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <div className="hero-bg" style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          {/* legibility overlays */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${BG} 0%, rgba(34,47,48,0.55) 42%, rgba(34,47,48,0.15) 100%)` }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, ${BG} 2%, rgba(34,47,48,0) 55%)` }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", textTransform: "uppercase", color: LINE2 }}>
            <Dot />NOVO · LEXO IA &amp; JURIMETRIA
          </span>
          <h1 className="lp-hero-h" style={{ fontFamily: F, fontSize: "clamp(48px, 8vw, 96px)", lineHeight: 1.02, letterSpacing: "-2px", color: TXT, margin: "22px 0 0", maxWidth: 1000 }}>
            O sistema que cuida do escritório enquanto você cuida da causa.
          </h1>
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <p style={{ fontFamily: F, fontSize: 18, lineHeight: 1.3, color: LINE2, maxWidth: 440, margin: 0 }}>
            Processos, prazos, financeiro e relacionamento com o cliente em um só lugar — com inteligência artificial que lê os autos, calcula prazos e antecipa decisões.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <GhostButton href="/login" label="Área do Cliente" dark />
            <FilledArrowCTA href="/registrar" label="Teste de 14 dias" />
          </div>
        </div>
      </header>

      {/* ── TRUST BAR ── */}
      <div className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 40px 18px" }}>
        <div style={{ fontFamily: FM, fontSize: 13, letterSpacing: "0.5px", color: TXT2, textAlign: "center", marginBottom: 20, textTransform: "uppercase" }}>
          Usado por escritórios e departamentos jurídicos em todo o Brasil
        </div>
        <div style={{ overflow: "hidden", WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)", maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
          <div className="marquee-inner">
            {[...trustNames, ...trustNames, ...trustNames, ...trustNames].map((n, i) => (
              <span key={i} style={{ fontFamily: F, fontSize: 22, letterSpacing: "-0.13px", color: TXT2, whiteSpace: "nowrap", padding: "0 40px", opacity: 0.55 }}>{n}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="recursos" className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px 32px" }}>
        <div data-reveal="" style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 52 }}>
          <div style={{ paddingTop: 8 }}><CounterPill n="01" /></div>
          <ScrollFillHeading lead="Tudo que o escritório precisa, " tail="sem trocar de aba." style={{ maxWidth: 720 }} />
        </div>
        <div>
          <div className="lp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {features.slice(0, 2).map(({ title, novo, desc, icon }, i) => (
              <div key={title} className="feature-card" data-reveal="" style={{ display: "flex", flexDirection: "column", background: SURF2, border: `1px solid ${LINE}`, borderRadius: 20, padding: 32, transitionDelay: `${i * 80}ms` }}>
                <span style={{ display: "inline-flex", color: AC }}>{icon}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 9px" }}>
                  <span style={{ fontFamily: F, fontSize: 22, letterSpacing: "-0.13px", color: TXT }}>{title}</span>
                  {novo && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: TXT2 }}><Dot />NOVO</span>}
                </div>
                <p style={{ fontFamily: F, fontSize: 18, lineHeight: 1.3, color: TXT2, margin: 0 }}>{desc}</p>
                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                  <Link href="/registrar" aria-label={title}><ArrowSquare /></Link>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {features.slice(2).map(({ title, novo, desc, icon }, i) => (
              <div key={title} className="feature-card" data-reveal="" style={{ display: "flex", flexDirection: "column", background: SURF2, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22, transitionDelay: `${(i + 2) * 80}ms` }}>
                <span style={{ display: "inline-flex", color: AC }}>{icon}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 6px" }}>
                  <span style={{ fontFamily: F, fontSize: 18, color: TXT }}>{title}</span>
                  {novo && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: TXT2 }}><Dot />NOVO</span>}
                </div>
                <p style={{ fontFamily: F, fontSize: 18, lineHeight: 1.3, color: TXT2, margin: 0 }}>{desc}</p>
                <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
                  <Link href="/registrar" aria-label={title}><ArrowSquare /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
        <div data-reveal="" style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 56 }}>
          <div style={{ paddingTop: 8 }}><CounterPill n="02" /></div>
          <div style={{ maxWidth: 720 }}>
            <ScrollFillHeading lead="Do primeiro processo ao " tail="escritório no automático." />
            <p style={{ fontFamily: F, fontSize: 18, lineHeight: 1.3, color: TXT2, margin: "14px 0 0" }}>Três etapas — veja o que acontece em cada tela.</p>
          </div>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {steps.map(({ n, title, desc }, i) => {
            const onRight = i % 2 === 1;
            const textBlock = (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
                  <span style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE, border: `1px solid ${LINE}`, borderRadius: 9999, padding: "4px 9px" }}>{n}</span>
                  <span style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE }}>ETAPA</span>
                </div>
                <h3 style={{ fontFamily: F, fontSize: "clamp(24px, 3.4vw, 36px)", letterSpacing: "-0.22px", color: TXT, margin: "0 0 8px", lineHeight: 1.2 }}>{title}</h3>
                <p style={{ fontFamily: F, fontSize: 18, lineHeight: 1.3, color: TXT2, margin: 0 }}>{desc}</p>
              </div>
            );
            const wf = <Wireframe i={i} />;
            return (
              <div key={n}>
                <div data-reveal="" className="lp-step" style={{ width: "74%", marginLeft: onRight ? "auto" : 0, marginRight: onRight ? 0 : "auto", background: SURF2, border: `1px solid ${LINE}`, borderRadius: 18, padding: 22, display: "grid", gridTemplateColumns: onRight ? "1fr 0.8fr" : "0.8fr 1fr", gap: 22, alignItems: "center", transitionDelay: `${i * 90}ms` }}>
                  {onRight ? <>{wf}{textBlock}</> : <>{textBlock}{wf}</>}
                </div>
                {i < steps.length - 1 && <CurvedArrow toRight={!onRight} />}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LEXO IA ── */}
      <section id="ia" className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
        <div data-reveal="" style={{ marginBottom: 28 }}><CounterPill n="03" /></div>
        <div className="lp-ia" style={{ borderRadius: 20, background: SURF1, border: `1px solid ${LINE}`, padding: 46, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 46, alignItems: "center" }}>
          <div>
            <span data-reveal="" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE, border: `1px solid ${LINE}`, borderRadius: 9999, padding: "5px 12px" }}>✦ LEXO IA</span>
            <div data-reveal="" style={{ marginTop: 18 }}>
              <ScrollFillHeading lead="Uma inteligência treinada para o " tail="jurídico brasileiro." size="clamp(26px, 4vw, 42px)" />
            </div>
            <p data-reveal="" style={{ fontFamily: F, fontSize: 18, lineHeight: 1.3, color: TXT2, margin: "16px 0 0", transitionDelay: "200ms" }}>
              Resuma processos de centenas de páginas em segundos, gere minutas, calcule prazos a partir das publicações e descubra padrões de decisão por vara, comarca e relator.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 26 }}>
              {([
                ["Resumo de autos",    "— todo o processo em um briefing objetivo.",        300],
                ["Prazos automáticos", "— a partir do diário oficial, sem digitação.",       400],
                ["Jurimetria",         "— probabilidade de êxito com base em dados reais.", 500],
              ] as [string, string, number][]).map(([bold, text, delay]) => (
                <div key={bold} data-reveal="" style={{ display: "flex", gap: 11, alignItems: "flex-start", transitionDelay: `${delay}ms` }}>
                  <span style={{ marginTop: 8 }}><Dot /></span>
                  <span style={{ fontFamily: F, fontSize: 18, lineHeight: 1.3, color: TXT2 }}>
                    <b style={{ color: TXT, fontWeight: 400 }}>{bold}</b> {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: SURF2, border: `1px solid ${LINE}`, flexShrink: 0 }} />
              <div style={{ background: SURF2, border: `1px solid ${LINE}`, borderRadius: "12px 12px 12px 3px", padding: "11px 14px", fontFamily: F, fontSize: 13, color: TXT, lineHeight: 1.3 }}>
                Resuma o processo 1023-45 e me diga os próximos prazos.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: "row-reverse" }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: SURF2, border: `1px solid ${LINE}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: AC }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z"/></svg>
              </span>
              <div style={{ background: SURF2, border: `1px solid ${AC}`, borderRadius: "12px 3px 12px 12px", padding: "13px 15px", flex: 1 }}>
                <div style={{ fontFamily: F, fontSize: 13, color: TXT, lineHeight: 1.3, marginBottom: 10 }}>
                  Ação trabalhista, fase de instrução. Audiência designada e contestação já protocolada. Próximos prazos:
                  <span className="cursor-blink" style={{ display: "inline-block", width: 2, height: "1em", background: AC, verticalAlign: "text-bottom", marginLeft: 2 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {([
                    ["Razões finais",    "2 dias",  ""],
                    ["Audiência una",    "14 dias", ""],
                    ["Análise de mérito","30 dias", "chat-item-late"],
                  ] as [string, string, string][]).map(([label, prazo, cls]) => (
                    <div key={label} className={cls || undefined} style={{ display: "flex", alignItems: "center", gap: 9, background: SURF1, border: `1px solid ${LINE}`, borderRadius: 8, padding: "8px 11px" }}>
                      <Dot size={7} />
                      <span style={{ fontFamily: F, fontSize: 12, color: TXT }}>{label}</span>
                      <span style={{ marginLeft: "auto", fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: LINE }}>{prazo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "0px 40px 96px" }}>
        <div ref={statsRef} data-reveal="" className="lp-stats" style={{ borderRadius: 16, border: `1px solid ${LINE}`, padding: 40, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
          {statsData.map((s, i) => (
            <div key={s.display} style={{ padding: "0 32px 0 0", borderRight: i < 3 ? `1px solid ${LINE}` : "none", marginRight: i < 3 ? 32 : 0 }}>
              <div style={{ fontFamily: F, fontSize: "clamp(44px, 7vw, 72px)", letterSpacing: "-2.5px", color: TXT, lineHeight: 1 }}>
                <span ref={el => { statValueRefs.current[i] = el; }}>{s.display}</span>
              </div>
              <div style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE, marginTop: 10, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PORTAL DO CLIENTE ── */}
      <section id="portal" className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
        <div className="lp-portal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50, alignItems: "center" }}>
          <div data-reveal="" style={{ borderRadius: 16, border: `1px solid ${LINE}`, background: SURF1, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: SURF2, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 13, color: TXT }}>MS</span>
              <div>
                <div style={{ fontFamily: F, fontSize: 14, color: TXT }}>Maria Silva</div>
                <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: LINE }}>Acompanhamento do processo</div>
              </div>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: TXT2, border: `1px solid ${LINE}`, borderRadius: 99, padding: "3px 10px" }}>
                <span className="live-dot" />
                Em dia
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: SURF2, border: `1px solid ${LINE}`, borderRadius: 11, padding: 13 }}>
                <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: LINE, marginBottom: 6 }}>PROC. 1023-45</div>
                <div style={{ fontFamily: F, fontSize: 13, color: TXT }}>Última movimentação: juntada de petição</div>
              </div>
              <div style={{ background: SURF2, border: `1px solid ${LINE}`, borderRadius: 11, padding: "10px 13px" }}>
                <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: LINE, marginBottom: 4 }}>Notificação</div>
                <div style={{ fontFamily: F, fontSize: 12, color: TXT }}>Nova movimentação no Proc. 1023-45 — prazo de 5 dias a partir de hoje.</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[["Honorários", "Em dia"], ["Documentos", "7 arquivos"]].map(([label, value]) => (
                  <div key={label} style={{ flex: 1, background: SURF2, border: `1px solid ${LINE}`, borderRadius: 11, padding: 12 }}>
                    <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: "-0.26px", color: LINE }}>{label}</div>
                    <div style={{ fontFamily: F, fontSize: 14, color: TXT, marginTop: 3 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div data-reveal=""><CounterPill n="04" /></div>
            <div data-reveal="" style={{ marginTop: 18 }}>
              <ScrollFillHeading lead="Seu cliente acompanha tudo, " tail="sem ligar para o escritório." />
            </div>
            <p style={{ fontFamily: F, fontSize: 18, lineHeight: 1.3, color: TXT2, margin: "16px 0 0" }}>
              Pelo acesso à <b style={{ color: TXT, fontWeight: 400 }}>Área do Cliente</b>, ele vê o andamento dos processos, documentos, audiências e situação financeira — com transparência e em tempo real.
            </p>
            <div style={{ marginTop: 26 }}>
              <FilledArrowCTA href="/login" label="Acessar Área do Cliente" />
            </div>
          </div>
        </div>
      </section>

      {/* ── RELATOS DE CLIENTES (light section) ── */}
      <div ref={lightRef} style={{ background: LIGHT }}>
        <section id="depoimentos" className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
          <div data-reveal="" style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 52 }}>
            <div style={{ paddingTop: 8 }}><CounterPill n="05" light /></div>
            <ScrollFillHeading lead="Escritórios que já vivem " tail="sem retrabalho." dark={false} style={{ maxWidth: 640 }} />
          </div>
          <div className="lp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {testimonials.map(({ quote, name, role, initial }, i) => (
              <figure key={name} className="light-card" data-reveal="" style={{ display: "flex", flexDirection: "column", background: "#ffffff", border: `1px solid ${LINE2}`, borderRadius: 20, padding: 40, margin: 0, transitionDelay: `${i * 90}ms` }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }} aria-label="5 de 5 estrelas">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} width={15} height={15} viewBox="0 0 24 24" fill={AC} stroke="none" aria-hidden="true"><path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7-6.2-3.4-6.2 3.4 1.3-7L2 9.4l7-.9z"/></svg>
                  ))}
                </div>
                <blockquote style={{ flex: 1, fontFamily: F, fontSize: 18, lineHeight: 1.3, color: BG, margin: 0 }}>“{quote}”</blockquote>
                <figcaption style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22 }}>
                  <span style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 13, color: "#fff", background: BG }}>{initial}</span>
                  <span>
                    <span style={{ display: "block", fontFamily: F, fontSize: 14, color: BG }}>{name}</span>
                    <span style={{ display: "block", fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE }}>{role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>

      {/* ── PRICING ── */}
      <section id="precos" className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
        <div data-reveal="" style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 52 }}>
          <div style={{ paddingTop: 8 }}><CounterPill n="06" /></div>
          <ScrollFillHeading lead="Preço por usuário, " tail="sem surpresas." style={{ maxWidth: 600 }} />
        </div>
        <div className="lp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
          {plans.map((plan, i) => (
            <div key={plan.name} className={`pricing-card${plan.popular ? " pricing-popular" : ""}`} data-reveal="" style={{ borderRadius: 18, padding: 28, position: "relative", border: `1px solid ${plan.accent ? AC : LINE}`, background: SURF2, transitionDelay: `${i * 100}ms` }}>
              {plan.popular && (
                <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: BG, background: AC, borderRadius: 9999, padding: "4px 13px", whiteSpace: "nowrap" }}>MAIS POPULAR</span>
              )}
              <div style={{ fontFamily: F, fontSize: 18, color: TXT }}>{plan.name}</div>
              <div style={{ fontFamily: F, fontSize: 14, lineHeight: 1.3, color: TXT2, marginTop: 5, minHeight: 38 }}>{plan.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, margin: "16px 0 4px" }}>
                <span style={{ fontFamily: F, fontSize: 38, letterSpacing: "-1.5px", color: TXT }}>{plan.price}</span>
                {plan.period && <span style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE }}>{plan.period}</span>}
              </div>
              <Link href="/registrar" style={{ display: "block", textAlign: "center", margin: "18px 0 20px", fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", textTransform: "uppercase", borderRadius: 8, padding: 12, color: plan.accent ? AC : LINE2, background: "transparent", border: `1px solid ${plan.accent ? AC : LINE}`, textDecoration: "none" }}>
                {plan.cta}
              </Link>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {plan.items.map(item => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontFamily: F, fontSize: 13, lineHeight: 1.3, color: TXT2 }}>
                    <span style={{ marginTop: 5 }}><Dot /></span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 96px" }}>
        <div style={{ borderRadius: 20, border: `1px solid ${LINE}`, background: SURF2, padding: 56, textAlign: "center" }}>
          <div data-reveal="" style={{ display: "flex", justifyContent: "center" }}>
            <ScrollFillHeading lead="Pronto para tirar o " tail="escritório do caos?" size="clamp(28px, 4.8vw, 58px)" style={{ textAlign: "center", letterSpacing: "-0.7px", lineHeight: 1.1 }} />
          </div>
          <p data-reveal="" style={{ fontFamily: F, fontSize: 18, lineHeight: 1.3, color: TXT2, margin: "14px auto 0", maxWidth: 480, transitionDelay: "100ms" }}>
            Comece grátis hoje. Migramos seus processos e treinamos sua equipe sem custo.
          </p>
          <div data-reveal="" style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30, flexWrap: "wrap", transitionDelay: "200ms" }}>
            <GhostButton href="/registrar" label="Falar com vendas" dark />
            <FilledArrowCTA href="/registrar" label="Teste de 14 dias" />
          </div>
        </div>
      </section>

      {/* ── FOOTER (wordmark over Void) ── */}
      <footer style={{ background: "#000000", borderTop: `1px solid ${LINE}`, overflow: "hidden" }}>
        <div className="lp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 40px 40px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32, flexWrap: "wrap", marginBottom: 40 }}>
            <span style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE, maxWidth: 280 }}>
              O sistema que cuida do escritório enquanto você cuida da causa.
            </span>
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE }}>NAVEGAR</span>
                {[["#recursos", "Recursos"], ["#precos", "Preços"], ["#ia", "Lexo IA"]].map(([href, label]) => (
                  <a key={href} href={href} className="nav-link" style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE2, textDecoration: "none" }}>{label}</a>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE }}>CONTA</span>
                <Link href="/login" style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE2, textDecoration: "none" }}>Área do Cliente</Link>
                <Link href="/registrar" style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE2, textDecoration: "none" }}>Criar conta</Link>
              </div>
            </div>
          </div>
          <div className="wordmark lp-wordmark" style={{ fontFamily: F, fontSize: "clamp(80px, 20vw, 260px)", letterSpacing: "-0.06em", lineHeight: 0.9, color: TXT, userSelect: "none" }}>
            Lexo
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 24, paddingTop: 24, borderTop: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE }}>© 2026 Lexo Tecnologia Jurídica · LGPD &amp; ISO 27001</span>
            <span style={{ fontFamily: FM, fontSize: 13, letterSpacing: "-0.26px", color: LINE }}>Feito no Brasil</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
