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
import type { ActionResult } from "@/actions/processos";

type CaseFormValues = {
  clientId: string;
  number: string;
  area: string | null;
  status: string;
  description: string | null;
  responsavelId?: string | null;
};

const STATUS_OPTIONS = ["ATIVO", "SUSPENSO", "ARQUIVADO", "ENCERRADO"];

const AREA_OPTIONS = [
  "Cível",
  "Trabalhista",
  "Criminal",
  "Família",
  "Previdenciário",
  "Tributário",
  "Administrativo",
  "Imobiliário",
  "Empresarial",
  "Consumidor",
  "Outros",
];

export function CaseForm({
  action,
  clients,
  users,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>;
  clients: { id: string; name: string }[];
  users?: { id: string; name: string }[];
  defaultValues?: CaseFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="number">Número do processo</Label>
        <Input id="number" name="number" defaultValue={defaultValues?.number} required />
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
        <Label htmlFor="area">Área jurídica</Label>
        <Select name="area" defaultValue={defaultValues?.area ?? ""}>
          <SelectTrigger id="area" className="w-full">
            <SelectValue placeholder="Selecione a área" />
          </SelectTrigger>
          <SelectContent>
            {AREA_OPTIONS.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={defaultValues?.status ?? "ATIVO"}>
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

      {users && users.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="responsavelId">Responsável</Label>
          <Select name="responsavelId" defaultValue={defaultValues?.responsavelId ?? ""}>
            <SelectTrigger id="responsavelId" className="w-full">
              <SelectValue placeholder="Sem responsável" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
