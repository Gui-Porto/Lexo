"use client";

import { useActionState } from "react";
import { updateUserRole } from "@/actions/usuarios";

const ROLE_OPTIONS = [
  { value: "ADVOGADO", label: "Advogado" },
  { value: "SECRETARIA", label: "Secretaria" },
  { value: "ADMIN", label: "Admin" },
];

export function UserRoleForm({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [, formAction, pending] = useActionState(updateUserRole, undefined);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        disabled={pending}
        onChange={(e) => {
          e.target.form?.requestSubmit();
        }}
        className="h-7 rounded-md border border-input bg-transparent px-2 text-xs text-foreground outline-none focus-visible:border-ring dark:bg-input/30 disabled:opacity-50"
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
