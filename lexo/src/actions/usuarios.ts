"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export type ActionResult = { error: string } | undefined;

const inviteSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  role: z.enum(["ADMIN", "ADVOGADO", "SECRETARIA"]),
});

export async function inviteUser(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") return { error: "Acesso negado" };

  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") ?? "ADVOGADO",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        organizationId: session.user.organizationId,
      },
    });
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return { error: "Já existe um usuário com este email" };
    }
    return { error: "Erro ao criar usuário. Tente novamente." };
  }

  revalidatePath("/configuracoes/usuarios");
}

const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["ADMIN", "ADVOGADO", "SECRETARIA"]),
});

export async function updateUserRole(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") return { error: "Acesso negado" };

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) return { error: "Dados inválidos" };

  if (parsed.data.userId === session.user.id) {
    return { error: "Você não pode alterar seu próprio papel" };
  }

  try {
    await db.user.updateMany({
      where: { id: parsed.data.userId, organizationId: session.user.organizationId },
      data: { role: parsed.data.role },
    });
  } catch {
    return { error: "Erro ao atualizar papel. Tente novamente." };
  }

  revalidatePath("/configuracoes/usuarios");
}

export async function removeUser(userId: string) {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") return;
  if (userId === session.user.id) return;

  try {
    await db.user.deleteMany({
      where: { id: userId, organizationId: session.user.organizationId },
    });
  } catch {
    return;
  }

  revalidatePath("/configuracoes/usuarios");
}
