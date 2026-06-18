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
  } catch {
    // audit failure never breaks the main flow
  }
}
