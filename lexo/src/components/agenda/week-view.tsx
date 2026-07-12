"use client";

import { TimeGrid } from "@/components/agenda/time-grid";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";
import { addDaysUTC, DAY_NAMES_SHORT, dayKey } from "@/lib/agenda-date";

export function WeekView({
  weekStart,
  deadlines,
  cases,
}: {
  weekStart: string; // "YYYY-MM-DD", domingo
  deadlines: CalendarDeadline[];
  cases: { id: string; number: string }[];
}) {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const todayKey = dayKey(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDaysUTC(start, i);
    const key = dayKey(d);
    return {
      key,
      label: `${DAY_NAMES_SHORT[d.getUTCDay()]} ${d.getUTCDate()}`,
      isToday: key === todayKey,
    };
  });

  return <TimeGrid days={days} deadlines={deadlines} cases={cases} />;
}
