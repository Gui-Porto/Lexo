"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormSection, FormFooter } from "@/components/ui/form-section";
import type { ActionResult } from "@/actions/clientes";

type ClientFormValues = {
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaultValues?: ClientFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="max-w-2xl">
        <CardContent className="space-y-6">
          <FormSection label="Identificação">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={defaultValues?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">Documento (CPF/CNPJ)</Label>
              <Input
                id="document"
                name="document"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                defaultValue={defaultValues?.document ?? ""}
              />
            </div>
          </FormSection>

          <FormSection label="Contato">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
            </div>
          </FormSection>

          <FormSection label="Observações">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} />
            </div>
          </FormSection>

          <FormFooter error={state?.error} cancelHref="/clientes">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : submitLabel}
            </Button>
          </FormFooter>
        </CardContent>
      </Card>
    </form>
  );
}
