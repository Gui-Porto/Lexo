"use client";

import { useState } from "react";
import { ClientForm } from "./client-form";
import { PdfExtractor } from "@/components/pdf-extractor";
import type { ActionResult } from "@/actions/clientes";

type Prefill = {
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export function ClientFormWrapper({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValues?: Prefill;
  submitLabel: string;
}) {
  const [prefill, setPrefill] = useState<Prefill>(
    defaultValues ?? { name: "", document: null, email: null, phone: null, notes: null }
  );
  const [formKey, setFormKey] = useState(0);

  function handleExtract(data: Record<string, string | null>) {
    setPrefill({
      name: data.name ?? "",
      document: data.document ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
    });
    setFormKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      <PdfExtractor tipo="cliente" onExtract={handleExtract} />
      <ClientForm
        key={formKey}
        action={action}
        defaultValues={prefill}
        submitLabel={submitLabel}
      />
    </div>
  );
}
