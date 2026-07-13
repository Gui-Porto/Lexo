import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCode, listUpcomingEvents } from "@/lib/google-calendar";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const session = await auth();
  const base = process.env.NEXTAUTH_URL!;

  if (!session) {
    return NextResponse.redirect(new URL("/login", base));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL(`/configuracoes?tab=integracoes&toast=${encodeURIComponent("Erro na autenticação Google")}`, base)
    );
  }

  try {
    const tokens = await exchangeCode(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL(`/configuracoes?tab=integracoes&toast=${encodeURIComponent("Token não recebido. Tente novamente.")}`, base)
      );
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        googleRefreshToken: encryptSecret(tokens.refresh_token),
        googleCalendarEnabled: true,
      },
    });

    const imported = await importExistingEvents(
      session.user.organizationId,
      tokens.refresh_token
    );

    const toast = imported > 0
      ? `Google Agenda conectado! ${imported} evento(s) importado(s).`
      : "Google Agenda conectado!";

    return NextResponse.redirect(
      new URL(`/configuracoes?tab=integracoes&toast=${encodeURIComponent(toast)}`, base)
    );
  } catch (e) {
    console.error("[google-calendar callback]", e);
    return NextResponse.redirect(
      new URL(`/configuracoes?tab=integracoes&toast=${encodeURIComponent("Erro ao conectar Google Agenda")}`, base)
    );
  }
}

// Puxa os eventos já existentes no Google Calendar do usuário e cria prazos
// (tipo OUTRO, sem processo vinculado) pra quem ainda não foi importado.
async function importExistingEvents(organizationId: string, refreshToken: string): Promise<number> {
  try {
    const events = await listUpcomingEvents(refreshToken);
    if (events.length === 0) return 0;

    const existing = await db.deadline.findMany({
      where: { organizationId, googleEventId: { in: events.map((e) => e.googleEventId) } },
      select: { googleEventId: true },
    });
    const existingIds = new Set(existing.map((e) => e.googleEventId));
    const toImport = events.filter((e) => !existingIds.has(e.googleEventId));
    if (toImport.length === 0) return 0;

    await db.deadline.createMany({
      data: toImport.map((e) => ({
        organizationId,
        caseId: null,
        title: e.title,
        type: "OUTRO" as const,
        description: e.description,
        date: e.date,
        googleEventId: e.googleEventId,
      })),
    });
    return toImport.length;
  } catch (e) {
    console.error("[google-calendar] import error:", e);
    return 0;
  }
}
