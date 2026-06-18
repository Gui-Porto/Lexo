import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { streamText } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  query: z.string().min(3).max(2000),
  area: z.string().optional(),
  tribunal: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // 🔒 SEGURANÇA [VULN-3]: limita por organização para proteger a cota gratuita do Gemini.
  if (!(await checkRateLimit(`ia:${session.user.organizationId}`, 20, 60))) {
    return NextResponse.json({ error: "Muitas requisições. Aguarde um momento." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { query, area, tribunal } = parsed.data;

  const contexto = [
    area ? `Área jurídica: ${area}` : null,
    tribunal ? `Tribunal de referência: ${tribunal}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Você é um especialista em direito brasileiro com profundo conhecimento da jurisprudência dos tribunais superiores e estaduais. Responda à seguinte consulta jurisprudencial de forma completa e precisa.
${contexto ? `\nContexto:\n${contexto}` : ""}

Consulta: ${query}

Estruture sua resposta com:

## Posicionamento dominante
Descreva o entendimento majoritário dos tribunais sobre o tema.

## Principais precedentes e súmulas
Liste as súmulas vinculantes, súmulas dos tribunais superiores e leading cases mais relevantes, com número e ementa resumida.

## Divergências e correntes minoritárias
Apresente posicionamentos divergentes relevantes, se existirem.

## Legislação aplicável
Cite os dispositivos legais que fundamentam o entendimento jurisprudencial.

## Tendências recentes
Indique mudanças de posicionamento ou tendências em julgamentos recentes.

Use linguagem jurídica técnica e precisa. Cite precedentes com número do processo ou identificação quando possível.`;

  return new Response(streamText(prompt), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      // 🔒 SEGURANÇA: nosniff também na resposta de streaming (não herda o header global).
      "X-Content-Type-Options": "nosniff",
    },
  });
}
