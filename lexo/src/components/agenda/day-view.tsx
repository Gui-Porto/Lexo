"use client";

import { ViewTransition } from "react";
import { TimeGrid } from "@/components/agenda/time-grid";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";
import { dayKey, WEEKDAY_LONG } from "@/lib/agenda-date";

export function DayView({
  day,
  deadlines,
  cases,
}: {
  day: string; // "YYYY-MM-DD"
  deadlines: CalendarDeadline[];
  cases: { id: string; number: string }[];
}) {
  const d = new Date(`${day}T00:00:00.000Z`);
  const todayKey = dayKey(new Date());
  const key = dayKey(d);

  return (
    <ViewTransition name={`day-${key}`}>
      <TimeGrid
        days={[{ key, label: WEEKDAY_LONG[d.getUTCDay()], isToday: key === todayKey }]}
        deadlines={deadlines}
        cases={cases}
      />
    </ViewTransition>
  );
}
