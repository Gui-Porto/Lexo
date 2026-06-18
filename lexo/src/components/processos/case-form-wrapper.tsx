"use client";

import { useState } from "react";
import { CaseForm } from "./case-form";
import { PdfExtractor } from "@/components/pdf-extractor";
import type { ActionResult } from "@/actions/processos";

type Prefill = {
  clientId: string;
  number: string;
  area: string | null;
  status: string;
  description: string | null;
  responsavelId?: string | null;
};

export function CaseFormWrapper({
  action,
  clients,
  users,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  clients: { id: string; name: string }[];
  users?: { id: string; name: string }[];
  defaultValues?: Prefill;
  submitLabel: string;
}) {
  const [prefill, setPrefill] = useState<Prefill>(
    defaultValues ?? { clientId: "", number: "", area: null, status: "ATIVO", description: null }
  );
  const [formKey, setFormKey] = useState(0);

  function handleExtract(data: Record<string, string | null>) {
    setPrefill((prev) => ({
      ...prev,
      number: data.number ?? prev.number,
      area: data.area ?? prev.area,
      description: data.description ?? prev.description,
    }));
    setFormKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      <PdfExtractor tipo="processo" onExtract={handleExtract} />
      <CaseForm
        key={formKey}
        action={action}
        clients={clients}
        users={users}
        defaultValues={prefill}
        submitLabel={submitLabel}
      />
    </div>
  );
}
