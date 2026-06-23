import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCode } from "@/lib/google-calendar";
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

    return NextResponse.redirect(
      new URL(`/configuracoes?tab=integracoes&toast=${encodeURIComponent("Google Agenda conectado!")}`, base)
    );
  } catch (e) {
    console.error("[google-calendar callback]", e);
    return NextResponse.redirect(
      new URL(`/configuracoes?tab=integracoes&toast=${encodeURIComponent("Erro ao conectar Google Agenda")}`, base)
    );
  }
}
