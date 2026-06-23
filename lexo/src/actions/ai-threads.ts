"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createThread(title: string) {
  const session = await requireSession();
  const { organizationId, id: userId } = session.user;
  const thread = await db.aIThread.create({
    data: { organizationId, userId, title: title.slice(0, 120) },
  });
  revalidatePath("/pesquisa-juridica");
  return thread;
}

export async function listThreads() {
  const session = await requireSession();
  const { organizationId, id: userId } = session.user;
  return db.aIThread.findMany({
    where: { organizationId, userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function getThread(threadId: string) {
  const session = await requireSession();
  const { organizationId, id: userId } = session.user;
  return db.aIThread.findFirst({
    where: { id: threadId, organizationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function saveMessage(threadId: string, role: "user" | "assistant", content: string) {
  const session = await requireSession();
  const { organizationId, id: userId } = session.user;
  const thread = await db.aIThread.findFirst({
    where: { id: threadId, organizationId, userId },
    select: { id: true },
  });
  if (!thread) throw new Error("Thread não encontrada");
  const [message] = await db.$transaction([
    db.aIMessage.create({ data: { threadId, role, content } }),
    db.aIThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } }),
  ]);
  return message;
}

export async function deleteThread(threadId: string) {
  const session = await requireSession();
  const { organizationId, id: userId } = session.user;
  await db.aIThread.deleteMany({ where: { id: threadId, organizationId, userId } });
  revalidatePath("/pesquisa-juridica");
}
