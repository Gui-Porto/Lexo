"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverPortal, PopoverPositioner, PopoverPopup, PopoverTitle,
} from "@/components/ui/popover";
import { createDeadline, updateDeadline, type ActionResult } from "@/actions/agenda";
import type { CalendarDeadline } from "@/components/agenda/calendar-view";
import { dateInputValue, timeInputValue } from "@/lib/agenda-date";

const TYPE_OPTIONS = ["PRAZO", "AUDIENCIA", "REUNIAO", "OUTRO"];

export type PopoverSlot =
  | { mode: "create"; dateKey: string; hour: number }
  | { mode: "edit"; deadline: CalendarDeadline };

export function EventPopover({
  slot,
  cases,
  anchorRef,
  onClose,
}: {
  slot: PopoverSlot;
  cases: { id: string; number: string }[];
  anchorRef: React.RefObject<Element | null>;
  onClose: () => void;
}) {
  const searchParams = useSearchParams();
  const isEdit = slot.mode === "edit";
  const action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult> =
    isEdit ? updateDeadline.bind(null, slot.deadline.id) : createDeadline;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, undefined);

  const successMessage = isEdit ? "Prazo atualizado com sucesso" : "Prazo criado com sucesso";
  const qs = searchParams.toString();
  const returnTo = `/agenda?${qs ? `${qs}&` : ""}toast=${encodeURIComponent(successMessage)}`;

  const defaultDate = isEdit ? dateInputValue(new Date(slot.deadline.date)) : slot.dateKey;
  const defaultTime = isEdit
    ? timeInputValue(new Date(slot.deadline.date))
    : `${String(slot.hour).padStart(2, "0")}:00`;

  return (
    <Popover open onOpenChange={(open) => { if (!open) onClose(); }}>
      <PopoverPortal>
        <PopoverPositioner anchor={anchorRef} side="right" align="start">
          <PopoverPopup>
            <PopoverTitle>{isEdit ? "Editar compromisso" : "Novo compromisso"}</PopoverTitle>
            <form action={formAction} className="mt-3 space-y-3">
              <input type="hidden" name="returnTo" value={returnTo} />

              <div className="space-y-1.5">
                <Label htmlFor="ep-title">Título</Label>
                <Input id="ep-title" name="title" defaultValue={isEdit ? slot.deadline.title : ""} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ep-caseId">Processo</Label>
                <Select name="caseId" defaultValue={isEdit ? (slot.deadline.caseId ?? undefined) : undefined}>
                  <SelectTrigger id="ep-caseId" className="w-full">
                    <SelectValue placeholder="Selecione um processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ep-type">Tipo</Label>
                <Select name="type" defaultValue={isEdit ? slot.deadline.type : "PRAZO"}>
                  <SelectTrigger id="ep-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="ep-date">Data</Label>
                  <Input id="ep-date" name="date" type="date" defaultValue={defaultDate} required />
                </div>
                <div className="w-28 space-y-1.5">
                  <Label htmlFor="ep-time">Hora</Label>
                  <Input id="ep-time" name="time" type="time" defaultValue={defaultTime} />
                </div>
              </div>

              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
