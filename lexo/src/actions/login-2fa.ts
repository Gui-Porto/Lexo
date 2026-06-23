"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { cookies } from "next/headers";

export type Login2FAResult = { error: string } | undefined;

export async function loginWithTotp(
  _prevState: Login2FAResult,
  formData: FormData
): Promise<Login2FAResult> {
  const totpCode = ((formData.get("totpCode") as string) ?? "").replace(/\s/g, "");

  if (totpCode.length !== 6) return { error: "Digite os 6 dígitos do código." };

  const cookieStore = await cookies();
  const pendingToken = cookieStore.get("pending_2fa")?.value;

  if (!pendingToken) return { error: "Sessão expirada. Faça login novamente." };

  try {
    await signIn("credentials", {
      pendingToken,
      totpCode,
      redirectTo: "/processos",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Código inválido. Tente novamente." };
    }
    throw error;
  }
}
