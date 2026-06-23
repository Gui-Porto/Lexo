import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { streamChat, type ChatMessage } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const SYSTEM_PROMPT = `Você é Lexo IA, assistente jurídico especializado em direito brasileiro. Sua função é auxiliar advogados e equipes jurídicas com consultas sobre legislação, jurisprudência, prazos e estratégia processual.

Seja objetivo, técnico e use linguagem jurídica precisa. Quando citar jurisprudência, indique o tribunal, número do processo ou súmula. Quando citar legislação, indique o dispositivo exato.

Estruture respostas longas com subtítulos (## Seção). Para listas, use marcadores. Nunca invente precedentes — se não tiver certeza, diga explicitamente.`;

const msgSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const schema = z.object({
  messages: z.array(msgSchema).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!(await checkRateLimit(`ai:${session.user.organizationId}`, 30, 60))) {
    return NextResponse.json({ error: "Muitas requisições. Aguarde um momento." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { messages } = parsed.data;

  return new Response(streamChat(messages as ChatMessage[], SYSTEM_PROMPT), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
