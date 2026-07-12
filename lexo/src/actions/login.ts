"use server";

import { AuthError } from "next-auth";
import { signIn, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type LoginResult = { error: string } | undefined;

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/processos" });
}

export async function login(
  _prevState: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const email = ((formData.get("email") as string) ?? "").toLowerCase().trim();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) return { error: "Preencha todos os campos." };

  // 🔒 SEGURANÇA [VULN-3]: rate limit por email antes de qualquer consulta ao banco.
  if (!(await checkRateLimit(`login:${email}`, 10, 15 * 60))) {
    return { error: "Email ou senha inválidos" };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: "Email ou senha inválidos" };

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return { error: "Email ou senha inválidos" };

  // Usuário tem 2FA ativo: gera token pendente cifrado e redireciona para /login/2fa
  if (user.totpEnabled && user.totpSecret) {
    const payload = JSON.stringify({ userId: user.id, exp: Date.now() + 5 * 60 * 1000 });
    const token = encryptSecret(payload);

    const cookieStore = await cookies();
    cookieStore.set("pending_2fa", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 300,
      secure: process.env.NODE_ENV === "production",
    });

    redirect("/login/2fa");
  }

  // Sem 2FA: login direto
  try {
    await signIn("credentials", {
      email,
      password,
      totpCode: "",
      redirectTo: "/processos",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" };
    }
    throw error;
  }
}
