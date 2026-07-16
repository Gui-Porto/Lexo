"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Processo = { id: string; number: string; area: string | null; client: { name: string } };

type AnaliseResult = {
  probabilidade: number;
  duracaoMin: number;
  duracaoMax: number;
  valorMin: number;
  valorMax: number;
  tendencia: "favoravel" | "desfavoravel" | "incerto";
  casosSemelhantes: CasoSemelhante[];
};

type CasoSemelhante = {
  numero: string;
  tribunal: string;
  resultado: "Procedente" | "Improcedente" | "Parcialmente procedente";
  duracao: string;
  valor: string;
  similaridade: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const AC = "#cef79e";
const AC2 = "#cef79e";

const VARAS = [
  "Vara Cível",
  "Vara Trabalhista",
  "Vara Federal",
  "Vara Criminal",
  "Vara de Família",
  "Vara Fazendária",
  "Vara Empresarial",
];

const ASSUNTOS = [
  "Rescisão contratual",
  "Indenização por danos morais",
  "Cobrança de honorários",
  "Usucapião",
  "Alimentos",
  "Guarda de filhos",
  "Acidente de trabalho",
  "Contrato de trabalho",
  "Improbidade administrativa",
];

// ─── Mock analysis generator ──────────────────────────────────────────────────

function gerarAnalise(processo: Processo): AnaliseResult {
  const seed = processo.id.charCodeAt(0) + processo.id.charCodeAt(1);
  const prob = 55 + (seed % 30);
  const duracaoMin = 10 + (seed % 8);
  const duracaoMax = duracaoMin + 4 + (seed % 6);
  const valorMin = 20000 + (seed % 40) * 1000;
  const valorMax = valorMin + 20000 + (seed % 30) * 1000;
  const tendencia: AnaliseResult["tendencia"] =
    prob >= 65 ? "favoravel" : prob <= 45 ? "desfavoravel" : "incerto";

  const resultados: CasoSemelhante["resultado"][] = [
    "Procedente",
    "Parcialmente procedente",
    "Improcedente",
    "Procedente",
    "Parcialmente procedente",
  ];

  const tribunais = ["TJSP", "TJRJ", "TJMG", "STJ", "TST"];
  const casosSemelhantes: CasoSemelhante[] = Array.from({ length: 5 }, (_, i) => ({
    numero: `${1000000 + seed * 7 + i * 113}-${12 + i}.2023.8.26.0100`,
    tribunal: tribunais[i % tribunais.length],
    resultado: resultados[i],
    duracao: `${duracaoMin - 2 + i} meses`,
    valor: `R$ ${((valorMin + i * 5000) / 1000).toFixed(0)}k`,
    similaridade: 96 - i * 7,
  }));

  return { probabilidade: prob, duracaoMin, duracaoMax, valorMin, valorMax, tendencia, casosSemelhantes };
}

function formatCurrency(v: number) {
  return v >= 1000
    ? `R$ ${(v / 1000).toFixed(0)}k`
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Ring chart ───────────────────────────────────────────────────────────────

function RingChart({ pct, color }: { pct: number; color: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={64} cy={64} r={r} fill="none" stroke="#283738" strokeWidth={12} />
      <circle
        cx={64}
        cy={64}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x={64} y={60} textAnchor="middle" fill="white" fontSize={24} fontWeight={700} fontFamily="Geist, sans-serif">
        {pct}%
      </text>
      <text x={64} y={78} textAnchor="middle" fill="#93a09f" fontSize={11} fontFamily="Geist, sans-serif">
        êxito
      </text>
    </svg>
  );
}

// ─── Result badge ─────────────────────────────────────────────────────────────

const RESULTADO_STYLES: Record<CasoSemelhante["resultado"], { bg: string; color: string }> = {
  Procedente: { bg: "rgb(5 150 105 / 0.12)", color: "#047857" },
  "Parcialmente procedente": { bg: "rgb(217 119 6 / 0.10)", color: "#b45309" },
  Improcedente: { bg: "rgb(225 29 72 / 0.10)", color: "#be123c" },
};

// ─── Main component ───────────────────────────────────────────────────────────

export function JurimtriaAnalyzer({ processos }: { processos: Processo[] }) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [vara, setVara] = useState<string>("");
  const [assunto, setAssunto] = useState<string>("");
  const [analise, setAnalise] = useState<AnaliseResult | null>(null);
  const [loading, setLoading] = useState(false);

  const processo = processos.find((p) => p.id === selectedId);

  async function handleAnalisar() {
    if (!processo) return;
    setLoading(true);
    setAnalise(null);
    await new Promise((r) => setTimeout(r, 1800));
    setAnalise(gerarAnalise(processo));
    setLoading(false);
  }

  const tendenciaColor =
    analise?.tendencia === "favoravel"
      ? "#047857"
      : analise?.tendencia === "desfavoravel"
        ? "#be123c"
        : "#b45309";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Filtros */}
      <div
        style={{
          background: "#222f30",
          border: "1px solid #4d5757",
          borderRadius: 16,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${AC}18`,
              border: `1px solid ${AC}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke={AC} strokeWidth={2}>
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Parâmetros da análise</span>
        </div>

        <div className="r-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          {/* Processo */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Processo
            </label>
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setAnalise(null); }}
              style={{
                background: "#1a2425",
                border: "1px solid #4d5757",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                color: "white",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Selecione um processo…</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number} — {p.client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vara */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Vara / Tribunal
            </label>
            <select
              value={vara}
              onChange={(e) => setVara(e.target.value)}
              style={{
                background: "#1a2425",
                border: "1px solid #4d5757",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                color: vara ? "white" : "#93a09f",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Qualquer vara</option>
              {VARAS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Assunto */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Assunto
            </label>
            <select
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              style={{
                background: "#1a2425",
                border: "1px solid #4d5757",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                color: assunto ? "white" : "#93a09f",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Qualquer assunto</option>
              {ASSUNTOS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Botão */}
          <button
            onClick={handleAnalisar}
            disabled={!selectedId || loading}
            style={{
              background: selectedId && !loading ? `linear-gradient(135deg, ${AC}, ${AC2})` : "#283738",
              border: "none",
              borderRadius: 10,
              padding: "10px 24px",
              fontSize: 13,
              fontWeight: 600,
              color: selectedId && !loading ? "#222f30" : "#93a09f",
              cursor: selectedId && !loading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.3} />
                  <path d="M12 3a9 9 0 019 9" />
                </svg>
                Analisando…
              </>
            ) : (
              <>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analisar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="r-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: "#222f30",
                border: "1px solid #4d5757",
                borderRadius: 16,
                padding: 28,
                height: 160,
                animation: "pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Resultado */}
      {analise && !loading && (
        <>
          {/* Banner de tendência */}
          <div
            style={{
              background: `${tendenciaColor}10`,
              border: `1px solid ${tendenciaColor}30`,
              borderRadius: 12,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tendenciaColor} strokeWidth={2}>
              {analise.tendencia === "favoravel" ? (
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : analise.tendencia === "desfavoravel" ? (
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500, color: tendenciaColor }}>
              Tendência{" "}
              {analise.tendencia === "favoravel"
                ? "favorável"
                : analise.tendencia === "desfavoravel"
                  ? "desfavorável"
                  : "incerta"}{" "}
              com base em {analise.casosSemelhantes.length} casos semelhantes
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#93a09f" }}>
              Análise gerada por IA · dados ilustrativos
            </span>
          </div>

          {/* KPI cards */}
          <div className="r-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {/* Probabilidade de êxito */}
            <div
              style={{
                background: "#222f30",
                border: "1px solid #4d5757",
                borderRadius: 16,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <RingChart pct={analise.probabilidade} color={AC} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Probabilidade de êxito
                </p>
                <p style={{ fontSize: 11, color: "#93a09f", marginTop: 4 }}>
                  Baseado na jurimetria local
                </p>
              </div>
            </div>

            {/* Duração estimada */}
            <div
              style={{
                background: "#222f30",
                border: "1px solid #4d5757",
                borderRadius: 16,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgb(8 145 178 / 0.12)",
                  border: "1px solid rgb(8 145 178 / 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth={2}>
                  <circle cx={12} cy={12} r={10} />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <p style={{ fontSize: 32, fontWeight: 700, color: "#0891b2", fontVariantNumeric: "tabular-nums" }}>
                {analise.duracaoMin}–{analise.duracaoMax}
              </p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#93a09f", marginTop: -8 }}>meses</p>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                Duração estimada
              </p>
              <p style={{ fontSize: 11, color: "#93a09f" }}>Da distribuição ao trânsito</p>
            </div>

            {/* Valor provável */}
            <div
              style={{
                background: "#222f30",
                border: "1px solid #4d5757",
                borderRadius: 16,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgb(5 150 105 / 0.12)",
                  border: "1px solid rgb(5 150 105 / 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2}>
                  <line x1={12} y1={1} x2={12} y2={23} />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: "#059669", fontVariantNumeric: "tabular-nums", textAlign: "center" }}>
                {formatCurrency(analise.valorMin)} – {formatCurrency(analise.valorMax)}
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#93a09f", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                Valor provável
              </p>
              <p style={{ fontSize: 11, color: "#93a09f" }}>Faixa de condenação estimada</p>
            </div>
          </div>

          {/* Tabela de casos semelhantes */}
          <div
            style={{
              background: "#222f30",
              border: "1px solid #4d5757",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                borderBottom: "1px solid #4d5757",
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth={2}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Casos semelhantes</span>
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: `${AC}18`,
                  color: AC,
                  border: `1px solid ${AC}30`,
                  borderRadius: 6,
                  padding: "2px 8px",
                }}
              >
                {analise.casosSemelhantes.length} encontrados
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #4d5757" }}>
                  {["Número", "Tribunal", "Resultado", "Duração", "Valor", "Similaridade"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 24px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#93a09f",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analise.casosSemelhantes.map((caso, i) => {
                  const estilo = RESULTADO_STYLES[caso.resultado];
                  return (
                    <tr
                      key={caso.numero}
                      style={{
                        borderBottom: i < analise.casosSemelhantes.length - 1 ? "1px solid #4d5757" : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#222f30"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                    >
                      <td style={{ padding: "14px 24px", fontSize: 12, color: "#93a09f", fontFamily: "monospace" }}>
                        {caso.numero}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 500, color: "white" }}>
                        {caso.tribunal}
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            background: estilo.bg,
                            color: estilo.color,
                            borderRadius: 6,
                            padding: "3px 10px",
                          }}
                        >
                          {caso.resultado}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#93a09f" }}>
                        {caso.duracao}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#93a09f" }}>
                        {caso.valor}
                      </td>
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#283738" }}>
                            <div
                              style={{
                                height: "100%",
                                borderRadius: 2,
                                background: AC,
                                width: `${caso.similaridade}%`,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 500, color: AC, minWidth: 32 }}>
                            {caso.similaridade}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!analise && !loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 32px",
            gap: 16,
            background: "#1a2425",
            border: "1px dashed #4d5757",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: `${AC}12`,
              border: `1px solid ${AC}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth={1.5}>
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "white" }}>Selecione um processo para analisar</p>
            <p style={{ fontSize: 13, color: "#93a09f", marginTop: 4 }}>
              A IA cruzará dados jurisprudenciais para estimar probabilidade, duração e valor.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
