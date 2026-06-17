"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  caseId: z.string().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  status: z.enum(["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"]),
  dueDate: z.string().min(1, "Vencimento é obrigatório"),
});

const invoiceStatusSchema = z.enum(["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"]);

export type ActionResult = { error: string } | undefined;

export async function createInvoice(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    caseId: formData.get("caseId") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
    status: formData.get("status") ?? "PENDENTE",
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const ownClient = await db.client.findFirst({
    where: { id: parsed.data.clientId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!ownClient) return { error: "Cliente não encontrado" };

  if (parsed.data.caseId) {
    const ownCase = await db.case.findFirst({
      where: { id: parsed.data.caseId, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (!ownCase) return { error: "Processo não encontrado" };
  }

  try {
    await db.invoice.create({
      data: {
        clientId: parsed.data.clientId,
        caseId: parsed.data.caseId || null,
        description: parsed.data.description,
        amount: parsed.data.amount,
        status: parsed.data.status,
        dueDate: new Date(parsed.data.dueDate),
        organizationId: session.user.organizationId,
      },
    });
  } catch {
    return { error: "Erro ao salvar honorário. Tente novamente." };
  }

  revalidatePath("/financeiro");
  redirect(`/financeiro?toast=${encodeURIComponent("Honorário criado com sucesso")}`);
}

export async function updateInvoice(
  invoiceId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    caseId: formData.get("caseId") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
    status: formData.get("status") ?? "PENDENTE",
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const ownClient = await db.client.findFirst({
    where: { id: parsed.data.clientId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!ownClient) return { error: "Cliente não encontrado" };

  if (parsed.data.caseId) {
    const ownCase = await db.case.findFirst({
      where: { id: parsed.data.caseId, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (!ownCase) return { error: "Processo não encontrado" };
  }

  try {
    await db.invoice.updateMany({
      where: { id: invoiceId, organizationId: session.user.organizationId },
      data: {
        clientId: parsed.data.clientId,
        caseId: parsed.data.caseId || null,
        description: parsed.data.description,
        amount: parsed.data.amount,
        status: parsed.data.status,
        dueDate: new Date(parsed.data.dueDate),
        ...(parsed.data.status === "PAGO" ? { paidAt: new Date() } : { paidAt: null }),
      },
    });
  } catch {
    return { error: "Erro ao salvar honorário. Tente novamente." };
  }

  revalidatePath("/financeiro");
  redirect(`/financeiro?toast=${encodeURIComponent("Honorário atualizado com sucesso")}`);
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const session = await requireSession();
  const parsed = invoiceStatusSchema.safeParse(status);
  if (!parsed.success) return;

  try {
    await db.invoice.updateMany({
      where: { id: invoiceId, organizationId: session.user.organizationId },
      data: {
        status: parsed.data,
        ...(parsed.data === "PAGO" ? { paidAt: new Date() } : {}),
      },
    });
  } catch {
    return;
  }
  revalidatePath("/financeiro");
}

export async function deleteInvoice(invoiceId: string) {
  const session = await requireSession();
  try {
    await db.invoice.deleteMany({
      where: { id: invoiceId, organizationId: session.user.organizationId },
    });
  } catch {
    return;
  }
  revalidatePath("/financeiro");
}
