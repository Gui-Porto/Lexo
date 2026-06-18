import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("🌱 Iniciando seed...");

  // Limpeza de dados anteriores do seed
  const existing = await db.user.findFirst({ where: { email: "admin@lexo.dev" } });
  if (existing) {
    await db.organization.delete({ where: { id: existing.organizationId } });
    console.log("✓ Dados anteriores removidos");
  }

  // Organização
  const org = await db.organization.create({
    data: {
      name: "Escritório Teste & Advogados",
      plan: "trial",
    },
  });
  console.log(`✓ Organização criada: ${org.name} (${org.id})`);

  // Usuários
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const admin = await db.user.create({
    data: {
      organizationId: org.id,
      name: "Ana Carolina Lima",
      email: "admin@lexo.dev",
      passwordHash: hash("senha123"),
      role: "ADMIN",
    },
  });

  const advogado = await db.user.create({
    data: {
      organizationId: org.id,
      name: "Rafael Mendonça",
      email: "rafael@lexo.dev",
      passwordHash: hash("senha123"),
      role: "ADVOGADO",
    },
  });

  const secretaria = await db.user.create({
    data: {
      organizationId: org.id,
      name: "Fernanda Costa",
      email: "fernanda@lexo.dev",
      passwordHash: hash("senha123"),
      role: "SECRETARIA",
    },
  });

  console.log(`✓ Usuários criados: ${admin.email}, ${advogado.email}, ${secretaria.email}`);

  // Clientes
  const clientesData = [
    {
      name: "João Pedro Alves",
      document: "123.456.789-09",
      email: "joao.alves@gmail.com",
      phone: "(11) 98765-4321",
      notes: "Cliente desde 2022. Prefere contato por WhatsApp.",
    },
    {
      name: "Maria Fernanda Souza",
      document: "987.654.321-00",
      email: "maria.souza@hotmail.com",
      phone: "(21) 99123-5678",
      notes: "Caso trabalhista em andamento.",
    },
    {
      name: "Construtora Nobre Ltda",
      document: "12.345.678/0001-99",
      email: "juridico@construtora-nobre.com.br",
      phone: "(11) 3456-7890",
      notes: "Empresa do setor civil. CNPJ verificado.",
    },
    {
      name: "Carlos Eduardo Rodrigues",
      document: "456.789.123-05",
      email: "carlos.rodrigues@outlook.com",
      phone: "(31) 97654-3210",
      notes: "Processo de divórcio litigioso.",
    },
    {
      name: "Beatriz Oliveira Martins",
      document: "321.654.987-12",
      email: "beatriz.martins@yahoo.com.br",
      phone: "(85) 98811-2233",
      notes: "Inventário do pai, três herdeiros.",
    },
    {
      name: "Tech Solutions EIRELI",
      document: "98.765.432/0001-10",
      email: "contato@techsolutions.io",
      phone: "(11) 4567-8901",
      notes: "Startup de tecnologia. Contrato de prestação de serviços.",
    },
  ];

  const clientes = await Promise.all(
    clientesData.map((c) =>
      db.client.create({ data: { organizationId: org.id, ...c } })
    )
  );
  console.log(`✓ ${clientes.length} clientes criados`);

  // Processos
  const casosData = [
    {
      clientId: clientes[0].id,
      number: "0001234-12.2024.8.26.0100",
      area: "Trabalhista",
      status: "ATIVO" as const,
      description: "Reclamação trabalhista por verbas rescisórias não pagas.",
      responsavelId: advogado.id,
    },
    {
      clientId: clientes[1].id,
      number: "0005678-45.2023.8.26.0100",
      area: "Trabalhista",
      status: "ATIVO" as const,
      description: "Horas extras e adicional noturno não reconhecidos.",
      responsavelId: advogado.id,
    },
    {
      clientId: clientes[2].id,
      number: "0009999-01.2024.8.26.0200",
      area: "Cível",
      status: "SUSPENSO" as const,
      description: "Ação de cobrança por inadimplemento contratual na obra Residencial das Flores.",
      responsavelId: admin.id,
    },
    {
      clientId: clientes[3].id,
      number: "0002345-67.2025.8.26.0100",
      area: "Família",
      status: "ATIVO" as const,
      description: "Divórcio litigioso com partilha de bens e guarda compartilhada.",
      responsavelId: admin.id,
    },
    {
      clientId: clientes[4].id,
      number: "0003456-78.2024.8.26.0300",
      area: "Sucessões",
      status: "ATIVO" as const,
      description: "Inventário extrajudicial com três herdeiros e imóvel rural.",
      responsavelId: advogado.id,
    },
    {
      clientId: clientes[5].id,
      number: "0007777-22.2025.8.26.0100",
      area: "Empresarial",
      status: "ATIVO" as const,
      description: "Revisão e elaboração de contratos de prestação de serviços de TI.",
      responsavelId: admin.id,
    },
    {
      clientId: clientes[0].id,
      number: "0008888-33.2023.8.26.0100",
      area: "Previdenciário",
      status: "ENCERRADO" as const,
      description: "Revisão de benefício de aposentadoria por invalidez. Processo encerrado com êxito.",
      responsavelId: advogado.id,
    },
  ];

  const casos = await Promise.all(
    casosData.map((c) =>
      db.case.create({ data: { organizationId: org.id, ...c } })
    )
  );
  console.log(`✓ ${casos.length} processos criados`);

  // Prazos e audiências
  const today = new Date();
  const d = (daysOffset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + daysOffset);
    dt.setUTCHours(0, 0, 0, 0);
    return dt;
  };

  const prazoData = [
    { caseId: casos[0].id, type: "PRAZO" as const, title: "Manifestação sobre contestação", date: d(5), status: "PENDENTE" as const },
    { caseId: casos[0].id, type: "AUDIENCIA" as const, title: "Audiência de instrução e julgamento", date: d(15), status: "PENDENTE" as const },
    { caseId: casos[1].id, type: "PRAZO" as const, title: "Interposição de recurso ordinário", date: d(3), status: "PENDENTE" as const },
    { caseId: casos[2].id, type: "PRAZO" as const, title: "Contestação — prazo fatal", date: d(-2), status: "PERDIDO" as const },
    { caseId: casos[3].id, type: "AUDIENCIA" as const, title: "Audiência de mediação", date: d(8), status: "PENDENTE" as const },
    { caseId: casos[3].id, type: "REUNIAO" as const, title: "Reunião com cliente para coleta de documentos", date: d(2), status: "PENDENTE" as const },
    { caseId: casos[4].id, type: "OUTRO" as const, title: "Envio de escritura ao cartório", date: d(20), status: "PENDENTE" as const },
    { caseId: casos[5].id, type: "REUNIAO" as const, title: "Revisão final do contrato com o cliente", date: d(1), status: "PENDENTE" as const },
    { caseId: casos[0].id, type: "PRAZO" as const, title: "Juntada de procuração", date: d(-10), status: "CONCLUIDO" as const },
  ];

  await Promise.all(
    prazoData.map((p) =>
      db.deadline.create({ data: { organizationId: org.id, ...p } })
    )
  );
  console.log(`✓ ${prazoData.length} prazos/audiências criados`);

  // Honorários / Faturas
  const invoiceData = [
    { clientId: clientes[0].id, caseId: casos[0].id, description: "Honorários iniciais — proc. trabalhista", amount: 3500, status: "PAGO" as const, dueDate: d(-30), paidAt: d(-28) },
    { clientId: clientes[0].id, caseId: casos[0].id, description: "Honorários mensais — Maio/2026", amount: 800, status: "PENDENTE" as const, dueDate: d(5) },
    { clientId: clientes[1].id, caseId: casos[1].id, description: "Honorários contratuais", amount: 4200, status: "ATRASADO" as const, dueDate: d(-15) },
    { clientId: clientes[2].id, caseId: casos[2].id, description: "Consultoria jurídica — Construtora Nobre", amount: 12000, status: "PAGO" as const, dueDate: d(-60), paidAt: d(-58) },
    { clientId: clientes[3].id, caseId: casos[3].id, description: "Honorários — divórcio litigioso", amount: 6000, status: "PENDENTE" as const, dueDate: d(10) },
    { clientId: clientes[4].id, caseId: casos[4].id, description: "Honorários — inventário (1ª parcela)", amount: 5000, status: "PAGO" as const, dueDate: d(-45), paidAt: d(-44) },
    { clientId: clientes[4].id, caseId: casos[4].id, description: "Honorários — inventário (2ª parcela)", amount: 5000, status: "PENDENTE" as const, dueDate: d(30) },
    { clientId: clientes[5].id, caseId: casos[5].id, description: "Elaboração de contratos — Tech Solutions", amount: 2800, status: "PENDENTE" as const, dueDate: d(7) },
    { clientId: clientes[0].id, caseId: casos[6].id, description: "Êxito previdenciário (20%)", amount: 9600, status: "PAGO" as const, dueDate: d(-90), paidAt: d(-85) },
  ];

  await Promise.all(
    invoiceData.map(({ paidAt, amount, ...rest }) =>
      db.invoice.create({
        data: {
          organizationId: org.id,
          amount,
          ...rest,
          ...(paidAt ? { paidAt } : {}),
        },
      })
    )
  );
  console.log(`✓ ${invoiceData.length} faturas criadas`);

  console.log("\n✅ Seed concluído!\n");
  console.log("Credenciais de acesso:");
  console.log("  Admin      → admin@lexo.dev     / senha123");
  console.log("  Advogado   → rafael@lexo.dev    / senha123");
  console.log("  Secretaria → fernanda@lexo.dev  / senha123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
