"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateInvoiceStatus } from "@/actions/financeiro";

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => updateInvoiceStatus(invoiceId, "PAGO"))}
    >
      Marcar como pago
    </Button>
  );
}
