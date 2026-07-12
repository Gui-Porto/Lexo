"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { cookies } from "next/headers";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

const registerSchema = z
  .object({
    organizationName: z.string().min(2, "Nome do escritório muito curto"),
    name: z.string().min(2, "Nome muito curto"),
    email: z.string().email("Email inválido").toLowerCase(),
    password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterResult = { error: string } | { success: true };

export async function registerOrganization(
  _prevState: RegisterResult | null,
  formData: FormData
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse({
    organizationName: formData.get("organizationName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { organizationName, name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  try {
    await db.organization.create({
      data: {
        name: organizationName,
        trialEndsAt,
        users: {
          create: { name, email, passwordHash, role: "ADMIN" },
        },
      },
    });
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return { error: "Já existe um usuário com este email" };
    }
    console.error("[auth] erro ao registrar organização:", e);
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  await signIn("credentials", { email, password, redirectTo: "/registrar/2fa" });

  return { success: true };
}

export async function signupWithGoogle() {
  const cookieStore = await cookies();
  cookieStore.set("google_signup", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  await signIn("google", { redirectTo: "/registrar/completar" });
}

export type CompleteSignupResult = { error: string } | undefined;

export async function completeGoogleSignup(
  _prevState: CompleteSignupResult,
  formData: FormData
): Promise<CompleteSignupResult> {
  const organizationName = ((formData.get("organizationName") as string) ?? "").trim();
  if (organizationName.length < 2) {
    return { error: "Nome do escritório muito curto" };
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get("pending_google_identity")?.value;
  if (!raw) return { error: "Sessão expirada. Comece o cadastro novamente." };

  let identity: { email: string; name: string; exp: number };
  try {
    identity = JSON.parse(decryptSecret(raw)) as { email: string; name: string; exp: number };
  } catch {
    return { error: "Sessão expirada. Comece o cadastro novamente." };
  }
  if (Date.now() > identity.exp) {
    return { error: "Sessão expirada. Comece o cadastro novamente." };
  }

  const existingUser = await db.user.findUnique({ where: { email: identity.email } });
  if (existingUser) return { error: "Já existe um usuário com este email" };

  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  let userId: string;
  try {
    const org = await db.organization.create({
      data: {
        name: organizationName,
        trialEndsAt,
        users: {
          create: {
            name: identity.name || identity.email,
            email: identity.email,
            passwordHash: null,
            role: "ADMIN",
          },
        },
      },
      include: { users: true },
    });
    userId = org.users[0].id;
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return { error: "Já existe um usuário com este email" };
    }
    console.error("[auth] erro ao registrar organização via Google:", e);
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  cookieStore.delete("pending_google_identity");

  const signupToken = encryptSecret(JSON.stringify({ userId, exp: Date.now() + 5 * 60 * 1000 }));
  try {
    await signIn("credentials", { signupToken, redirectTo: "/registrar/2fa" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada, mas não foi possível entrar automaticamente. Tente fazer login." };
    }
    throw error;
  }
}
