"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormSection, FormFooter } from "@/components/ui/form-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/actions/financeiro";

const STATUS_OPTIONS = ["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"];

type InvoiceFormValues = {
  clientId: string;
  caseId?: string | null;
  description: string;
  amount: number | string;
  status: string;
  dueDate: string;
};

export function InvoiceForm({
  action,
  clients,
  cases,
  defaultValues,
  submitLabel = "Criar honorário",
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  clients: { id: string; name: string }[];
  cases: { id: string; number: string }[];
  defaultValues?: InvoiceFormValues;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="max-w-2xl">
        <CardContent className="space-y-6">
          <FormSection label="Honorário">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                defaultValue={defaultValues?.description}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Select name="clientId" defaultValue={defaultValues?.clientId}>
                <SelectTrigger id="clientId" className="w-full">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseId">Processo (opcional)</Label>
              <Select name="caseId" defaultValue={defaultValues?.caseId ?? ""}>
                <SelectTrigger id="caseId" className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>

          <FormSection label="Pagamento">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={defaultValues?.amount !== undefined ? String(defaultValues.amount) : ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Vencimento</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={defaultValues?.dueDate}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={defaultValues?.status ?? "PENDENTE"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>

          <FormFooter error={state?.error} cancelHref="/financeiro">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : submitLabel}
            </Button>
          </FormFooter>
        </CardContent>
      </Card>
    </form>
  );
}
