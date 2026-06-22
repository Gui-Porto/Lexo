"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { randomBytes } from "crypto";

export type ActionResult = { error: string } | undefined;

export async function enableClientPortal(clientId: string): Promise<ActionResult> {
  const session = await requireSession();
  const client = await db.client.findFirst({
    where: { id: clientId, organizationId: session.user.organizationId },
  });
  if (!client) return { error: "Cliente não encontrado" };

  const token = client.portalToken ?? randomBytes(24).toString("hex");
  await db.client.update({
    where: { id: clientId },
    data: { portalEnabled: true, portalToken: token },
  });

  revalidatePath("/portal-cliente");
  return undefined;
}

export async function disableClientPortal(clientId: string): Promise<ActionResult> {
  const session = await requireSession();
  const updated = await db.client.updateMany({
    where: { id: clientId, organizationId: session.user.organizationId },
    data: { portalEnabled: false },
  });
  if (updated.count === 0) return { error: "Cliente não encontrado" };
  revalidatePath("/portal-cliente");
  return undefined;
}

export async function regeneratePortalToken(clientId: string): Promise<ActionResult> {
  const session = await requireSession();
  const token = randomBytes(24).toString("hex");
  const updated = await db.client.updateMany({
    where: { id: clientId, organizationId: session.user.organizationId, portalEnabled: true },
    data: { portalToken: token },
  });
  if (updated.count === 0) return { error: "Cliente não encontrado ou portal desativado" };
  revalidatePath("/portal-cliente");
  return undefined;
}
