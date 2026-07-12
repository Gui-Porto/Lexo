"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { decryptSecret } from "@/lib/crypto";
import { syncDeadlineToGoogle, deleteGoogleEvent } from "@/lib/google-calendar";
import { combineDateTimeUTC } from "@/lib/agenda-date";

const deadlineSchema = z.object({
  caseId:      z.string().min(1, "Selecione um processo"),
  title:       z.string().min(1, "Título é obrigatório"),
  type:        z.enum(["PRAZO", "AUDIENCIA", "REUNIAO", "OUTRO"]),
  date:        z.string().min(1, "Data é obrigatória"),
  time:        z.string().optional(),
  description: z.string().optional(),
});

export type ActionResult = { error: string } | undefined;

async function getUserGoogleToken(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { googleCalendarEnabled: true, googleRefreshToken: true },
  });
  if (!user?.googleCalendarEnabled || !user.googleRefreshToken) return null;
  return decryptSecret(user.googleRefreshToken);
}

export async function createDeadline(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = deadlineSchema.safeParse({
    caseId:      formData.get("caseId"),
    title:       formData.get("title"),
    type:        formData.get("type") ?? "PRAZO",
    date:        formData.get("date"),
    time:        formData.get("time") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const ownCase = await db.case.findFirst({
    where: { id: parsed.data.caseId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!ownCase) return { error: "Processo não encontrado" };

  const deadlineDate = combineDateTimeUTC(parsed.data.date, parsed.data.time);

  let created: { id: string };
  try {
    created = await db.deadline.create({
      data: {
        caseId:      parsed.data.caseId,
        title:       parsed.data.title,
        type:        parsed.data.type,
        description: parsed.data.description,
        date:        deadlineDate,
        organizationId: session.user.organizationId,
      },
      select: { id: true },
    });
  } catch (e) {
    console.error("[agenda] erro ao salvar prazo:", e);
    return { error: "Erro ao salvar prazo. Tente novamente." };
  }

  await logActivity({
    organizationId: session.user.organizationId,
    caseId: parsed.data.caseId,
    userId: session.user.id,
    userName: session.user.name ?? "Usuário",
    action: `Prazo "${parsed.data.title}" criado`,
  });

  // Fire-and-forget Google Calendar sync
  const refreshToken = await getUserGoogleToken(session.user.id);
  if (refreshToken) {
    const eventId = await syncDeadlineToGoogle(refreshToken, {
      id:          created.id,
      title:       parsed.data.title,
      type:        parsed.data.type,
      date:        deadlineDate,
      description: parsed.data.description,
    });
    if (eventId) {
      await db.deadline.update({
        where: { id: created.id },
        data: { googleEventId: eventId },
      });
    }
  }

  revalidatePath("/agenda");
  redirect(`/agenda?toast=${encodeURIComponent("Prazo criado com sucesso")}`);
}

export async function updateDeadline(
  deadlineId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = deadlineSchema.safeParse({
    caseId:      formData.get("caseId"),
    title:       formData.get("title"),
    type:        formData.get("type") ?? "PRAZO",
    date:        formData.get("date"),
    time:        formData.get("time") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const ownCase = await db.case.findFirst({
    where: { id: parsed.data.caseId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!ownCase) return { error: "Processo não encontrado" };

  const existing = await db.deadline.findFirst({
    where: { id: deadlineId, organizationId: session.user.organizationId },
    select: { googleEventId: true },
  });

  const deadlineDate = combineDateTimeUTC(parsed.data.date, parsed.data.time);

  try {
    await db.deadline.updateMany({
      where: { id: deadlineId, organizationId: session.user.organizationId },
      data: {
        caseId:      parsed.data.caseId,
        title:       parsed.data.title,
        type:        parsed.data.type,
        description: parsed.data.description,
        date:        deadlineDate,
      },
    });
  } catch (e) {
    console.error("[agenda] erro ao salvar prazo:", e);
    return { error: "Erro ao salvar prazo. Tente novamente." };
  }

  await logActivity({
    organizationId: session.user.organizationId,
    caseId: parsed.data.caseId,
    userId: session.user.id,
    userName: session.user.name ?? "Usuário",
    action: `Prazo "${parsed.data.title}" atualizado`,
  });

  // Fire-and-forget Google Calendar sync
  const refreshToken = await getUserGoogleToken(session.user.id);
  if (refreshToken) {
    const eventId = await syncDeadlineToGoogle(refreshToken, {
      id:            deadlineId,
      title:         parsed.data.title,
      type:          parsed.data.type,
      date:          deadlineDate,
      description:   parsed.data.description,
      googleEventId: existing?.googleEventId,
    });
    if (eventId && !existing?.googleEventId) {
      await db.deadline.update({
        where: { id: deadlineId },
        data: { googleEventId: eventId },
      });
    }
  }

  revalidatePath("/agenda");
  redirect(`/agenda?toast=${encodeURIComponent("Prazo atualizado com sucesso")}`);
}

export async function toggleDeadlineStatus(deadlineId: string, completed: boolean) {
  const session = await requireSession();
  const deadline = await db.deadline.findFirst({
    where: { id: deadlineId, organizationId: session.user.organizationId },
    select: { caseId: true, title: true },
  });
  try {
    await db.deadline.updateMany({
      where: { id: deadlineId, organizationId: session.user.organizationId },
      data: { status: completed ? "CONCLUIDO" : "PENDENTE" },
    });
  } catch (e) {
    console.error("[agenda] erro ao atualizar prazo:", e);
    return;
  }
  if (deadline?.caseId) {
    await logActivity({
      organizationId: session.user.organizationId,
      caseId: deadline.caseId,
      userId: session.user.id,
      userName: session.user.name ?? "Usuário",
      action: `Prazo "${deadline.title}" marcado como ${completed ? "Concluído" : "Pendente"}`,
    });
  }
  revalidatePath("/agenda");
}

export async function deleteDeadline(deadlineId: string) {
  const session = await requireSession();

  const existing = await db.deadline.findFirst({
    where: { id: deadlineId, organizationId: session.user.organizationId },
    select: { googleEventId: true },
  });

  try {
    await db.deadline.deleteMany({
      where: { id: deadlineId, organizationId: session.user.organizationId },
    });
  } catch (e) {
    console.error("[agenda] erro ao excluir prazo:", e);
    return;
  }

  // Fire-and-forget Google Calendar event deletion
  if (existing?.googleEventId) {
    const refreshToken = await getUserGoogleToken(session.user.id);
    if (refreshToken) {
      await deleteGoogleEvent(refreshToken, existing.googleEventId);
    }
  }

  revalidatePath("/agenda");
}
