"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteUser } from "@/actions/usuarios";

const ROLE_OPTIONS = [
  { value: "ADVOGADO", label: "Advogado" },
  { value: "SECRETARIA", label: "Secretaria" },
  { value: "ADMIN", label: "Admin" },
];

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState(inviteUser, undefined);

  useEffect(() => {
    if (state && "success" in state) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-name">Nome</Label>
        <Input id="invite-name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input id="invite-email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Papel</Label>
        <select
          id="invite-role"
          name="role"
          defaultValue="ADVOGADO"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando convite..." : "Enviar convite por email"}
      </Button>
    </form>
  );
}
