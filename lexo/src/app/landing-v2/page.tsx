"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Tokens — Integrated Biosciences (assets/DESIGN.md, 2026-07-14) ───────────────
const LIME     = "#cef79e";
const ABYSSAL  = "#222f30";
const BONE     = "#f7f7f5";
const PAPER    = "#ffffff";
const GRAPHITE = "#4d5757";
const LICHEN   = "#c9cbbe";
const VOID     = "#000000";
const F  = "var(--font-sans), sans-serif";  // Aspekta substituto — Inter, peso 400 único
const FM = "var(--font-mono), monospace";   // Roboto Mono substituto — JetBrains Mono já carregado

// ── Conteúdo (idêntico a lexo/src/app/page.tsx) ─────────────────────────────────
const NAV_ITEMS = [
  ["#recursos", "Recursos"],
  ["#como-funciona", "Como funciona"],
  ["#precos", "Preços"],
] as const;

const features = [
  { n: "01", title: "Gestão de processos", novo: false, desc: "Todos os processos, partes, prazos e documentos organizados e pesquisáveis em um clique." },
  { n: "02", title: "Prazos & agenda", novo: false, desc: "Captura automática de publicações do diário oficial e cálculo de prazos sem digitação manual." },
  { n: "03", title: "Lexo IA", novo: true, desc: "Resume autos, gera minutas e responde perguntas sobre qualquer processo do escritório." },
  { n: "04", title: "Jurimetria", novo: true, desc: "Probabilidade de êxito e tempo médio por vara, comarca e relator com base em dados reais." },
  { n: "05", title: "Financeiro & honorários", novo: false, desc: "Faturamento, timesheet, cobrança recorrente e relatórios de rentabilidade por cliente." },
  { n: "06", title: "Portal do cliente", novo: true, desc: "Seus clientes acompanham processos, documentos e pagamentos por uma área dedicada." },
];

const steps = [
  { n: "01", title: "Migre em minutos", desc: "Importe processos, clientes e prazos. A Lexo organiza tudo automaticamente — sem planilhas e sem retrabalho." },
  { n: "02", title: "A IA assume a rotina", desc: "Captura publicações do diário, calcula prazos, resume autos e gera minutas enquanto você foca na estratégia." },
  { n: "03", title: "Acompanhe e cresça", desc: "Dashboards, jurimetria e portal do cliente em um só lugar. Decisões baseadas em dados reais do escritório." },
];

const statsData = [
  { display: "620+",   label: "escritórios usando o Lexo" },
  { display: "+1.200", label: "processos monitorados" },
  { display: "9h",     label: "economizadas por advogado/semana" },
  { display: "99,9%",  label: "de disponibilidade (SLA)" },
];

const plans = [
  { name: "Solo", tagline: "Para advogados autônomos começando a organizar a rotina.", price: "R$ 79", period: "/usuário · mês", cta: "Começar grátis", popular: false },
  { name: "Escritório", tagline: "Para equipes que querem IA e colaboração de verdade.", price: "R$ 149", period: "/usuário · mês", cta: "Começar teste de 14 dias", popular: true },
  { name: "Enterprise", tagline: "Para grandes bancas e departamentos jurídicos.", price: "Sob consulta", period: "", cta: "Falar com vendas", popular: false },
];

const testimonials = [
  { quote: "Reduzi em 70% o tempo gasto com controle de prazos. A captação automática do diário sozinha já paga o sistema.", name: "Dra. Camila Andrade", role: "Sócia · Andrade Advocacia" },
  { quote: "A Lexo IA resume um processo de 300 páginas em segundos. Minha equipe ganhou horas de volta toda semana.", name: "Dr. Rafael Mendonça", role: "Sócio · Mendonça & Cruz" },
  { quote: "O portal acabou com as ligações de 'como está meu processo?'. Os clientes adoram a transparência em tempo real.", name: "Dra. Letícia Bittencourt", role: "Titular · Bittencourt Advocacia" },
];

const trustNames = ["Andrade Adv.", "Mendonça & Cruz", "Vector Legal", "Bittencourt Adv.", "Núcleo Jurídico"];

const iaBullets = [
  ["Resumo de autos", "todo o processo em um briefing objetivo."],
  ["Prazos automáticos", "a partir do diário oficial, sem digitação."],
  ["Jurimetria", "probabilidade de êxito com base em dados reais."],
];

// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  [data-reveal] {
    opacity: 0;
    transform: translateY(14px);
    transition: opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  [data-reveal].reveal-visible { opacity: 1; transform: translateY(0); }
  .lp2-btn-filled {
    display: inline-flex; align-items: center; gap: 8px;
    border-radius: 8px; padding: 8px 16px;
    font-family: ${FM}; font-size: 13px; font-weight: 400; text-transform: uppercase; letter-spacing: -0.02em;
    text-decoration: none; transition: opacity 250ms ease;
  }
  .lp2-btn-filled:hover { opacity: 0.85; }
  .lp2-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    border-radius: 8px; padding: 8px 16px; border: 1px solid ${GRAPHITE};
    font-family: ${FM}; font-size: 13px; font-weight: 400; text-transform: uppercase; letter-spacing: -0.02em;
    text-decoration: none; background: transparent; transition: border-color 250ms ease, opacity 250ms ease;
  }
  .lp2-btn-ghost:hover { opacity: 0.7; }
  .lp2-arrow-cta {
    display: inline-flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: 8px; background: ${LIME}; flex-shrink: 0;
    transition: transform 250ms ease;
  }
  .lp2-arrow-cta:hover { transform: translateX(3px); }
  .lp2-textlink { color: inherit; text-decoration: none; transition: color 250ms ease; }
  .lp2-textlink:hover { color: ${LIME}; }
  @media (prefers-reduced-motion: reduce) {
    [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
  }

  /* ── RESPONSIVO ─────────────────────────────────────────── */
  html, body { max-width: 100%; overflow-x: clip; }
  @media (max-width: 900px) {
    .lp2-portal { grid-template-columns: 1fr !important; gap: 40px !important; }
    .lp2-step { grid-template-columns: 1fr !important; text-align: left !important; }
    .lp2-stats { grid-template-columns: 1fr 1fr !important; }
    .lp2-footer { grid-template-columns: 1fr !important; gap: 28px !important; }
    .lp2-pricing-row { grid-template-columns: 1fr !important; gap: 12px !important; text-align: left !important; }
  }
  @media (max-width: 640px) {
    .lp2-navlinks { display: none !important; }
    .lp2-section { padding-left: 20px !important; padding-right: 20px !important; }
    .lp2-stats { grid-template-columns: 1fr !important; }
  }
`;

// ── Componentes reutilizáveis ────────────────────────────────────────────────
function FilledBtn({ href, children, on = "dark" }: { href: string; children: React.ReactNode; on?: "dark" | "light" }) {
  const bg = on === "dark" ? PAPER : ABYSSAL;
  const color = on === "dark" ? ABYSSAL : PAPER;
  return <Link href={href} className="lp2-btn-filled" style={{ background: bg, color }}>{children}</Link>;
}

function GhostBtn({ href, children, color }: { href: string; children: React.ReactNode; color: string }) {
  return <Link href={href} className="lp2-btn-ghost" style={{ color, borderColor: color === PAPER ? GRAPHITE : LICHEN }}>{children}</Link>;
}

function ArrowCta({ href }: { href: string }) {
  return (
    <Link href={href} className="lp2-arrow-cta" aria-label="Continuar">
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ABYSSAL} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </Link>
  );
}

function Counter({ n, color }: { n: string; color: string }) {
  return (
    <span style={{ display: "inline-block", fontFamily: FM, fontSize: 13, fontWeight: 400, color, border: `1px solid ${color}`, borderRadius: 9999, padding: "4px 11px" }}>{n}</span>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FM, fontSize: 13, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function Divider({ on = "dark" }: { on?: "dark" | "light" }) {
  return <div style={{ borderTop: `1px solid ${on === "dark" ? GRAPHITE : LICHEN}` }} />;
}

// ── Hero com scroll-scrub em vídeo (public/hero-video.mp4) ──────────
function ScrollFrameHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap) return;
    video.load(); // ponytail: alguns navegadores não iniciam o load automaticamente só com o src no JSX

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // ponytail: reduced-motion mostra um frame fixo, sem scrubbing por scroll
      video.addEventListener("loadedmetadata", () => { video.currentTime = video.duration / 2; }, { once: true });
      return;
    }

    let raf = 0;
    const onScroll = () => {
      if (raf || !video.duration) return;
      raf = requestAnimationFrame(() => {
        const rect = wrap.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
        video.currentTime = progress * video.duration;
        raf = 0;
      });
    };
    video.addEventListener("loadedmetadata", onScroll, { once: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative", height: "250vh" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "120px 40px 88px" }}>
        <video ref={videoRef} src="/hero-video.mp4" muted playsInline preload="auto" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${ABYSSAL}cc, ${ABYSSAL}66 40%, ${ABYSSAL}cc)`, zIndex: 1 }} />
        <h1 style={{ position: "relative", zIndex: 2, fontFamily: F, fontSize: "clamp(32px, 5.2vw, 84px)", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: PAPER, margin: 0, maxWidth: 900 }}>
          O sistema que cuida do escritório enquanto você cuida da causa.
        </h1>
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 12 }}>
          <FilledBtn href="/registrar" on="dark">Criar conta grátis</FilledBtn>
          <GhostBtn href="/login" color={PAPER}>Entrar na área do cliente</GhostBtn>
          <ArrowCta href="/registrar" />
        </div>
      </div>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────
export default function LandingV2Page() {
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ fontFamily: F, color: PAPER, background: ABYSSAL, minHeight: "100vh", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 66, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", background: scrolled ? ABYSSAL : "transparent",
        borderBottom: scrolled ? `1px solid ${GRAPHITE}` : "1px solid transparent",
        transition: "background 400ms ease, border-color 400ms ease", color: PAPER,
      }}>
        <Link href="/" className="lp2-textlink" style={{ fontSize: 20, fontWeight: 400, letterSpacing: "-0.02em" }}>Lexo</Link>
        <div className="lp2-navlinks" style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {NAV_ITEMS.map(([href, label]) => (
            <a key={href} href={href} className="lp2-textlink" style={{ fontFamily: FM, fontSize: 13 }}>{label}</a>
          ))}
          <FilledBtn href="/login" on="dark">Entrar</FilledBtn>
        </div>
      </nav>

      <ScrollFrameHero />

      {/* ── TRUST BAR ── */}
      <div className="lp2-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ textAlign: "center", fontFamily: FM, fontSize: 13, color: GRAPHITE, letterSpacing: "-0.02em" }}>
          {trustNames.join("   ·   ")}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="recursos" className="lp2-section" style={{ maxWidth: 900, margin: "0 auto", padding: "64px 40px" }}>
        <div data-reveal="">
          {features.map((f) => (
            <div key={f.n}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 28, padding: "28px 0", alignItems: "baseline" }}>
                <Counter n={f.n} color={GRAPHITE} />
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: 22, fontWeight: 400 }}>{f.title}</span>
                    {f.novo && <span style={{ fontFamily: FM, fontSize: 11, color: LIME }}>· novo</span>}
                  </div>
                  <p style={{ fontSize: 18, lineHeight: 1.5, color: GRAPHITE, margin: "8px 0 0" }}>{f.desc}</p>
                </div>
              </div>
              <Divider on="dark" />
            </div>
          ))}
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="lp2-section" style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 40px" }}>
        <h2 data-reveal="" style={{ fontFamily: F, fontSize: 36, fontWeight: 400, letterSpacing: "-0.006em", margin: "0 0 48px" }}>
          Do primeiro processo ao escritório no automático
        </h2>
        {steps.map(({ n, title, desc }, i) => {
          const onRight = i % 2 === 1;
          return (
            <div key={n}>
              <div data-reveal="" className="lp2-step" style={{ display: "grid", gridTemplateColumns: onRight ? "1fr auto" : "auto 1fr", gap: 40, alignItems: "center", padding: "40px 0" }}>
                {onRight ? (
                  <>
                    <div style={{ maxWidth: 460, textAlign: "right", marginLeft: "auto" }}>
                      <h3 style={{ fontSize: 24, fontWeight: 400, margin: "0 0 8px" }}>{title}</h3>
                      <p style={{ fontSize: 18, lineHeight: 1.5, color: GRAPHITE, margin: 0 }}>{desc}</p>
                    </div>
                    <Counter n={n} color={GRAPHITE} />
                  </>
                ) : (
                  <>
                    <Counter n={n} color={GRAPHITE} />
                    <div style={{ maxWidth: 460 }}>
                      <h3 style={{ fontSize: 24, fontWeight: 400, margin: "0 0 8px" }}>{title}</h3>
                      <p style={{ fontSize: 18, lineHeight: 1.5, color: GRAPHITE, margin: 0 }}>{desc}</p>
                    </div>
                  </>
                )}
              </div>
              {i < steps.length - 1 && <Divider on="dark" />}
            </div>
          );
        })}
      </section>

      {/* ── LEXO IA ── */}
      <section id="ia" className="lp2-section" style={{ maxWidth: 780, margin: "0 auto", padding: "104px 40px", textAlign: "center" }}>
        <h2 data-reveal="" style={{ fontFamily: F, fontSize: "clamp(28px, 5vw, 58px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.7px", margin: 0 }}>
          Uma inteligência treinada para o jurídico brasileiro
        </h2>
        <p data-reveal="" style={{ fontSize: 18, lineHeight: 1.5, color: GRAPHITE, maxWidth: 620, margin: "28px auto 0" }}>
          Resuma processos de centenas de páginas em segundos, gere minutas, calcule prazos a partir das publicações e descubra padrões de decisão por vara, comarca e relator.
        </p>
        <div data-reveal="" style={{ marginTop: 48, textAlign: "left" }}>
          {iaBullets.map(([bold, text]) => (
            <div key={bold}>
              <div style={{ padding: "18px 0" }}>
                <Tag label={bold} />
                <div style={{ fontSize: 15, color: GRAPHITE, marginTop: 6, marginLeft: 14 }}>{text}</div>
              </div>
              <Divider on="dark" />
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="lp2-section lp2-stats" style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 40px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 40 }}>
        {statsData.map((s) => (
          <div key={s.display} data-reveal="">
            <div style={{ fontFamily: F, fontSize: 58, fontWeight: 400, letterSpacing: "-0.7px", lineHeight: 1 }}>{s.display}</div>
            <div style={{ fontFamily: FM, fontSize: 13, color: GRAPHITE, marginTop: 12 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── PORTAL DO CLIENTE (flip pra canvas claro, como o Newsroom do source) ── */}
      <section id="portal" style={{ background: BONE, color: ABYSSAL }}>
        <div className="lp2-section lp2-portal" style={{ maxWidth: 1200, margin: "0 auto", padding: "104px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div data-reveal="">
            <h2 style={{ fontFamily: F, fontSize: 36, fontWeight: 400, letterSpacing: "-0.22px", margin: 0, lineHeight: 1.2 }}>
              Seu cliente acompanha tudo, sem ligar para o escritório
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.5, color: GRAPHITE, margin: "20px 0 0" }}>
              Pelo acesso à <b style={{ fontWeight: 400, color: ABYSSAL }}>Área do Cliente</b>, ele vê o andamento dos processos, documentos, audiências e situação financeira — com transparência e em tempo real.
            </p>
            <div style={{ marginTop: 32 }}>
              <FilledBtn href="/login" on="light">Acessar Área do Cliente</FilledBtn>
            </div>
          </div>

          <div style={{ background: PAPER, border: `1px solid ${LICHEN}`, borderRadius: 20, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: ABYSSAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: PAPER }}>MS</span>
              <div>
                <div style={{ fontSize: 14 }}>Maria Silva</div>
                <div style={{ fontFamily: FM, fontSize: 11, color: GRAPHITE }}>Acompanhamento do processo</div>
              </div>
              <span style={{ marginLeft: "auto" }}><Tag label="Em dia" /></span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ border: `1px solid ${LICHEN}`, borderRadius: 12, padding: 13 }}>
                <div style={{ fontFamily: FM, fontSize: 11, color: GRAPHITE, marginBottom: 6 }}>PROC. 1023-45</div>
                <div style={{ fontSize: 14 }}>Última movimentação: juntada de petição</div>
              </div>
              <div style={{ border: `1px solid ${LICHEN}`, borderRadius: 12, padding: "10px 13px" }}>
                <div style={{ fontFamily: FM, fontSize: 11, color: GRAPHITE, marginBottom: 4 }}>Notificação</div>
                <div style={{ fontSize: 13 }}>Nova movimentação no Proc. 1023-45 — prazo de 5 dias a partir de hoje.</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[["Honorários", "Em dia"], ["Documentos", "7 arquivos"]].map(([label, value]) => (
                  <div key={label} style={{ flex: 1, border: `1px solid ${LICHEN}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ fontFamily: FM, fontSize: 11, color: GRAPHITE }}>{label}</div>
                    <div style={{ fontSize: 15, marginTop: 3 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS (segue no canvas claro) ── */}
      <section id="depoimentos" style={{ background: BONE, color: ABYSSAL }}>
        <div className="lp2-section" style={{ maxWidth: 780, margin: "0 auto", padding: "64px 40px" }}>
          {testimonials.map((t, i) => (
            <div key={t.name}>
              <div data-reveal="" style={{ padding: "40px 0" }}>
                <blockquote style={{ fontFamily: F, fontSize: 24, fontWeight: 400, lineHeight: 1.35, margin: 0 }}>{t.quote}</blockquote>
                <div style={{ fontFamily: FM, fontSize: 13, color: GRAPHITE, marginTop: 20 }}>{t.name} — {t.role}</div>
              </div>
              {i < testimonials.length - 1 && <Divider on="light" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── PREÇOS ── */}
      <section id="precos" className="lp2-section" style={{ maxWidth: 900, margin: "0 auto", padding: "64px 40px" }}>
        <h2 data-reveal="" style={{ fontFamily: F, fontSize: 36, fontWeight: 400, letterSpacing: "-0.22px", margin: "0 0 48px" }}>
          Preço por usuário, sem surpresas
        </h2>
        {plans.map((plan) => (
          <div key={plan.name}>
            <div data-reveal="" className="lp2-pricing-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 28, alignItems: "center", padding: "28px 0" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 400 }}>{plan.name}</span>
                  {plan.popular && <Tag label="Mais popular" />}
                </div>
                <div style={{ fontSize: 15, color: GRAPHITE, marginTop: 4 }}>{plan.tagline}</div>
              </div>
              <div style={{ fontFamily: F, fontSize: 24, whiteSpace: "nowrap" }}>
                {plan.price} <span style={{ fontFamily: FM, fontSize: 12, color: GRAPHITE }}>{plan.period}</span>
              </div>
              <FilledBtn href="/registrar" on="dark">{plan.cta}</FilledBtn>
            </div>
            <Divider on="dark" />
          </div>
        ))}
      </section>

      {/* ── CTA FINAL ── */}
      <section className="lp2-section" style={{ maxWidth: 900, margin: "0 auto", padding: "104px 40px", textAlign: "center" }}>
        <h2 data-reveal="" style={{ fontFamily: F, fontSize: "clamp(28px, 5vw, 58px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.7px", margin: 0 }}>
          Pronto para tirar o escritório do caos?
        </h2>
        <p data-reveal="" style={{ fontSize: 18, color: GRAPHITE, maxWidth: 480, margin: "20px auto 0" }}>
          Comece grátis hoje. Migramos seus processos e treinamos sua equipe sem custo.
        </p>
        <div data-reveal="" style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }}>
          <FilledBtn href="/registrar" on="dark">Começar teste de 14 dias</FilledBtn>
          <GhostBtn href="/registrar" color={PAPER}>Falar com vendas</GhostBtn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: VOID, color: GRAPHITE }}>
        <div className="lp2-section lp2-footer" style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 40px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40, fontFamily: FM, fontSize: 13 }}>
          <div>
            <div style={{ fontFamily: F, fontSize: 20, color: PAPER, marginBottom: 8 }}>Lexo</div>
            <div style={{ marginTop: 8 }}>© 2026 Lexo Tecnologia Jurídica</div>
            <div style={{ marginTop: 8 }}>LGPD &amp; ISO 27001</div>
          </div>
          <div>
            {["#recursos", "#precos"].map((href) => (
              <div key={href} style={{ marginTop: 8 }}>
                <a href={href} className="lp2-textlink">{href === "#recursos" ? "Recursos" : "Preços"}</a>
              </div>
            ))}
            <div style={{ marginTop: 8 }}><Link href="/login" className="lp2-textlink">Área do Cliente</Link></div>
          </div>
          <div>
            <div style={{ marginTop: 8 }}>São Paulo, Brasil</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
