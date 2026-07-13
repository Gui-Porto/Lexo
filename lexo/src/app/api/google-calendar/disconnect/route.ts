import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const base = process.env.NEXTAUTH_URL!;
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL("/login", base));
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      googleRefreshToken: null,
      googleCalendarEnabled: false,
    },
  });

  return NextResponse.redirect(
    new URL(`/configuracoes?tab=integracoes&toast=${encodeURIComponent("Google Agenda desconectado")}`, base)
  );
}
