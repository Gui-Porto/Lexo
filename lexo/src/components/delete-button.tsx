"use client";

import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  label = "Excluir",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Tem certeza que deseja excluir?")) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        {label}
      </Button>
    </form>
  );
}
