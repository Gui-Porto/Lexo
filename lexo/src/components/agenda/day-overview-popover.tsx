"use client";

import {
  Popover, PopoverPortal, PopoverPositioner, PopoverPopup, PopoverTitle,
} from "@/components/ui/popover";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";
import { formatRelativeDay, formatTime } from "@/lib/format";
import { isAllDayUTC } from "@/lib/agenda-date";

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PRAZO:    { bg: "oklch(0.66 0.18 274 / 22%)", color: "oklch(0.80 0.14 274)" },
  AUDIENCIA:{ bg: "oklch(0.65 0.15 200 / 22%)", color: "oklch(0.78 0.13 200)" },
  REUNIAO:  { bg: "oklch(0.72 0.15 150 / 22%)", color: "oklch(0.78 0.13 150)" },
  OUTRO:    { bg: "oklch(0.45 0.02 264 / 28%)", color: "oklch(0.65 0.02 264)" },
};

const TYPE_ICON: Record<string, string> = {
  PRAZO: "⏰", AUDIENCIA: "⚖️", REUNIAO: "🤝", OUTRO: "📌",
};

export function DayOverviewPopover({
  dateKey,
  items,
  anchorRef,
  onClose,
  onSelectItem,
}: {
  dateKey: string;
  items: CalendarDeadline[];
  anchorRef: React.RefObject<Element | null>;
  onClose: () => void;
  onSelectItem: (e: React.MouseEvent<HTMLElement>, deadline: CalendarDeadline) => void;
}) {
  const dayDate = new Date(`${dateKey}T00:00:00.000Z`);
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  return (
    <Popover open onOpenChange={(open) => { if (!open) onClose(); }}>
      <PopoverPortal>
        <PopoverPositioner anchor={anchorRef} side="right" align="start">
          <PopoverPopup className="w-80 max-h-96 overflow-y-auto">
            <PopoverTitle>{formatRelativeDay(dayDate, todayUTC)}</PopoverTitle>
            <div className="mt-3 flex flex-col gap-1.5">
              {items.map((d, idx) => {
                const tc = TYPE_COLORS[d.type] ?? TYPE_COLORS.OUTRO;
                const isDone = d.status === "CONCLUIDO";
                const isLost = d.status === "PERDIDO";
                const time = isAllDayUTC(new Date(d.date)) ? null : formatTime(d.date);

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={(e) => onSelectItem(e, d)}
                    className="animate-fade-up"
                    style={{
                      "--delay": `${idx * 35}ms`,
                      display: "flex", alignItems: "center", gap: 8,
                      border: "none", cursor: "pointer", textAlign: "left",
                      background: "oklch(1 0 0 / 4%)", borderRadius: 8, padding: "7px 9px",
                      opacity: isDone || isLost ? 0.6 : 1,
                    } as React.CSSProperties}
                  >
                    <span style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color,
                      borderRadius: 6, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3,
                    }}>
                      <span>{TYPE_ICON[d.type] ?? "📌"}</span>
                      {time}
                    </span>
                    <span style={{
                      flex: 1, minWidth: 0, fontSize: 13, color: "oklch(0.92 0.01 264)",
                      textDecoration: isLost ? "line-through" : "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {d.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
