"use server";

import { db } from "@/lib/db";

export async function logActivity({
  organizationId,
  caseId,
  userId,
  userName,
  action,
}: {
  organizationId: string;
  caseId: string;
  userId?: string | null;
  userName: string;
  action: string;
}) {
  try {
    await db.activityLog.create({
      data: { organizationId, caseId, userId, userName, action },
    });
  } catch (e) {
    // 🔒 SEGURANÇA [VULN-7]: não-fatal, porém observável (Lei 14).
    console.error(`[activity] falha ao registrar atividade no caso ${caseId}:`, e);
  }
}
