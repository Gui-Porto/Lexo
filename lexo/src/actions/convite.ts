"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export type ConviteActionResult = { error: string } | undefined;

const acceptSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export async function acceptInvite(
  _prevState: ConviteActionResult,
  formData: FormData
): Promise<ConviteActionResult> {
  const parsed = acceptSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const invite = await db.userInvite.findUnique({
    where: { token: parsed.data.token },
  });

  if (!invite) return { error: "Convite inválido" };
  if (invite.acceptedAt) return { error: "Este convite já foi utilizado" };
  if (invite.expiresAt < new Date()) return { error: "Este convite expirou" };

  const existingUser = await db.user.findUnique({ where: { email: invite.email } });
  if (existingUser) return { error: "Já existe uma conta com este email" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await db.$transaction([
    db.user.create({
      data: {
        name: invite.name,
        email: invite.email,
        passwordHash,
        role: invite.role,
        organizationId: invite.organizationId,
      },
    }),
    db.userInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  redirect("/login?flash=conta-criada");
}
