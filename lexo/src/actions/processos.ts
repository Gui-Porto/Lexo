"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";

const caseSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  number: z.string().min(1, "Número do processo é obrigatório"),
  area: z.string().optional(),
  status: z.enum(["ATIVO", "SUSPENSO", "ARQUIVADO", "ENCERRADO"]),
  description: z.string().optional(),
  responsavelId: z.string().optional(),
});

export type ActionResult = { error: string } | undefined;

export async function createCase(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = caseSchema.safeParse({
    clientId: formData.get("clientId"),
    number: formData.get("number"),
    area: formData.get("area") || undefined,
    status: formData.get("status") ?? "ATIVO",
    description: formData.get("description") || undefined,
    responsavelId: formData.get("responsavelId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const ownClient = await db.client.findFirst({
    where: { id: parsed.data.clientId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!ownClient) return { error: "Cliente não encontrado" };

  if (parsed.data.responsavelId) {
    const ownUser = await db.user.findFirst({
      where: { id: parsed.data.responsavelId, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (!ownUser) return { error: "Responsável não encontrado" };
  }

  let newCase: { id: string };
  try {
    newCase = await db.case.create({
      data: { ...parsed.data, organizationId: session.user.organizationId },
      select: { id: true },
    });
  } catch (e) {
    console.error("[processos] erro ao salvar processo:", e);
    return { error: "Erro ao salvar processo. Tente novamente." };
  }

  await logActivity({
    organizationId: session.user.organizationId,
    caseId: newCase.id,
    userId: session.user.id,
    userName: session.user.name ?? "Usuário",
    action: "Processo criado",
  });

  revalidatePath("/processos");
  redirect(`/processos?toast=${encodeURIComponent("Processo criado com sucesso")}`);
}

export async function updateCase(
  caseId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = caseSchema.safeParse({
    clientId: formData.get("clientId"),
    number: formData.get("number"),
    area: formData.get("area") || undefined,
    status: formData.get("status") ?? "ATIVO",
    description: formData.get("description") || undefined,
    responsavelId: formData.get("responsavelId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const ownClient = await db.client.findFirst({
    where: { id: parsed.data.clientId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!ownClient) return { error: "Cliente não encontrado" };

  if (parsed.data.responsavelId) {
    const ownUser = await db.user.findFirst({
      where: { id: parsed.data.responsavelId, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (!ownUser) return { error: "Responsável não encontrado" };
  }

  try {
    await db.case.updateMany({
      where: { id: caseId, organizationId: session.user.organizationId },
      data: parsed.data,
    });
  } catch (e) {
    console.error("[processos] erro ao salvar processo:", e);
    return { error: "Erro ao salvar processo. Tente novamente." };
  }

  await logActivity({
    organizationId: session.user.organizationId,
    caseId,
    userId: session.user.id,
    userName: session.user.name ?? "Usuário",
    action: `Processo atualizado — status: ${parsed.data.status}`,
  });

  revalidatePath("/processos");
  redirect(`/processos/${caseId}?toast=${encodeURIComponent("Processo atualizado com sucesso")}`);
}

export async function deleteCase(caseId: string) {
  const session = await requireSession();
  try {
    await db.case.deleteMany({
      where: { id: caseId, organizationId: session.user.organizationId },
    });
  } catch (e) {
    console.error("[processos] erro ao excluir processo:", e);
    return;
  }
  revalidatePath("/processos");
  redirect(`/processos?toast=${encodeURIComponent("Processo excluído")}`);
}
