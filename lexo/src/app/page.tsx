"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG    = "oklch(0.07 0.022 264)";
const AC    = "oklch(0.68 0.24 274)";
const AC2   = "oklch(0.72 0.20 300)";
const AC3   = "oklch(0.70 0.20 230)";
const AC_CY = "oklch(0.74 0.16 200)";
const AC_MG = "oklch(0.70 0.22 330)";
const SURF1 = "oklch(0.11 0.020 264)";
const SURF2 = "oklch(0.15 0.020 264)";
const F     = "'Geist', var(--font-geist), sans-serif";
const FM    = "'Geist Mono', var(--font-geist-mono), monospace";

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

const NAV_ITEMS = [
  ["#recursos", "Recursos"],
  ["#ia", "Lexo IA"],
  ["#portal", "Portal do Cliente"],
  ["#precos", "Preços"],
] as const;

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes aurora-a {
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(-30px,20px) scale(1.08); }
    66%  { transform: translate(20px,-15px) scale(0.94); }
    100% { transform: translate(0,0) scale(1); }
  }
  @keyframes aurora-b {
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(25px,-20px) scale(1.06); }
    66%  { transform: translate(-15px,25px) scale(1.1); }
    100% { transform: translate(0,0) scale(1); }
  }
  @keyframes aurora-c {
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(15px,10px) scale(0.96); }
    66%  { transform: translate(-20px,-10px) scale(1.07); }
    100% { transform: translate(0,0) scale(1); }
  }
  @keyframes aurora-d {
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(-20px,-25px) scale(1.05); }
    66%  { transform: translate(25px,15px) scale(0.95); }
    100% { transform: translate(0,0) scale(1); }
  }
  [data-reveal] {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  [data-reveal].reveal-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .feature-card {
    position: relative;
    transition: transform 300ms ease, background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
  }
  .feature-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(220px at var(--mx,50%) var(--my,50%), oklch(0.68 0.24 274 / 7%), transparent 70%);
    opacity: 0;
    transition: opacity 300ms;
    pointer-events: none;
  }
  .feature-card:hover::before { opacity: 1; }
  .feature-card:hover {
    border-color: color-mix(in oklab, oklch(0.68 0.24 274) 40%, transparent) !important;
    background: oklch(0.15 0.020 264) !important;
    transform: translateY(-3px);
    box-shadow: 0 0 0 1px color-mix(in oklab, oklch(0.68 0.24 274) 25%, transparent),
                0 8px 32px oklch(0 0 0 / 0.3),
                0 0 40px color-mix(in oklab, oklch(0.68 0.24 274) 12%, transparent);
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  .badge-pulse {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .badge-pulse::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1.5px solid oklch(0.68 0.24 274 / 0.5);
    animation: pulse-ring 2.5s ease-out infinite;
    pointer-events: none;
  }
  .hero-panel {
    opacity: 0;
    transform: translateX(20px);
    transition: opacity 900ms cubic-bezier(0.22, 1, 0.36, 1) 200ms, transform 900ms cubic-bezier(0.22, 1, 0.36, 1) 200ms;
  }
  .hero-panel.mounted { opacity: 1; transform: translateX(0); }
  .hero-card {
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 750ms cubic-bezier(0.22, 1, 0.36, 1) 500ms, transform 750ms cubic-bezier(0.22, 1, 0.36, 1) 500ms;
  }
  .hero-card.mounted { opacity: 1; transform: translateY(0); }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .marquee-inner {
    display: flex;
    width: max-content;
    animation: marquee 28s linear infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .cursor-blink { animation: blink 0.8s step-end infinite; }
  @keyframes shimmer-badge {
    from { transform: translateX(-150%); }
    to   { transform: translateX(250%); }
  }
  .badge-shimmer {
    position: relative;
    overflow: hidden;
  }
  .badge-shimmer::after {
    content: '';
    position: absolute;
    top: 0; bottom: 0;
    left: -20%; width: 40%;
    background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.22), transparent);
    animation: shimmer-badge 2.5s 1s infinite;
  }
  @keyframes ping {
    0%   { transform: scale(1); opacity: 1; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  .live-dot {
    position: relative;
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: oklch(0.72 0.15 150);
    flex-shrink: 0;
  }
  .live-dot::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: oklch(0.72 0.15 150);
    animation: ping 1.5s ease-out infinite;
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.8; }
  }
  .pricing-card {
    transition: transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease;
  }
  .pricing-card:not(.pricing-popular):hover {
    transform: translateY(-4px);
    border-color: color-mix(in oklab, oklch(0.68 0.24 274) 25%, transparent) !important;
  }
  .cta-btn {
    position: relative;
    overflow: hidden;
  }
  .cta-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 30%, oklch(1 0 0 / 0.12) 50%, transparent 70%);
    transform: translateX(-200%);
    transition: transform 0ms;
  }
  .cta-btn:hover::after {
    transform: translateX(200%);
    transition: transform 500ms ease;
  }
  @keyframes chat-appear {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .chat-item-late {
    opacity: 0;
    animation: chat-appear 400ms ease-out 1.4s forwards;
  }
  .nav-link {
    transition: color 250ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  .nav-pill {
    transition: transform 520ms cubic-bezier(0.34, 1.18, 0.64, 1),
                width 400ms cubic-bezier(0.22, 1, 0.36, 1),
                opacity 240ms ease,
                box-shadow 300ms ease;
  }
  .nav-hover-pill {
    transition: transform 160ms cubic-bezier(0.25, 1, 0.5, 1),
                width 160ms cubic-bezier(0.25, 1, 0.5, 1),
                opacity 110ms ease;
  }
  @media (prefers-reduced-motion: reduce) {
    .aurora-blob { animation: none !important; }
    .bg-beam { animation: none !important; opacity: 0 !important; }
    .text-flow { animation: none !important; }
    .flow-border::before { animation: none !important; }
    [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
    .marquee-inner { animation: none !important; }
    .hero-panel, .hero-card { opacity: 1 !important; transform: none !important; transition: none !important; }
    .badge-pulse::after, .live-dot::before, .badge-shimmer::after,
    .cursor-blink, .chat-item-late { animation: none !important; opacity: 1 !important; }
    .nav-pill, .nav-hover-pill { transition: none !important; }
  }
  @keyframes gradient-flow {
    0%   { background-position:   0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position:   0% 50%; }
  }
  .text-flow {
    background: linear-gradient(100deg,
      oklch(0.98 0.01 264) 0%,
      oklch(0.74 0.16 200) 30%,
      oklch(0.72 0.20 300) 55%,
      oklch(0.70 0.22 330) 80%,
      oklch(0.98 0.01 264) 100%);
    background-size: 220% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-flow 9s ease-in-out infinite;
  }
  .flow-border {
    position: relative;
  }
  .flow-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(120deg,
      oklch(0.68 0.24 274), oklch(0.74 0.16 200),
      oklch(0.70 0.22 330), oklch(0.68 0.24 274));
    background-size: 220% auto;
    animation: gradient-flow 10s ease-in-out infinite;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.7;
  }
  @keyframes beam-sweep {
    0%   { transform: translate3d(-40%, -40%, 0) rotate(8deg); opacity: 0; }
    15%  { opacity: 0.6; }
    85%  { opacity: 0.6; }
    100% { transform: translate3d(40%, 40%, 0) rotate(8deg); opacity: 0; }
  }
  .bg-beam {
    position: absolute;
    top: -30%; left: -30%;
    width: 160%; height: 160%;
    background: linear-gradient(115deg, transparent 42%, oklch(0.74 0.16 200 / 0.10) 50%, transparent 58%);
    mix-blend-mode: screen;
    animation: beam-sweep 14s linear infinite;
    will-change: transform, opacity;
  }
`;

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const auroraRef      = useRef<HTMLDivElement>(null);
  const heroMockupRef  = useRef<HTMLDivElement>(null);
  const heroCardRef    = useRef<HTMLDivElement>(null);
  const statsRef       = useRef<HTMLDivElement>(null);
  const statValueRefs  = useRef<(HTMLSpanElement | null)[]>([]);
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
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
      heroMockupRef.current?.classList.add("mounted");
      heroCardRef.current?.classList.add("mounted");
    });
  }, []);

  // Parallax leve da aurora
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = auroraRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        el.style.transform = `translateY(${window.scrollY * 0.08}px)`;
        raf = 0;
      });
    };
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
    pill.style.boxShadow = `0 0 12px color-mix(in oklab,${AC} 20%,transparent)`;
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
          if (s.decimal !== undefined) {
            fmt = cur.toFixed(s.decimal).replace(".", ",");
          } else if (s.thousands) {
            fmt = Math.round(cur).toLocaleString("pt-BR");
          } else {
            fmt = Math.round(cur).toString();
          }
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
    <div style={{ fontFamily: F, color: "oklch(0.97 0.005 264)", background: BG, minHeight: "100vh", position: "relative" }}>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── BG: AURORA (camada 1) ── */}
      <div ref={auroraRef} className="bg-aurora" style={{ position: "fixed", inset: "-10% 0 0 0", overflow: "hidden", zIndex: 0, pointerEvents: "none", willChange: "transform" }}>
        <div className="aurora-blob" style={{ position: "absolute", top: "-12%", right: "-6%",  width: 360, height: 420, borderRadius: "50%", background: "oklch(0.50 0.30 274)", filter: "blur(120px)", opacity: 0.26, animation: "aurora-a 35s ease-in-out infinite" }} />
        <div className="aurora-blob" style={{ position: "absolute", top: "16%",  left: "-9%",  width: 320, height: 360, borderRadius: "50%", background: "oklch(0.46 0.28 310)", filter: "blur(120px)", opacity: 0.24, animation: "aurora-b 42s ease-in-out infinite" }} />
        <div className="aurora-blob" style={{ position: "absolute", top: "44%",  left: "44%",  width: 380, height: 300, borderRadius: "50%", background: "oklch(0.50 0.20 200)", filter: "blur(130px)", opacity: 0.20, animation: "aurora-c 30s ease-in-out infinite" }} />
        <div className="aurora-blob" style={{ position: "absolute", top: "68%",  right: "2%",   width: 340, height: 320, borderRadius: "50%", background: "oklch(0.48 0.26 330)", filter: "blur(125px)", opacity: 0.18, animation: "aurora-d 38s ease-in-out infinite" }} />
        <div className="aurora-blob" style={{ position: "absolute", top: "88%",  left: "12%",   width: 360, height: 300, borderRadius: "50%", background: "oklch(0.46 0.24 274)", filter: "blur(130px)", opacity: 0.18, animation: "aurora-b 46s ease-in-out infinite" }} />
      </div>

      {/* ── BG: DOT GRID + BEAM (camada 2) ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
        backgroundImage: "radial-gradient(oklch(1 0 0 / 0.05) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent 75%)",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent 75%)" }}>
        <div className="bg-beam" />
      </div>

      {/* ── BG: VINHETA + GRÃO (camada 3) ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 100% 100% at 50% 30%, transparent 55%, oklch(0.05 0.02 264 / 0.55) 100%)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.03,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── NAV ── */}
        <nav style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 22, padding: "15px 40px", borderBottom: "1px solid oklch(1 0 0 / 7%)", background: "oklch(0.07 0.022 264 / 0.82)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "oklch(0.18 0.02 264)" }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4.5V15H15" />
                <path d="M5 19.5h14" stroke="oklch(0.72 0.16 290)" strokeWidth={2} />
              </svg>
            </span>
            <span style={{ fontFamily: F, fontSize: 21, fontWeight: 700, letterSpacing: "-.6px", color: "oklch(0.98 0.008 264)" }}>Lexo</span>
          </Link>

          <div
            ref={navContainerRef}
            onMouseLeave={() => setHoveredHref(null)}
            style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 14, position: "relative" }}
          >
            {/* Hover pill — aparece imediatamente ao hover */}
            <div ref={hoverPillRef} className="nav-hover-pill" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 0, borderRadius: 8, background: "oklch(1 0 0 / 5%)", opacity: 0, pointerEvents: "none", zIndex: 0 }} />
            {/* Active pill — desliza com spring ao rolar */}
            <div ref={pillRef} className="nav-pill" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 0, borderRadius: 8, background: `color-mix(in oklab,${AC} 14%,transparent)`, border: `1px solid color-mix(in oklab,${AC} 24%,transparent)`, opacity: 0, pointerEvents: "none", zIndex: 1 }} />
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
                style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: activeSection === href ? "oklch(0.93 0.01 264)" : "oklch(0.62 0.02 264)", padding: "8px 13px", borderRadius: 8, textDecoration: "none", position: "relative", zIndex: 2 }}
              >
                {label}
              </a>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F, fontSize: 14, fontWeight: 600, color: "oklch(0.92 0.01 264)", border: "1px solid oklch(1 0 0 / 14%)", borderRadius: 10, padding: "9px 16px", background: "oklch(0.155 0.02 264)", textDecoration: "none" }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><circle cx={12} cy={8} r={4}/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
              Área do Cliente
            </Link>
            <Link href="/registrar" className="cta-btn" style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#fff", borderRadius: 10, padding: "10px 17px", background: AC, boxShadow: `0 6px 18px color-mix(in oklab,${AC} 40%,transparent)`, textDecoration: "none" }}>
              Agendar demo
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <header style={{ maxWidth: 1180, margin: "0 auto", padding: "78px 40px 60px", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 54, alignItems: "center" }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FM, fontSize: 12, fontWeight: 500, color: "oklch(0.78 0.06 274)", border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, background: `color-mix(in oklab,${AC} 12%,transparent)`, borderRadius: 999, padding: "6px 13px", letterSpacing: ".3px" }}>
              <span className="badge-pulse" style={{ fontSize: 14, lineHeight: 1 }}>✦</span>
              {" "}Agora com Lexo IA &amp; Jurimetria
            </span>

            <h1 className="text-flow" style={{ fontFamily: F, fontSize: 64, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-2px", margin: "22px 0 0" }}>
              O sistema que cuida do escritório enquanto você cuida da causa.
            </h1>

            <p style={{ fontFamily: F, fontSize: 18, fontWeight: 400, lineHeight: 1.6, color: "oklch(0.68 0.015 264)", maxWidth: 520, margin: "20px 0 0" }}>
              Processos, prazos, financeiro e relacionamento com o cliente em um só lugar — com inteligência artificial que lê os autos, calcula prazos e antecipa decisões.
            </p>

            <div style={{ display: "flex", gap: 13, marginTop: 32, flexWrap: "wrap" }}>
              <Link href="/registrar" className="cta-btn" style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: F, fontSize: 15, fontWeight: 600, color: "#fff", borderRadius: 11, padding: "14px 24px", background: AC, boxShadow: `0 10px 26px color-mix(in oklab,${AC} 42%,transparent)`, textDecoration: "none" }}>
                Começar teste de 14 dias
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
              <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: F, fontSize: 15, fontWeight: 600, color: "oklch(0.92 0.01 264)", border: "1px solid oklch(1 0 0 / 16%)", borderRadius: 11, padding: "14px 22px", background: "oklch(0.155 0.02 264)", textDecoration: "none" }}>
                Entrar na Área do Cliente
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 34, fontFamily: F, fontSize: 13, color: "oklch(0.52 0.015 264)" }}>
              {["Sem cartão de crédito", "Migração assistida", "LGPD & ISO 27001"].map((t, i) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ color: i === 2 ? AC3 : AC }}>✓</span>{t}
                </span>
              ))}
            </div>
          </div>

          {/* ── Dual Mockup ── */}
          <div style={{ position: "relative", minHeight: 400 }}>
            <div style={{ position: "absolute", inset: "-12% -8% -8% -8%", background: `radial-gradient(closest-side,color-mix(in oklab,${AC} 22%,transparent),transparent)`, filter: "blur(34px)", zIndex: 0 }} />

            {/* Main browser panel */}
            <div ref={heroMockupRef} className="hero-panel" style={{ position: "relative", zIndex: 1, borderRadius: 16, border: "1px solid oklch(1 0 0 / 10%)", background: SURF1, boxShadow: "0 30px 70px oklch(0 0 0 / 0.5)", overflow: "hidden" }}>
              {/* Browser chrome */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 14px", borderBottom: "1px solid oklch(1 0 0 / 7%)" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "oklch(0.55 0.15 25)" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "oklch(0.78 0.14 80)" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "oklch(0.72 0.15 150)" }} />
                <span style={{ marginLeft: 10, fontFamily: FM, fontSize: 11, color: "oklch(0.5 0.02 264)" }}>app.lexo.com.br/dashboard</span>
              </div>
              {/* Sidebar + content */}
              <div style={{ display: "flex" }}>
                {/* Collapsed sidebar */}
                <div style={{ width: 44, flexShrink: 0, borderRight: "1px solid oklch(1 0 0 / 7%)", background: "oklch(0.09 0.018 264)", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 14 }}>
                  {[true, false, false, false].map((active, i) => (
                    <div key={i} style={{ width: 22, height: 22, borderRadius: 6, background: active ? `color-mix(in oklab,${AC} 20%,transparent)` : "oklch(1 0 0 / 5%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: active ? AC : "oklch(0.55 0.02 264)", opacity: active ? 1 : 0.4 }} />
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 11 }}>
                  {/* KPIs */}
                  <div style={{ display: "flex", gap: 9 }}>
                    {[
                      { label: "Processos ativos", value: "148", accent: false },
                      { label: "Prazos urgentes",  value: "9",   accent: true  },
                      { label: "Horas faturáveis", value: "312h", accent: false },
                    ].map(({ label, value, accent }) => (
                      <div key={label} style={{ flex: 1, background: accent ? `linear-gradient(160deg,color-mix(in oklab,${AC} 22%,oklch(0.16 0.02 264)),oklch(0.16 0.02 264))` : "oklch(0.16 0.02 264)", border: accent ? `1px solid color-mix(in oklab,${AC} 32%,transparent)` : "1px solid oklch(1 0 0 / 7%)", borderRadius: 10, padding: 11 }}>
                        <div style={{ fontFamily: F, fontSize: 9, fontWeight: 500, color: accent ? "oklch(0.74 0.05 274)" : "oklch(0.55 0.02 264)" }}>{label}</div>
                        <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "oklch(0.97 0.008 264)", marginTop: 4 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {/* AI summary */}
                  <div style={{ background: "oklch(0.16 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                      <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: "oklch(0.86 0.01 264)" }}>Resumo gerado pela Lexo IA</span>
                      <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 500, color: AC, border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, borderRadius: 99, padding: "2px 7px" }}>IA</span>
                    </div>
                    {[88, 72, 55].map(w => <div key={w} style={{ height: 6, borderRadius: 99, background: "oklch(1 0 0 / 9%)", marginBottom: 7, width: `${w}%` }} />)}
                  </div>
                  {/* Process list with risk badges */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                      { label: "Contestação · Proc. 1023-45", badge: "ALTO", bc: "oklch(0.65 0.18 25)",  dl: "2 dias",  dc: "oklch(0.78 0.14 80)"  },
                      { label: "Audiência · Proc. 0987-32",   badge: "MED",  bc: "oklch(0.72 0.14 80)",  dl: "5 dias",  dc: "oklch(0.72 0.15 150)" },
                    ].map(({ label, badge, bc, dl, dc }) => (
                      <div key={label} style={{ display: "flex", gap: 8, alignItems: "center", background: "oklch(0.16 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 9, padding: "9px 11px" }}>
                        <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: bc, background: `color-mix(in oklab,${bc} 18%,transparent)`, borderRadius: 4, padding: "2px 5px", flexShrink: 0 }}>{badge}</span>
                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: "oklch(0.82 0.01 264)", flex: 1 }}>{label}</span>
                        <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 500, color: dc, flexShrink: 0 }}>{dl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating AI card */}
            <div ref={heroCardRef} className="hero-card" style={{ position: "absolute", bottom: -20, left: -40, zIndex: 2, borderRadius: 14, border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, background: `color-mix(in oklab,${AC} 10%,oklch(0.13 0.018 264))`, boxShadow: `0 20px 50px oklch(0 0 0 / 0.5), 0 0 0 1px color-mix(in oklab,${AC} 15%,transparent)`, padding: "14px 16px", minWidth: 220, transform: "rotate(-3deg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: `linear-gradient(135deg,${AC},${AC2})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3 11 8l5 1.5L11 11l-1.5 5L8 11l-5-1.5L8 8z"/></svg>
                </span>
                <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 600, color: AC, letterSpacing: ".3px" }}>LEXO IA</span>
              </div>
              <div style={{ fontFamily: F, fontSize: 11, color: "oklch(0.78 0.01 264)", lineHeight: 1.5, marginBottom: 9 }}>
                Razões finais vencem em 2 dias. Recomendo priorizar.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  ["Razões finais", "2 dias",  "oklch(0.78 0.14 80)"],
                  ["Audiência una", "14 dias", "oklch(0.72 0.15 150)"],
                ].map(([label, prazo, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, background: "oklch(0.09 0.018 264 / 0.7)", borderRadius: 7, padding: "6px 9px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontFamily: F, fontSize: 10, fontWeight: 500, color: "oklch(0.82 0.01 264)", flex: 1 }}>{label}</span>
                    <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 600, color }}>{prazo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ── TRUST BAR ── */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 40px 18px" }}>
          <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 500, color: "oklch(0.45 0.02 264)", textAlign: "center", letterSpacing: "1px", marginBottom: 18 }}>
            USADO POR ESCRITÓRIOS E DEPARTAMENTOS JURÍDICOS EM TODO O BRASIL
          </div>
          <div style={{ overflow: "hidden", WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)", maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
            <div className="marquee-inner">
              {[...trustNames, ...trustNames].map((n, i) => (
                <span key={i} style={{ fontFamily: F, fontSize: 19, fontWeight: 700, color: "oklch(0.7 0.02 264)", letterSpacing: "-.5px", whiteSpace: "nowrap", padding: "0 46px", opacity: 0.62 }}>{n}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="recursos" style={{ maxWidth: 1180, margin: "0 auto", padding: "104px 40px 32px" }}>
          <div data-reveal="" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 52px" }}>
            <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 500, color: AC, letterSpacing: "2.5px", marginBottom: 14 }}>PLATAFORMA COMPLETA</div>
            <h2 style={{ fontFamily: F, fontSize: 42, fontWeight: 800, letterSpacing: "-1.2px", color: "oklch(0.98 0.008 264)", margin: 0, lineHeight: 1.1 }}>Tudo que o escritório precisa, sem trocar de aba</h2>
          </div>
          <div
            onMouseMove={(e) => {
              featureCardRefs.current.forEach(card => {
                if (!card) return;
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
                card.style.setProperty("--my", `${e.clientY - rect.top}px`);
              });
            }}
          >
            {/* Row 1: 2 featured cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {features.slice(0, 2).map(({ title, novo, desc, icon, hue }, i) => (
                <div
                  key={title}
                  className="feature-card"
                  ref={el => { featureCardRefs.current[i] = el; }}
                  data-reveal=""
                  style={{ background: SURF1, border: "1px solid oklch(1 0 0 / 9%)", borderRadius: 18, padding: 32, transitionDelay: `${i * 80}ms` }}
                >
                  <span style={{ width: 48, height: 48, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", color: hue, background: `color-mix(in oklab,${hue} 13%,transparent)`, border: `1px solid color-mix(in oklab,${hue} 22%,transparent)` }}>{icon}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "20px 0 9px" }}>
                    <span style={{ fontFamily: F, fontSize: 19, fontWeight: 600, color: "oklch(0.96 0.01 264)" }}>{title}</span>
                    {novo && <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 600, color: AC, background: `color-mix(in oklab,${AC} 16%,transparent)`, border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, padding: "1px 7px", borderRadius: 999, letterSpacing: ".5px" }}>NOVO</span>}
                  </div>
                  <p style={{ fontFamily: F, fontSize: 15, fontWeight: 400, lineHeight: 1.65, color: "oklch(0.64 0.02 264)", margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
            {/* Row 2: 4 detail cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {features.slice(2).map(({ title, novo, desc, icon, hue }, i) => (
                <div
                  key={title}
                  className="feature-card"
                  ref={el => { featureCardRefs.current[i + 2] = el; }}
                  data-reveal=""
                  style={{ background: SURF1, border: "1px solid oklch(1 0 0 / 8%)", borderRadius: 16, padding: 22, transitionDelay: `${(i + 2) * 80}ms` }}
                >
                  <span style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: hue, background: `color-mix(in oklab,${hue} 13%,transparent)`, border: `1px solid color-mix(in oklab,${hue} 22%,transparent)` }}>{icon}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 6px" }}>
                    <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: "oklch(0.93 0.01 264)" }}>{title}</span>
                    {novo && <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 600, color: AC, background: `color-mix(in oklab,${AC} 16%,transparent)`, border: `1px solid color-mix(in oklab,${AC} 30%,transparent)`, padding: "1px 7px", borderRadius: 999, letterSpacing: ".5px" }}>NOVO</span>}
                  </div>
                  <p style={{ fontFamily: F, fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: "oklch(0.60 0.02 264)", margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LEXO IA ── */}
        <section id="ia" style={{ maxWidth: 1180, margin: "0 auto", padding: "104px 40px" }}>
          <div className="flow-border" style={{ borderRadius: 22, background: `linear-gradient(150deg,color-mix(in oklab,${AC} 16%,oklch(0.12 0.018 264)),oklch(0.12 0.018 264) 62%)`, padding: 46, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 46, alignItems: "center" }}>
            <div>
              <span data-reveal="" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FM, fontSize: 11, fontWeight: 600, color: AC, border: `1px solid color-mix(in oklab,${AC} 32%,transparent)`, borderRadius: 999, padding: "5px 12px", letterSpacing: "1.5px" }}>✦ LEXO IA</span>
              <h2 data-reveal="" style={{ fontFamily: F, fontSize: 34, fontWeight: 800, letterSpacing: "-1px", color: "oklch(0.98 0.008 264)", margin: "18px 0 0", lineHeight: 1.1, transitionDelay: "100ms" }}>
                Uma inteligência treinada para o jurídico brasileiro
              </h2>
              <p data-reveal="" style={{ fontFamily: F, fontSize: 16, lineHeight: 1.62, color: "oklch(0.68 0.02 264)", margin: "16px 0 0", transitionDelay: "200ms" }}>
                Resuma processos de centenas de páginas em segundos, gere minutas, calcule prazos a partir das publicações e descubra padrões de decisão por vara, comarca e relator.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 26 }}>
                {([
                  ["Resumo de autos",    "— todo o processo em um briefing objetivo.",        300],
                  ["Prazos automáticos", "— a partir do diário oficial, sem digitação.",       400],
                  ["Jurimetria",         "— probabilidade de êxito com base em dados reais.", 500],
                ] as [string, string, number][]).map(([bold, text, delay]) => (
                  <div key={bold} data-reveal="" style={{ display: "flex", gap: 11, alignItems: "flex-start", transitionDelay: `${delay}ms` }}>
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
                <div style={{ background: `color-mix(in oklab,${AC} 14%,oklch(0.165 0.02 264))`, border: `1px solid color-mix(in oklab,${AC} 26%,transparent)`, borderRadius: "12px 3px 12px 12px", padding: "13px 15px", flex: 1 }}>
                  <div style={{ fontFamily: F, fontSize: 13, color: "oklch(0.88 0.01 264)", lineHeight: 1.55, marginBottom: 10 }}>
                    Ação trabalhista, fase de instrução. Audiência designada e contestação já protocolada. Próximos prazos:
                    <span className="cursor-blink" style={{ display: "inline-block", width: 2, height: "1em", background: AC, verticalAlign: "text-bottom", marginLeft: 2 }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {([
                      ["Razões finais",    "2 dias",  "oklch(0.78 0.14 80)",  ""],
                      ["Audiência una",    "14 dias", "oklch(0.72 0.15 150)", ""],
                      ["Análise de mérito","30 dias", AC,                     "chat-item-late"],
                    ] as [string, string, string, string][]).map(([label, prazo, color, cls]) => (
                      <div key={label} className={cls || undefined} style={{ display: "flex", alignItems: "center", gap: 9, background: "oklch(0.11 0.018 264 / 0.6)", borderRadius: 8, padding: "8px 11px" }}>
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
        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0px 40px 96px" }}>
          <div ref={statsRef} data-reveal="" className="flow-border" style={{ borderRadius: 18, padding: "40px 32px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
            {statsData.map((s, i) => (
              <div key={s.display} style={{ padding: "0 32px 0 0", borderRight: i < 3 ? "1px solid oklch(1 0 0 / 8%)" : "none", marginRight: i < 3 ? 32 : 0 }}>
                <div style={{ fontFamily: F, fontSize: 72, fontWeight: 800, letterSpacing: "-2.5px", background: `linear-gradient(120deg,oklch(0.98 0.008 264),color-mix(in oklab,${AC} 60%,oklch(0.9 0.01 264)))`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>
                  <span ref={el => { statValueRefs.current[i] = el; }}>{s.display}</span>
                </div>
                <div style={{ fontFamily: F, fontSize: 14, color: "oklch(0.55 0.02 264)", marginTop: 10, lineHeight: 1.45 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PORTAL DO CLIENTE ── */}
        <section id="portal" style={{ maxWidth: 1180, margin: "0 auto", padding: "104px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50, alignItems: "center" }}>
            <div style={{ borderRadius: 16, border: "1px solid oklch(1 0 0 / 10%)", background: SURF1, boxShadow: "0 24px 60px oklch(0 0 0 / 0.45)", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
                <span style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,oklch(0.55 0.1 210),oklch(0.6 0.1 230))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 13, fontWeight: 600, color: "#fff" }}>MS</span>
                <div>
                  <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "oklch(0.93 0.01 264)" }}>Maria Silva</div>
                  <div style={{ fontFamily: F, fontSize: 11, color: "oklch(0.55 0.02 264)" }}>Acompanhamento do processo</div>
                </div>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontFamily: FM, fontSize: 10, fontWeight: 500, color: "oklch(0.72 0.15 150)", background: "oklch(0.72 0.15 150 / 0.14)", borderRadius: 99, padding: "3px 10px" }}>
                  <span className="live-dot" />
                  Em dia
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: "oklch(0.16 0.02 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 11, padding: 13 }}>
                  <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 500, color: "oklch(0.55 0.02 264)", marginBottom: 6 }}>PROC. 1023-45</div>
                  <div style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "oklch(0.86 0.01 264)" }}>Última movimentação: juntada de petição</div>
                </div>
                <div style={{ background: "oklch(0.14 0.018 264)", border: "1px solid oklch(1 0 0 / 7%)", borderRadius: 11, padding: "10px 13px" }}>
                  <div style={{ fontFamily: F, fontSize: 11, color: "oklch(0.52 0.015 264)", marginBottom: 4 }}>Notificação</div>
                  <div style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: "oklch(0.80 0.01 264)" }}>Nova movimentação no Proc. 1023-45 — prazo de 5 dias a partir de hoje.</div>
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
            <div data-reveal="">
              <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 500, color: AC, letterSpacing: "2.5px", marginBottom: 14 }}>PORTAL DO CLIENTE</div>
              <h2 style={{ fontFamily: F, fontSize: 42, fontWeight: 800, letterSpacing: "-1.2px", color: "oklch(0.98 0.008 264)", margin: 0, lineHeight: 1.1 }}>
                Seu cliente acompanha tudo, sem ligar para o escritório
              </h2>
              <p style={{ fontFamily: F, fontSize: 16, lineHeight: 1.62, color: "oklch(0.68 0.02 264)", margin: "16px 0 0" }}>
                Pelo acesso à <b style={{ color: "oklch(0.92 0.01 264)", fontWeight: 600 }}>Área do Cliente</b>, ele vê o andamento dos processos, documentos, audiências e situação financeira — com transparência e em tempo real.
              </p>
              <Link href="/login" className="cta-btn" style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 26, fontFamily: F, fontSize: 15, fontWeight: 600, color: "#fff", borderRadius: 11, padding: "13px 22px", background: AC, boxShadow: `0 10px 26px color-mix(in oklab,${AC} 42%,transparent)`, textDecoration: "none" }}>
                Acessar Área do Cliente
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="precos" style={{ maxWidth: 1180, margin: "0 auto", padding: "104px 40px" }}>
          <div data-reveal="" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 52px" }}>
            <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 500, color: AC, letterSpacing: "2.5px", marginBottom: 14 }}>PLANOS</div>
            <h2 style={{ fontFamily: F, fontSize: 42, fontWeight: 800, letterSpacing: "-1.2px", color: "oklch(0.98 0.008 264)", margin: 0 }}>Preço por usuário, sem surpresas</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className={`pricing-card${plan.popular ? " pricing-popular" : ""}`}
                data-reveal=""
                style={{
                  borderRadius: 18, padding: 28, position: "relative",
                  border: plan.accent ? `1px solid color-mix(in oklab,${AC} 40%,transparent)` : "1px solid oklch(1 0 0 / 9%)",
                  background: plan.accent ? `linear-gradient(160deg,color-mix(in oklab,${AC} 14%,oklch(0.13 0.018 264)),oklch(0.13 0.018 264))` : "oklch(0.13 0.018 264)",
                  boxShadow: plan.popular ? `0 0 60px color-mix(in oklab,${AC} 20%,transparent), 0 0 120px color-mix(in oklab,${AC_MG} 12%,transparent)` : "none",
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                {plan.popular && (
                  <span className="badge-shimmer" style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontFamily: FM, fontSize: 10, fontWeight: 600, color: "#fff", background: AC, borderRadius: 999, padding: "4px 13px", letterSpacing: ".5px", whiteSpace: "nowrap" }}>MAIS POPULAR</span>
                )}
                <div style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: "oklch(0.95 0.01 264)" }}>{plan.name}</div>
                <div style={{ fontFamily: F, fontSize: 13, color: "oklch(0.6 0.02 264)", marginTop: 5, minHeight: 38 }}>{plan.tagline}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, margin: "16px 0 4px" }}>
                  <span style={{ fontFamily: F, fontSize: 38, fontWeight: 800, color: "oklch(0.98 0.008 264)", letterSpacing: "-1.5px" }}>{plan.price}</span>
                  {plan.period && <span style={{ fontFamily: F, fontSize: 13, color: "oklch(0.58 0.02 264)" }}>{plan.period}</span>}
                </div>
                <Link href="/registrar" className="cta-btn" style={{ display: "block", textAlign: "center", margin: "18px 0 20px", fontFamily: F, fontSize: 14, fontWeight: 600, borderRadius: 10, padding: 12, color: plan.accent ? "#fff" : "oklch(0.92 0.01 264)", background: plan.accent ? AC : "oklch(0.18 0.02 264)", border: plan.accent ? "none" : "1px solid oklch(1 0 0 / 14%)", textDecoration: "none" }}>
                  {plan.cta}
                </Link>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {plan.items.map(item => (
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
        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 40px 96px" }}>
          <div style={{ borderRadius: 22, border: `1px solid color-mix(in oklab,${AC} 28%,transparent)`, background: "oklch(0.10 0.018 264)", padding: "56px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            {/* Static outer orb */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 320, borderRadius: "50%", background: `radial-gradient(closest-side,color-mix(in oklab,${AC} 18%,transparent),transparent)`, filter: "blur(40px)", opacity: 0.5, pointerEvents: "none" }} />
            {/* Pulsing inner orb */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 180, borderRadius: "50%", background: `radial-gradient(closest-side,color-mix(in oklab,${AC_MG} 26%,transparent),transparent)`, filter: "blur(28px)", animation: "glow-pulse 3s ease-in-out infinite", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 data-reveal="" style={{ fontFamily: F, fontSize: 42, fontWeight: 800, letterSpacing: "-1.2px", color: "oklch(0.98 0.008 264)", margin: 0, lineHeight: 1.1 }}>
                Pronto para tirar o escritório do caos?
              </h2>
              <p data-reveal="" style={{ fontFamily: F, fontSize: 17, color: "oklch(0.68 0.02 264)", margin: "14px auto 0", maxWidth: 480, transitionDelay: "100ms" }}>
                Comece grátis hoje. Migramos seus processos e treinamos sua equipe sem custo.
              </p>
              <div data-reveal="" style={{ display: "flex", gap: 13, justifyContent: "center", marginTop: 30, flexWrap: "wrap", transitionDelay: "200ms" }}>
                <Link href="/registrar" className="cta-btn" style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: "#fff", borderRadius: 11, padding: "14px 26px", background: AC, boxShadow: `0 10px 26px color-mix(in oklab,${AC} 42%,transparent)`, textDecoration: "none" }}>
                  Começar teste de 14 dias
                </Link>
                <Link href="/registrar" className="cta-btn" style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: "oklch(0.92 0.01 264)", border: "1px solid oklch(1 0 0 / 16%)", borderRadius: 11, padding: "14px 24px", background: "oklch(0.155 0.02 264)", textDecoration: "none" }}>
                  Falar com vendas
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: "1px solid oklch(1 0 0 / 7%)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: 40, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "oklch(0.16 0.020 264)" }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 4.5V15H15" />
                  <path d="M5 19.5h14" stroke="oklch(0.72 0.16 290)" strokeWidth={2} />
                </svg>
              </span>
              <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "oklch(0.98 0.008 264)", letterSpacing: "-.5px" }}>Lexo</span>
            </Link>
            <span style={{ fontFamily: F, fontSize: 13, color: "oklch(0.52 0.015 264)" }}>
              © 2026 Lexo Tecnologia Jurídica · LGPD &amp; ISO 27001
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
              {[["#recursos", "Recursos"], ["#precos", "Preços"]].map(([href, label]) => (
                <a key={href} href={href} className="nav-link" style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "oklch(0.6 0.02 264)", textDecoration: "none" }}>{label}</a>
              ))}
              <Link href="/login" style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "oklch(0.6 0.02 264)", textDecoration: "none" }}>Área do Cliente</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
