"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";

const deadlineSchema = z.object({
  caseId: z.string().min(1, "Selecione um processo"),
  title: z.string().min(1, "Título é obrigatório"),
  type: z.enum(["PRAZO", "AUDIENCIA", "REUNIAO", "OUTRO"]),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional(),
});

export type ActionResult = { error: string } | undefined;

export async function createDeadline(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = deadlineSchema.safeParse({
    caseId: formData.get("caseId"),
    title: formData.get("title"),
    type: formData.get("type") ?? "PRAZO",
    date: formData.get("date"),
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

  try {
    await db.deadline.create({
      data: {
        caseId: parsed.data.caseId,
        title: parsed.data.title,
        type: parsed.data.type,
        description: parsed.data.description,
        date: new Date(parsed.data.date),
        organizationId: session.user.organizationId,
      },
    });
  } catch {
    return { error: "Erro ao salvar prazo. Tente novamente." };
  }

  await logActivity({
    organizationId: session.user.organizationId,
    caseId: parsed.data.caseId,
    userId: session.user.id,
    userName: session.user.name ?? "Usuário",
    action: `Prazo "${parsed.data.title}" criado`,
  });

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
    caseId: formData.get("caseId"),
    title: formData.get("title"),
    type: formData.get("type") ?? "PRAZO",
    date: formData.get("date"),
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

  try {
    await db.deadline.updateMany({
      where: { id: deadlineId, organizationId: session.user.organizationId },
      data: {
        caseId: parsed.data.caseId,
        title: parsed.data.title,
        type: parsed.data.type,
        description: parsed.data.description,
        date: new Date(parsed.data.date),
      },
    });
  } catch {
    return { error: "Erro ao salvar prazo. Tente novamente." };
  }

  await logActivity({
    organizationId: session.user.organizationId,
    caseId: parsed.data.caseId,
    userId: session.user.id,
    userName: session.user.name ?? "Usuário",
    action: `Prazo "${parsed.data.title}" atualizado`,
  });

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
  } catch {
    return;
  }
  if (deadline) {
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
  try {
    await db.deadline.deleteMany({
      where: { id: deadlineId, organizationId: session.user.organizationId },
    });
  } catch {
    return;
  }
  revalidatePath("/agenda");
}
