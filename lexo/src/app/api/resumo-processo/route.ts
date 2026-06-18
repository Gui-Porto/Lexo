import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { streamText } from "@/lib/gemini";
import { z } from "zod";

const schema = z.object({ caseId: z.string().min(1) });

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

  const caso = await db.case.findFirst({
    where: { id: parsed.data.caseId, organizationId: session.user.organizationId },
    include: {
      client: { select: { name: true, email: true, phone: true } },
      responsavel: { select: { name: true } },
      deadlines: { orderBy: { date: "asc" } },
      invoices: { orderBy: { dueDate: "asc" } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!caso) {
    return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
  }

  const now = new Date();

  const prazosText = caso.deadlines.length
    ? caso.deadlines
        .map(
          (d) =>
            `- ${d.title} (${d.type}, ${d.status}, ${d.date.toLocaleDateString("pt-BR", { timeZone: "UTC" })})`
        )
        .join("\n")
    : "Nenhum prazo cadastrado.";

  const financeirosText = caso.invoices.length
    ? caso.invoices
        .map(
          (inv) =>
            `- ${inv.description}: R$ ${Number(inv.amount).toFixed(2)} — ${inv.status} (venc. ${inv.dueDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })})`
        )
        .join("\n")
    : "Nenhum honorário cadastrado.";

  const atividadesText = caso.activityLogs.length
    ? caso.activityLogs
        .slice(0, 5)
        .map(
          (a) =>
            `- ${a.action} (${a.userName}, ${a.createdAt.toLocaleDateString("pt-BR")})`
        )
        .join("\n")
    : "Sem atividade registrada.";

  const prazosCriticos = caso.deadlines.filter(
    (d) =>
      d.status === "PENDENTE" &&
      (d.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7
  );

  const prompt = `Você é um advogado sênior analisando um processo jurídico. Gere um resumo executivo completo e útil com base nos dados abaixo.

## Dados do processo

Número: ${caso.number}
Área: ${caso.area ?? "Não informada"}
Status: ${caso.status}
Cliente: ${caso.client.name}${caso.client.email ? ` (${caso.client.email})` : ""}${caso.client.phone ? ` — Tel: ${caso.client.phone}` : ""}
Responsável: ${caso.responsavel?.name ?? "Não atribuído"}
Criado em: ${caso.createdAt.toLocaleDateString("pt-BR")}
Descrição: ${caso.description ?? "Não informada"}

### Prazos e audiências
${prazosText}
${prazosCriticos.length > 0 ? `\n⚠️ Prazos críticos (≤7 dias): ${prazosCriticos.map((d) => d.title).join(", ")}` : ""}

### Honorários
${financeirosText}

### Atividade recente
${atividadesText}

---

Estruture o resumo com:

## Visão geral
Síntese do caso em 2-3 frases.

## Situação atual
Análise do estado atual do processo, prazos em aberto e próximas etapas.

## Pontos de atenção
Liste riscos, prazos críticos, honorários vencidos ou outras questões urgentes.

## Recomendações
Sugira 2-4 ações concretas que o advogado responsável deveria tomar nos próximos dias.

Seja direto, prático e use linguagem profissional. Destaque urgências quando existirem.`;

  return new Response(streamText(prompt), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
