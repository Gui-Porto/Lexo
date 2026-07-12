"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FormSection, FormFooter } from "@/components/ui/form-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/actions/agenda";

const TYPE_OPTIONS = ["PRAZO", "AUDIENCIA", "REUNIAO", "OUTRO"];

type DeadlineFormValues = {
  caseId?: string;
  title: string;
  type: string;
  date: string;
  time?: string;
  description: string | null;
};

export function DeadlineForm({
  action,
  cases,
  defaultValues,
  submitLabel = "Criar prazo",
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  cases: { id: string; number: string }[];
  defaultValues?: DeadlineFormValues;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="max-w-2xl">
        <CardContent className="space-y-6">
          <FormSection label="Identificação">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" defaultValue={defaultValues?.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseId">Processo</Label>
              <Select name="caseId" defaultValue={defaultValues?.caseId}>
                <SelectTrigger id="caseId" className="w-full">
                  <SelectValue placeholder="Selecione um processo" />
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

          <FormSection label="Detalhes">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select name="type" defaultValue={defaultValues?.type ?? "PRAZO"}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" defaultValue={defaultValues?.date} required />
              </div>
              <div className="w-32 space-y-2">
                <Label htmlFor="time">
                  Hora <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input id="time" name="time" type="time" defaultValue={defaultValues?.time ?? ""} />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={defaultValues?.description ?? ""}
              />
            </div>
          </FormSection>

          <FormFooter error={state?.error} cancelHref="/agenda">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : submitLabel}
            </Button>
          </FormFooter>
        </CardContent>
      </Card>
    </form>
  );
}
