"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";

const registerSchema = z
  .object({
    organizationName: z.string().min(2, "Nome do escritório muito curto"),
    name: z.string().min(2, "Nome muito curto"),
    email: z.string().email("Email inválido"),
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

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });

  return { success: true };
}
