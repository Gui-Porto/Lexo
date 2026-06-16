"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const clientSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  document: z.string().optional(),
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

  await db.client.create({
    data: {
      ...parsed.data,
      organizationId: session.user.organizationId,
    },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
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

  await db.client.updateMany({
    where: { id: clientId, organizationId: session.user.organizationId },
    data: parsed.data,
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function deleteClient(clientId: string) {
  const session = await requireSession();
  await db.client.deleteMany({
    where: { id: clientId, organizationId: session.user.organizationId },
  });
  revalidatePath("/clientes");
}
