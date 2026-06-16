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

  revalidatePath("/financeiro");
  redirect("/financeiro");
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const session = await requireSession();
  await db.invoice.updateMany({
    where: { id: invoiceId, organizationId: session.user.organizationId },
    data: { status: status as "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO" },
  });
  revalidatePath("/financeiro");
}

export async function deleteInvoice(invoiceId: string) {
  const session = await requireSession();
  await db.invoice.deleteMany({
    where: { id: invoiceId, organizationId: session.user.organizationId },
  });
  revalidatePath("/financeiro");
}
