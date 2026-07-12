"use client";

import type { CalendarDeadline } from "@/components/agenda/calendar-view";

export type PopoverSlot =
  | { mode: "create"; dateKey: string; hour: number }
  | { mode: "edit"; deadline: CalendarDeadline };

export function EventPopover(_props: {
  slot: PopoverSlot;
  cases: { id: string; number: string }[];
  anchorRef: React.RefObject<Element | null>;
  onClose: () => void;
}) {
  return null;
}
