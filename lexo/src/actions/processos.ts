"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const caseSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  number: z.string().min(1, "Número do processo é obrigatório"),
  area: z.string().optional(),
  status: z.enum(["ATIVO", "SUSPENSO", "ARQUIVADO", "ENCERRADO"]),
  description: z.string().optional(),
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await db.case.create({
    data: {
      ...parsed.data,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/processos");
  redirect("/processos");
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await db.case.updateMany({
    where: { id: caseId, organizationId: session.user.organizationId },
    data: parsed.data,
  });

  revalidatePath("/processos");
  redirect("/processos");
}

export async function deleteCase(caseId: string) {
  const session = await requireSession();
  await db.case.deleteMany({
    where: { id: caseId, organizationId: session.user.organizationId },
  });
  revalidatePath("/processos");
}
