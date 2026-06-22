"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export type ActionResult = { error: string } | undefined;

// ─── Start timer ──────────────────────────────────────────────────────────────

const startSchema = z.object({
  caseId: z.string().optional(),
  description: z.string().optional(),
});

export async function startTimer(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = startSchema.safeParse({
    caseId: formData.get("caseId") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  // Verify case belongs to org
  if (parsed.data.caseId) {
    const c = await db.case.findFirst({
      where: { id: parsed.data.caseId, organizationId: session.user.organizationId },
    });
    if (!c) return { error: "Processo não encontrado" };
  }

  // Stop any running timer for this user first
  const running = await db.timeEntry.findFirst({
    where: { userId: session.user.id, endedAt: null },
  });
  if (running) {
    const now = new Date();
    const mins = Math.round((now.getTime() - running.startedAt.getTime()) / 60000);
    await db.timeEntry.update({
      where: { id: running.id },
      data: { endedAt: now, durationMinutes: mins },
    });
  }

  await db.timeEntry.create({
    data: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      userName: session.user.name ?? session.user.email ?? "Usuário",
      caseId: parsed.data.caseId ?? null,
      description: parsed.data.description ?? null,
      startedAt: new Date(),
    },
  });

  revalidatePath("/timesheet");
}

// ─── Stop timer ───────────────────────────────────────────────────────────────

export async function stopTimer(entryId: string): Promise<ActionResult> {
  const session = await requireSession();

  const entry = await db.timeEntry.findFirst({
    where: { id: entryId, userId: session.user.id, organizationId: session.user.organizationId },
  });
  if (!entry) return { error: "Entrada não encontrada" };
  if (entry.endedAt) return { error: "Timer já encerrado" };

  const now = new Date();
  const mins = Math.round((now.getTime() - entry.startedAt.getTime()) / 60000);
  await db.timeEntry.update({
    where: { id: entryId },
    data: { endedAt: now, durationMinutes: Math.max(1, mins) },
  });

  revalidatePath("/timesheet");
}

// ─── Add manual entry ─────────────────────────────────────────────────────────

const manualSchema = z.object({
  caseId: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1, "Data obrigatória"),
  hours: z.coerce.number().int().min(0).max(23),
  minutes: z.coerce.number().int().min(0).max(59),
});

export async function addManualEntry(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = manualSchema.safeParse({
    caseId: formData.get("caseId") || undefined,
    description: formData.get("description") || undefined,
    date: formData.get("date"),
    hours: formData.get("hours"),
    minutes: formData.get("minutes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const totalMins = parsed.data.hours * 60 + parsed.data.minutes;
  if (totalMins === 0) return { error: "Informe pelo menos 1 minuto" };

  if (parsed.data.caseId) {
    const c = await db.case.findFirst({
      where: { id: parsed.data.caseId, organizationId: session.user.organizationId },
    });
    if (!c) return { error: "Processo não encontrado" };
  }

  const startedAt = new Date(`${parsed.data.date}T00:00:00`);
  const endedAt = new Date(startedAt.getTime() + totalMins * 60000);

  await db.timeEntry.create({
    data: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      userName: session.user.name ?? session.user.email ?? "Usuário",
      caseId: parsed.data.caseId ?? null,
      description: parsed.data.description ?? null,
      startedAt,
      endedAt,
      durationMinutes: totalMins,
    },
  });

  revalidatePath("/timesheet");
}

// ─── Delete entry ─────────────────────────────────────────────────────────────

export async function deleteEntry(entryId: string): Promise<ActionResult> {
  const session = await requireSession();
  await db.timeEntry.deleteMany({
    where: { id: entryId, organizationId: session.user.organizationId },
  });
  revalidatePath("/timesheet");
  return undefined;
}
