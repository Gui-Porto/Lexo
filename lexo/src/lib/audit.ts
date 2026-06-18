import { db } from "@/lib/db";

export async function logAudit({
  organizationId,
  userId,
  userName,
  action,
  entityType,
  entityId,
  description,
}: {
  organizationId: string;
  userId?: string;
  userName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
}) {
  try {
    await db.auditLog.create({
      data: { organizationId, userId, userName, action, entityType, entityId, description },
    });
  } catch (e) {
    // 🔒 SEGURANÇA [VULN-7]: a falha de auditoria não quebra o fluxo principal,
    // mas precisa ser observável (Lei 14) — nunca silenciosa.
    console.error(`[audit] falha ao registrar ação "${action}" (org ${organizationId}):`, e);
  }
}
