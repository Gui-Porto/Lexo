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
  } catch {
    // log failures are non-fatal
  }
}
