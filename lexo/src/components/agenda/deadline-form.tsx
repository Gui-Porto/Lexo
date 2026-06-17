"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  caseId: string;
  title: string;
  type: string;
  date: string;
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
    <form action={formAction} className="max-w-md space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Input id="date" name="date" type="date" defaultValue={defaultValues?.date} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
