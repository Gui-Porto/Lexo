"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";

const registerSchema = z.object({
  organizationName: z.string().min(2, "Nome do escritório muito curto"),
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { organizationName, name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário com este email" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.organization.create({
    data: {
      name: organizationName,
      users: {
        create: {
          name,
          email,
          passwordHash,
          role: "ADMIN",
        },
      },
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/processos",
  });

  return { success: true };
}
