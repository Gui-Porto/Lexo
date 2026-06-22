import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { LiveTimer, TimesheetForms, DeleteEntryButton } from "./timer-client";

const AC = "oklch(0.66 0.18 274)";
const AC2 = "oklch(0.72 0.14 300)";

function fmtDuration(mins: number | null): string {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayKey(date: Date): string {
  const d = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(key: string): string {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (key === today) return "Hoje";
  if (key === yesterday) return "Ontem";
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

export default async function TimesheetPage() {
  const session = await requireSession();
  const orgId = session.user.organizationId;
  const userId = session.user.id;

  // Last 7 days of entries for this user + active timer
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const [entries, activeCases] = await Promise.all([
    db.timeEntry.findMany({
      where: { organizationId: orgId, userId, startedAt: { gte: sevenDaysAgo } },
      include: { case: { select: { id: true, number: true, area: true } } },
      orderBy: { startedAt: "desc" },
    }),
    db.case.findMany({
      where: { organizationId: orgId, status: "ATIVO" },
      select: { id: true, number: true, area: true },
      orderBy: { number: "asc" },
    }),
  ]);

  const activeEntry = entries.find((e) => !e.endedAt) ?? null;
  const completedEntries = entries.filter((e) => e.endedAt !== null);

  // Group completed by day
  const groups = new Map<string, typeof completedEntries>();
  for (const e of completedEntries) {
    const k = dayKey(e.startedAt);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(e);
  }

  // Total today
  const todayKey = dayKey(new Date());
  const todayEntries = groups.get(todayKey) ?? [];
  const todayMins = todayEntries.reduce((s, e) => s + (e.durationMinutes ?? 0), 0);
  const weekMins = completedEntries.reduce((s, e) => s + (e.durationMinutes ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${AC}, ${AC2})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Timesheet
          </h1>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: `${AC}18`,
              color: "oklch(0.72 0.18 274)",
              border: `1px solid ${AC}30`,
              borderRadius: 6,
              padding: "3px 8px",
            }}
          >
            NOVO
          </span>
        </div>
        <p style={{ fontSize: 14, color: "oklch(0.55 0.02 264)" }}>
          Controle o tempo dedicado a cada processo e registre suas horas faturáveis.
        </p>
      </div>

      {/* KPI bar */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { label: "Hoje", value: fmtDuration(todayMins), sub: `${todayEntries.length} lançamento${todayEntries.length !== 1 ? "s" : ""}` },
          { label: "Esta semana", value: fmtDuration(weekMins), sub: `${completedEntries.length} lançamento${completedEntries.length !== 1 ? "s" : ""}` },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            style={{
              flex: "1 1 180px",
              background: "oklch(0.115 0.018 264)",
              border: "1px solid oklch(0.22 0.018 264)",
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <p style={{ fontSize: 12, color: "oklch(0.50 0.02 264)", marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>{value}</p>
            <p style={{ fontSize: 12, color: "oklch(0.45 0.02 264)", marginTop: 2 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Active timer */}
      {activeEntry && (
        <LiveTimer
          entryId={activeEntry.id}
          startedAt={activeEntry.startedAt}
          caseNumber={activeEntry.case?.number}
          description={activeEntry.description}
        />
      )}

      {/* Forms */}
      <Suspense fallback={null}>
        <TimesheetForms cases={activeCases} />
      </Suspense>

      {/* Log */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {groups.size === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 32px",
              gap: 16,
              background: "oklch(0.09 0.015 264)",
              border: "1px dashed oklch(0.25 0.018 264)",
              borderRadius: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `${AC}12`,
                border: `1px solid ${AC}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              ⏱
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "white" }}>Nenhum lançamento ainda</p>
              <p style={{ fontSize: 13, color: "oklch(0.45 0.02 264)", marginTop: 4 }}>
                Inicie um timer ou adicione horas manualmente.
              </p>
            </div>
          </div>
        ) : (
          Array.from(groups.entries()).map(([day, dayEntries]) => {
            const dayTotal = dayEntries.reduce((s, e) => s + (e.durationMinutes ?? 0), 0);
            return (
              <div key={day}>
                {/* Day header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "oklch(0.55 0.02 264)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dayLabel(day)}
                  </span>
                  <div style={{ flex: 1, height: 1, background: "oklch(0.22 0.018 264)" }} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: AC,
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtDuration(dayTotal)}
                  </span>
                </div>

                {/* Entries */}
                <div
                  style={{
                    background: "oklch(0.115 0.018 264)",
                    border: "1px solid oklch(0.22 0.018 264)",
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  {dayEntries.map((e, i) => (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "14px 20px",
                        borderBottom:
                          i < dayEntries.length - 1 ? "1px solid oklch(0.18 0.015 264)" : "none",
                      }}
                    >
                      {/* Duration badge */}
                      <div
                        style={{
                          flexShrink: 0,
                          minWidth: 52,
                          background: `${AC}12`,
                          border: `1px solid ${AC}22`,
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: AC,
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {fmtDuration(e.durationMinutes)}
                      </div>

                      {/* Description + case */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.description || "Sem descrição"}
                        </p>
                        {e.case && (
                          <p style={{ fontSize: 12, color: AC, marginTop: 2, fontFamily: "monospace" }}>
                            {e.case.number}
                            {e.case.area ? ` · ${e.case.area}` : ""}
                          </p>
                        )}
                      </div>

                      {/* Time range */}
                      <span
                        style={{
                          fontSize: 12,
                          color: "oklch(0.45 0.02 264)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {fmtTime(e.startedAt)}
                        {e.endedAt ? ` – ${fmtTime(e.endedAt)}` : ""}
                      </span>

                      {/* Delete */}
                      <DeleteEntryButton entryId={e.id} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
