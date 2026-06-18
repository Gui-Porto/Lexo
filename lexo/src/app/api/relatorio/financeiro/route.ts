import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function escapeCSV(value: string | number | null | undefined): string {
  let str = String(value ?? "");
  // 🔒 SEGURANÇA [VULN-4]: CSV/Formula Injection (CWE-1236). Células que começam com
  // = + - @ (ou TAB/CR) são interpretadas como fórmula pelo Excel/Sheets. Prefixamos
  // com aspa simples para neutralizar a execução ao abrir o relatório.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 🔒 SEGURANÇA [VULN-2]: financeiro é vedado à SECRETARIA também na API de export,
  // não só na navegação protegida pelo proxy (CWE-285, A1).
  if (session.user.role === "SECRETARIA") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    organizationId: session.user.organizationId,
  };

  if (status) where.status = status;

  if (startDate || endDate) {
    where.dueDate = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate + "T23:59:59Z") } : {}),
    };
  }

  const invoices = await db.invoice.findMany({
    where,
    include: { client: true, case: { select: { number: true } } },
    orderBy: { dueDate: "asc" },
  });

  const header = ["Descrição", "Cliente", "Processo", "Valor (R$)", "Vencimento", "Status", "Pago em"];
  const rows = invoices.map((inv) => [
    inv.description,
    inv.client.name,
    inv.case?.number ?? "",
    Number(inv.amount).toFixed(2).replace(".", ","),
    inv.dueDate.toLocaleDateString("pt-BR", { timeZone: "UTC" }),
    inv.status,
    inv.paidAt ? inv.paidAt.toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "",
  ]);

  const total = invoices
    .filter((inv) => inv.status === "PAGO")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const csv = [
    header.map(escapeCSV).join(","),
    ...rows.map((r) => r.map(escapeCSV).join(",")),
    "",
    `Total recebido (PAGO),${total.toFixed(2).replace(".", ",")}`,
  ].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
