"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export type ActionResult = { error: string } | undefined;

const taskSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional(),
  caseId: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA"]).default("MEDIA"),
  dueDate: z.string().optional(),
});

export async function createTask(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    caseId: formData.get("caseId") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    priority: formData.get("priority") ?? "MEDIA",
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  if (parsed.data.caseId) {
    const c = await db.case.findFirst({
      where: { id: parsed.data.caseId, organizationId: session.user.organizationId },
    });
    if (!c) return { error: "Processo não encontrado" };
  }

  let assignedToName: string | undefined;
  if (parsed.data.assignedToId) {
    const u = await db.user.findFirst({
      where: { id: parsed.data.assignedToId, organizationId: session.user.organizationId },
    });
    if (!u) return { error: "Usuário não encontrado" };
    assignedToName = u.name;
  }

  await db.task.create({
    data: {
      organizationId: session.user.organizationId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      caseId: parsed.data.caseId ?? null,
      assignedToId: parsed.data.assignedToId ?? null,
      assignedToName: assignedToName ?? null,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });

  revalidatePath("/tarefas");
}

export async function updateTaskStatus(
  taskId: string,
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA"
): Promise<ActionResult> {
  const session = await requireSession();
  const updated = await db.task.updateMany({
    where: { id: taskId, organizationId: session.user.organizationId },
    data: { status },
  });
  if (updated.count === 0) return { error: "Tarefa não encontrada" };
  revalidatePath("/tarefas");
  return undefined;
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const session = await requireSession();
  await db.task.deleteMany({
    where: { id: taskId, organizationId: session.user.organizationId },
  });
  revalidatePath("/tarefas");
  return undefined;
}
