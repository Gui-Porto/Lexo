"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { validateDocument } from "@/lib/document";

const clientSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  document: z
    .string()
    .optional()
    .refine(
      (v) => !v || validateDocument(v),
      "CPF ou CNPJ inválido"
    ),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type ActionResult = { error: string } | undefined;

export async function createClient(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    document: formData.get("document") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await db.client.create({
      data: { ...parsed.data, organizationId: session.user.organizationId },
    });
  } catch {
    return { error: "Erro ao salvar cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  redirect(`/clientes?toast=${encodeURIComponent("Cliente criado com sucesso")}`);
}

export async function updateClient(
  clientId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    document: formData.get("document") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await db.client.updateMany({
      where: { id: clientId, organizationId: session.user.organizationId },
      data: parsed.data,
    });
  } catch {
    return { error: "Erro ao salvar cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${clientId}?toast=${encodeURIComponent("Cliente atualizado com sucesso")}`);
}

export async function deleteClient(clientId: string) {
  const session = await requireSession();
  try {
    await db.client.deleteMany({
      where: { id: clientId, organizationId: session.user.organizationId },
    });
  } catch {
    return;
  }
  revalidatePath("/clientes");
  redirect(`/clientes?toast=${encodeURIComponent("Cliente excluído")}`);
}
