"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { resend, inviteEmailHtml } from "@/lib/resend";
import { logAudit } from "@/lib/audit";

export type ActionResult = { error: string } | { success: string } | undefined;

const inviteSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
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
    role: formData.get("role") ?? "ADVOGADO",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existingUser = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) return { error: "Já existe um usuário com este email" };

  const existingInvite = await db.userInvite.findFirst({
    where: {
      email: parsed.data.email,
      organizationId: session.user.organizationId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) return { error: "Já existe um convite pendente para este email" };

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await db.userInvite.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      organizationId: session.user.organizationId,
      expiresAt,
    },
    include: { organization: { select: { name: true } } },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const acceptUrl = `${baseUrl}/convite/${invite.token}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Lexo <noreply@lexo.app>",
    to: [parsed.data.email],
    subject: `Convite para ${invite.organization.name} no Lexo`,
    html: inviteEmailHtml({
      orgName: invite.organization.name,
      inviteeName: parsed.data.name,
      acceptUrl,
    }),
  });

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "Admin",
    action: "CONVIDOU_USUARIO",
    entityType: "USUARIO",
    description: `Convidou ${parsed.data.name} (${parsed.data.email}) como ${parsed.data.role}`,
  });

  revalidatePath("/configuracoes/usuarios");
  return { success: `Convite enviado para ${parsed.data.email}` };
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") return;

  const invite = await db.userInvite.findFirst({
    where: { id: inviteId, organizationId: session.user.organizationId },
  });

  await db.userInvite.deleteMany({
    where: { id: inviteId, organizationId: session.user.organizationId },
  });

  if (invite) {
    await logAudit({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      userName: session.user.name ?? session.user.email ?? "Admin",
      action: "REVOGOU_CONVITE",
      entityType: "USUARIO",
      description: `Revogou convite de ${invite.email}`,
    });
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
  } catch (e) {
    console.error("[usuarios] erro ao atualizar papel:", e);
    return { error: "Erro ao atualizar papel. Tente novamente." };
  }

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "Admin",
    action: "ALTEROU_PAPEL",
    entityType: "USUARIO",
    entityId: parsed.data.userId,
    description: `Alterou papel do usuário para ${parsed.data.role}`,
  });

  revalidatePath("/configuracoes/usuarios");
}

export async function removeUser(userId: string) {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") return;
  if (userId === session.user.id) return;

  const target = await db.user.findFirst({
    where: { id: userId, organizationId: session.user.organizationId },
    select: { name: true, email: true },
  });

  try {
    await db.user.deleteMany({
      where: { id: userId, organizationId: session.user.organizationId },
    });
  } catch (e) {
    console.error("[usuarios] erro ao remover usuário:", e);
    return;
  }

  if (target) {
    await logAudit({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      userName: session.user.name ?? session.user.email ?? "Admin",
      action: "REMOVEU_USUARIO",
      entityType: "USUARIO",
      entityId: userId,
      description: `Removeu ${target.name} (${target.email})`,
    });
  }

  revalidatePath("/configuracoes/usuarios");
}
