import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const schema = z.object({
  caseId: z.string().min(1),
  tipoDocumento: z.string().min(1),
  instrucoes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { caseId, tipoDocumento, instrucoes } = parsed.data;

  const caso = await db.case.findFirst({
    where: { id: caseId, organizationId: session.user.organizationId },
    include: { client: { select: { name: true } } },
  });

  if (!caso) {
    return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Você é um advogado brasileiro especialista em redação de peças processuais. Gere uma ${tipoDocumento} completa e bem estruturada com base nos seguintes dados do processo:

**Número do processo:** ${caso.number}
**Cliente/Parte:** ${caso.client.name}
**Área jurídica:** ${caso.area ?? "Não informada"}
**Descrição dos fatos:** ${caso.description ?? "Não informada"}
${instrucoes ? `\n**Instruções específicas:** ${instrucoes}` : ""}

A peça deve seguir as normas processuais brasileiras vigentes (CPC/2015 ou legislação específica da área). Estruture adequadamente com: qualificação das partes, fatos, fundamentos jurídicos, pedidos, requerimentos finais, local/data e espaço para assinatura. Use linguagem jurídica formal e precisa. Inclua referências a artigos de lei e jurisprudência relevantes quando aplicável.`;

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.error(new Error("Erro ao gerar minuta"));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
