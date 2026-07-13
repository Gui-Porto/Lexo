import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { listChangedEvents } from "@/lib/google-calendar";

/**
 * Sincronização Google → sistema: espelha no banco o que mudou no Google
 * Agenda (edição, criação, exclusão) desde a última rodada.
 * Chamada no load da página da agenda, com throttle de 60s por usuário.
 */
export async function pullGoogleChanges(
  userId: string,
  organizationId: string
): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        googleCalendarEnabled: true,
        googleRefreshToken: true,
        googleLastSyncAt: true,
      },
    });
    if (!user?.googleCalendarEnabled || !user.googleRefreshToken) return;

    const now = new Date();
    if (user.googleLastSyncAt && now.getTime() - user.googleLastSyncAt.getTime() < 60_000) return;

    // ponytail: primeira rodada olha 7 dias de mudanças pra trás; o resto já
    // foi importado na conexão da conta.
    const since = user.googleLastSyncAt ?? new Date(now.getTime() - 7 * 86400000);
    const changes = await listChangedEvents(decryptSecret(user.googleRefreshToken), since);

    for (const c of changes) {
      if (c.cancelled) {
        await db.deadline.deleteMany({
          where: { organizationId, googleEventId: c.googleEventId },
        });
        continue;
      }
      if (!c.date) continue;

      // Tira o prefixo "[Prazo] " etc. que o próprio sistema adiciona ao exportar
      const title = c.title.replace(/^\[(Prazo|Audiência|Reunião|Compromisso)\]\s*/, "");

      const updated = await db.deadline.updateMany({
        where: { organizationId, googleEventId: c.googleEventId },
        data: { title, description: c.description, date: c.date },
      });
      if (updated.count === 0) {
        await db.deadline.create({
          data: {
            organizationId,
            caseId: null,
            title,
            type: "OUTRO",
            description: c.description,
            date: c.date,
            googleEventId: c.googleEventId,
          },
        });
      }
    }

    // Prazo PERDIDO que ganhou data futura no Google volta a ser PENDENTE
    // (PERDIDO com data futura só existe por causa deste pull).
    await db.deadline.updateMany({
      where: { organizationId, status: "PERDIDO", date: { gte: now } },
      data: { status: "PENDENTE" },
    });

    await db.user.update({
      where: { id: userId },
      data: { googleLastSyncAt: now },
    });
  } catch (e) {
    console.error("[google-calendar] pull error:", e);
  }
}
