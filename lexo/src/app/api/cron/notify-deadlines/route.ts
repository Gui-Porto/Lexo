import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resend, deadlineReminderHtml } from "@/lib/resend";

export const dynamic = "force-dynamic";

// Chamado diariamente pelo cron do Render (ou qualquer scheduler).
// Protegido por CRON_SECRET no header Authorization.
export async function GET(req: NextRequest) {
  // 🔒 SEGURANÇA [VULN-1]: fail-secure (CWE-636). Sem CRON_SECRET configurado o
  // endpoint NEGA acesso — nunca executa aberto. Antes, a ausência da env var
  // desligava a verificação e expunha o disparo de e-mails a qualquer um.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/notify-deadlines] CRON_SECRET ausente — negando acesso");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in7days = new Date(now);
  in7days.setDate(in7days.getDate() + 7);

  // Prazos PENDENTE que vencem nos próximos 7 dias e ainda não foram notificados hoje
  const upcomingDeadlines = await db.deadline.findMany({
    where: {
      status: "PENDENTE",
      date: { gte: now, lte: in7days },
      OR: [
        { notifiedAt: null },
        { notifiedAt: { lt: new Date(now.getTime() - 20 * 60 * 60 * 1000) } }, // re-notifica após 20h
      ],
    },
    include: {
      case: { select: { number: true } },
      organization: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  if (upcomingDeadlines.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Agrupar por organização e buscar emails dos admins
  const byOrg = new Map<string, typeof upcomingDeadlines>();
  for (const d of upcomingDeadlines) {
    const list = byOrg.get(d.organizationId) ?? [];
    list.push(d);
    byOrg.set(d.organizationId, list);
  }

  let sent = 0;
  const notifiedIds: string[] = [];

  for (const [orgId, deadlines] of byOrg) {
    const admins = await db.user.findMany({
      where: { organizationId: orgId, role: { in: ["ADMIN", "ADVOGADO"] } },
      select: { email: true },
    });

    if (admins.length === 0) continue;

    const orgName = deadlines[0].organization.name;
    const items = deadlines.map((d) => {
      const daysLeft = Math.ceil((d.date.getTime() - now.getTime()) / 86_400_000);
      return {
        title: d.title,
        caseNumber: d.case.number,
        date: d.date.toLocaleDateString("pt-BR", { timeZone: "UTC" }),
        daysLeft,
      };
    });

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Lexo <noreply@lexo.app>",
      to: admins.map((u) => u.email),
      subject: `[Lexo] ${items.length} prazo${items.length !== 1 ? "s" : ""} vencendo em breve — ${orgName}`,
      html: deadlineReminderHtml({ orgName, deadlines: items }),
    });

    if (!error) {
      sent++;
      notifiedIds.push(...deadlines.map((d) => d.id));
    }
  }

  // Marcar como notificados
  if (notifiedIds.length > 0) {
    await db.deadline.updateMany({
      where: { id: { in: notifiedIds } },
      data: { notifiedAt: now },
    });
  }

  return NextResponse.json({ sent, notified: notifiedIds.length });
}
