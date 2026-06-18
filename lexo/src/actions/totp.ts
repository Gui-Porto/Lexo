"use server";

import { generateSecret, verifySync } from "otplib";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

export type TotpActionResult = { error: string } | undefined;

export async function initiateTwoFactor(): Promise<void> {
  const session = await requireSession();
  const secret = generateSecret();
  await db.user.update({
    where: { id: session.user.id },
    // 🔒 SEGURANÇA [VULN-6]: o segredo pendente vai cifrado ao banco.
    data: { totpPendingSecret: encryptSecret(secret) },
  });
  revalidatePath("/configuracoes/seguranca");
}

export async function confirmTwoFactor(
  _prevState: TotpActionResult,
  formData: FormData
): Promise<TotpActionResult> {
  const session = await requireSession();
  const code = (formData.get("code") as string)?.trim();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { totpPendingSecret: true },
  });

  if (!user?.totpPendingSecret) return { error: "Sessão expirada. Reinicie o processo." };

  // 🔒 SEGURANÇA [VULN-6]: decifra apenas em memória para validar o código.
  const plainSecret = decryptSecret(user.totpPendingSecret);
  const result = verifySync({ token: code, secret: plainSecret });
  if (!result.valid) return { error: "Código inválido. Tente novamente." };

  await db.user.update({
    where: { id: session.user.id },
    // O valor pendente já está cifrado; promove-se direto a totpSecret.
    data: { totpSecret: user.totpPendingSecret, totpEnabled: true, totpPendingSecret: null },
  });

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "",
    action: "ATIVOU_2FA",
    description: "Ativou verificação em dois fatores",
  });

  revalidatePath("/configuracoes/seguranca");
}

export async function disableTwoFactor(
  _prevState: TotpActionResult,
  formData: FormData
): Promise<TotpActionResult> {
  const session = await requireSession();
  const code = (formData.get("code") as string)?.trim();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true },
  });

  if (!user?.totpSecret) return { error: "2FA não está ativado." };

  // 🔒 SEGURANÇA [VULN-6]: decifra o segredo para validar antes de desativar.
  const result = verifySync({ token: code, secret: decryptSecret(user.totpSecret) });
  if (!result.valid) return { error: "Código inválido." };

  await db.user.update({
    where: { id: session.user.id },
    data: { totpSecret: null, totpEnabled: false, totpPendingSecret: null },
  });

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "",
    action: "DESATIVOU_2FA",
    description: "Desativou verificação em dois fatores",
  });

  revalidatePath("/configuracoes/seguranca");
}
