"use client";

import { useTransition } from "react";
import { toggleDeadlineStatus } from "@/actions/agenda";

export function DeadlineToggle({
  deadlineId,
  completed,
}: {
  deadlineId: string;
  completed: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      checked={completed}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => {
          toggleDeadlineStatus(deadlineId, e.target.checked);
        })
      }
      className="h-4 w-4"
    />
  );
}
