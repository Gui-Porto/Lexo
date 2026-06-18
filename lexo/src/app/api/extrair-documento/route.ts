import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateFromPdf } from "@/lib/gemini";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const PROMPTS = {
  cliente: `Analise este documento jurídico (procuração, contrato, documento de identidade, ficha cadastral, etc.) e extraia os dados do cliente.

Retorne APENAS um JSON com exatamente estes campos:
{
  "name": "nome completo da pessoa ou razão social",
  "document": "CPF (formato 000.000.000-00) ou CNPJ (formato 00.000.000/0000-00), apenas o número com pontuação",
  "email": "endereço de email",
  "phone": "telefone com DDD",
  "notes": "informações adicionais relevantes (profissão, endereço, etc.)"
}

Use null para campos não encontrados. Retorne APENAS o JSON, sem texto adicional.`,

  processo: `Analise este documento jurídico (petição, despacho, sentença, ofício, etc.) e extraia os dados do processo.

Retorne APENAS um JSON com exatamente estes campos:
{
  "number": "número do processo no formato CNJ (0000000-00.0000.0.00.0000) ou qualquer formato encontrado",
  "area": "área jurídica — escolha uma: Cível, Trabalhista, Criminal, Família, Previdenciário, Tributário, Administrativo, Imobiliário, Empresarial, Consumidor, Outros",
  "description": "resumo objetivo dos fatos e objeto do processo em 2-4 frases"
}

Use null para campos não encontrados. Retorne APENAS o JSON, sem texto adicional.`,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tipo = formData.get("tipo") as string | null;

  if (!file || !tipo) {
    return NextResponse.json({ error: "Arquivo e tipo são obrigatórios" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Apenas arquivos PDF são suportados" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máximo 10 MB)" }, { status: 413 });
  }

  const prompt = PROMPTS[tipo as keyof typeof PROMPTS];
  if (!prompt) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  let text: string;
  try {
    text = await generateFromPdf(base64, prompt);
  } catch {
    return NextResponse.json({ error: "Erro ao processar documento" }, { status: 500 });
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Não foi possível extrair dados do documento" }, { status: 422 });
  }

  let extracted: Record<string, string | null>;
  try {
    extracted = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: "Não foi possível extrair dados do documento" }, { status: 422 });
  }

  return NextResponse.json(extracted);
}
