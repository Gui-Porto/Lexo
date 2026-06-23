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

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

const d = (daysOffset: number) => {
  const today = new Date();
  const dt = new Date(today);
  dt.setDate(dt.getDate() + daysOffset);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
};

async function cleanOrg(email: string) {
  const existing = await db.user.findFirst({ where: { email } });
  if (existing) {
    await db.organization.delete({ where: { id: existing.organizationId } });
    console.log(`✓ Org de ${email} removida`);
  }
}

async function seedTrial() {
  await cleanOrg("trial@lexo.dev");

  const org = await db.organization.create({
    data: {
      name: "Advocacia Silva & Associados",
      plan: "trial",
      trialEndsAt: d(7), // 7 dias restantes
    },
  });

  const admin = await db.user.create({
    data: {
      organizationId: org.id,
      name: "Ana Carolina Lima",
      email: "trial@lexo.dev",
      passwordHash: hash("senha123"),
      role: "ADMIN",
    },
  });

  const advogado = await db.user.create({
    data: {
      organizationId: org.id,
      name: "Rafael Mendonça",
      email: "trial.advogado@lexo.dev",
      passwordHash: hash("senha123"),
      role: "ADVOGADO",
    },
  });

  console.log(`✓ Org Trial criada: ${org.name} (plano: ${org.plan}, expira em 7 dias)`);

  // Clientes básicos
  const clientes = await Promise.all([
    db.client.create({ data: { organizationId: org.id, name: "João Pedro Alves", document: "123.456.789-09", email: "joao@gmail.com", phone: "(11) 98765-4321" } }),
    db.client.create({ data: { organizationId: org.id, name: "Maria Fernanda Souza", document: "987.654.321-00", email: "maria@hotmail.com", phone: "(21) 99123-5678" } }),
    db.client.create({ data: { organizationId: org.id, name: "Construtora Nobre Ltda", document: "12.345.678/0001-99", email: "juridico@nobre.com.br" } }),
  ]);
  console.log(`✓ ${clientes.length} clientes criados (Trial)`);

  // Processos (limitado a 5 de 10 do trial)
  const casos = await Promise.all([
    db.case.create({ data: { organizationId: org.id, clientId: clientes[0].id, number: "0001234-12.2024.8.26.0100", area: "Trabalhista", status: "ATIVO", description: "Reclamação trabalhista por verbas rescisórias.", responsavelId: advogado.id } }),
    db.case.create({ data: { organizationId: org.id, clientId: clientes[1].id, number: "0005678-45.2023.8.26.0100", area: "Trabalhista", status: "ATIVO", description: "Horas extras não reconhecidas.", responsavelId: advogado.id } }),
    db.case.create({ data: { organizationId: org.id, clientId: clientes[2].id, number: "0009999-01.2024.8.26.0200", area: "Cível", status: "SUSPENSO", description: "Ação de cobrança.", responsavelId: admin.id } }),
  ]);
  console.log(`✓ ${casos.length} processos criados (Trial)`);

  // Alguns andamentos
  for (const caso of casos) {
    await db.activityLog.create({
      data: {
        organizationId: org.id,
        caseId: caso.id,
        userName: admin.name,
        action: `Processo criado — ${caso.area}`,
        createdAt: d(-3),
      },
    });
  }

  // Prazos
  await db.deadline.create({ data: { organizationId: org.id, caseId: casos[0].id, type: "PRAZO", title: "Contestação", date: d(5), status: "PENDENTE" } });
  await db.deadline.create({ data: { organizationId: org.id, caseId: casos[1].id, type: "AUDIENCIA", title: "Audiência de instrução", date: d(12), status: "PENDENTE" } });

  // Honorários
  await db.invoice.create({ data: { organizationId: org.id, clientId: clientes[0].id, caseId: casos[0].id, description: "Honorários iniciais", amount: 2500, status: "PENDENTE", dueDate: d(10) } });

  return { admin, advogado };
}

async function seedPro() {
  await cleanOrg("pro@lexo.dev");

  const org = await db.organization.create({
    data: {
      name: "Escritório Borges & Associados",
      plan: "pro",
    },
  });

  const admin = await db.user.create({
    data: {
      organizationId: org.id,
      name: "Beatriz Borges",
      email: "pro@lexo.dev",
      passwordHash: hash("senha123"),
      role: "ADMIN",
    },
  });

  const advogado = await db.user.create({
    data: {
      organizationId: org.id,
      name: "Carlos Eduardo Rodrigues",
      email: "pro.advogado@lexo.dev",
      passwordHash: hash("senha123"),
      role: "ADVOGADO",
    },
  });

  const secretaria = await db.user.create({
    data: {
      organizationId: org.id,
      name: "Fernanda Costa",
      email: "pro.secretaria@lexo.dev",
      passwordHash: hash("senha123"),
      role: "SECRETARIA",
    },
  });

  const advogado2 = await db.user.create({
    data: {
      organizationId: org.id,
      name: "Lucas Mendes",
      email: "pro.advogado2@lexo.dev",
      passwordHash: hash("senha123"),
      role: "ADVOGADO",
    },
  });

  console.log(`✓ Org Pro criada: ${org.name} (plano: ${org.plan})`);

  // Clientes
  const clientes = await Promise.all([
    db.client.create({ data: { organizationId: org.id, name: "Tech Solutions EIRELI", document: "98.765.432/0001-10", email: "contato@techsolutions.io", phone: "(11) 4567-8901" } }),
    db.client.create({ data: { organizationId: org.id, name: "Maria Fernanda Souza", document: "987.654.321-00", email: "maria.souza@hotmail.com", phone: "(21) 99123-5678", notes: "Caso trabalhista." } }),
    db.client.create({ data: { organizationId: org.id, name: "Construtora Horizonte Ltda", document: "11.222.333/0001-44", email: "juridico@horizonte.com.br" } }),
    db.client.create({ data: { organizationId: org.id, name: "Roberto Fonseca", document: "234.567.890-12", email: "roberto.fonseca@gmail.com", phone: "(31) 97654-3210" } }),
    db.client.create({ data: { organizationId: org.id, name: "Beatriz Oliveira", document: "321.654.987-12", email: "beatriz.oliveira@yahoo.com.br" } }),
    db.client.create({ data: { organizationId: org.id, name: "Grupo Empresarial Norte S/A", document: "55.666.777/0001-88", email: "juridico@gruponorte.com.br" } }),
  ]);
  console.log(`✓ ${clientes.length} clientes criados (Pro)`);

  // Processos
  const casos = await Promise.all([
    db.case.create({ data: { organizationId: org.id, clientId: clientes[0].id, number: "0001111-12.2024.8.26.0100", area: "Empresarial", status: "ATIVO", description: "Elaboração de contratos de TI.", responsavelId: advogado.id } }),
    db.case.create({ data: { organizationId: org.id, clientId: clientes[1].id, number: "0002222-45.2023.8.26.0100", area: "Trabalhista", status: "ATIVO", description: "Horas extras e adicional noturno.", responsavelId: advogado.id } }),
    db.case.create({ data: { organizationId: org.id, clientId: clientes[2].id, number: "0003333-01.2024.8.26.0200", area: "Cível", status: "ATIVO", description: "Ação de cobrança contratual.", responsavelId: advogado2.id } }),
    db.case.create({ data: { organizationId: org.id, clientId: clientes[3].id, number: "0004444-67.2025.8.26.0100", area: "Família", status: "ATIVO", description: "Divórcio consensual.", responsavelId: admin.id } }),
    db.case.create({ data: { organizationId: org.id, clientId: clientes[4].id, number: "0005555-78.2024.8.26.0300", area: "Sucessões", status: "ATIVO", description: "Inventário extrajudicial.", responsavelId: advogado2.id } }),
    db.case.create({ data: { organizationId: org.id, clientId: clientes[5].id, number: "0006666-22.2025.8.26.0100", area: "Tributário", status: "ATIVO", description: "Planejamento tributário.", responsavelId: advogado.id } }),
    db.case.create({ data: { organizationId: org.id, clientId: clientes[0].id, number: "0007777-33.2023.8.26.0100", area: "Empresarial", status: "ENCERRADO", description: "Due diligence — encerrado com êxito.", responsavelId: advogado.id } }),
  ]);
  console.log(`✓ ${casos.length} processos criados (Pro)`);

  // Andamentos
  const actionsByCase = [
    { caseId: casos[0].id, actions: ["Processo criado — Empresarial", "Status atualizado para ATIVO", "Documentação recebida do cliente"] },
    { caseId: casos[1].id, actions: ["Processo criado — Trabalhista", "Petição inicial protocolada"] },
    { caseId: casos[2].id, actions: ["Processo criado — Cível", "Audiência de conciliação agendada", "Status atualizado"] },
    { caseId: casos[3].id, actions: ["Processo criado — Família"] },
    { caseId: casos[4].id, actions: ["Processo criado — Sucessões", "Inventariante nomeado"] },
    { caseId: casos[6].id, actions: ["Processo criado — Empresarial", "Processo encerrado com êxito"] },
  ];

  for (const { caseId, actions } of actionsByCase) {
    for (let j = 0; j < actions.length; j++) {
      await db.activityLog.create({
        data: {
          organizationId: org.id,
          caseId,
          userName: admin.name,
          action: actions[j],
          createdAt: d(-30 + j * 5),
        },
      });
    }
  }

  // Prazos
  await Promise.all([
    db.deadline.create({ data: { organizationId: org.id, caseId: casos[0].id, type: "PRAZO", title: "Prazo para manifestação", date: d(5), status: "PENDENTE" } }),
    db.deadline.create({ data: { organizationId: org.id, caseId: casos[1].id, type: "AUDIENCIA", title: "Audiência de instrução", date: d(15), status: "PENDENTE" } }),
    db.deadline.create({ data: { organizationId: org.id, caseId: casos[2].id, type: "PRAZO", title: "Contestação", date: d(3), status: "PENDENTE" } }),
    db.deadline.create({ data: { organizationId: org.id, caseId: casos[3].id, type: "REUNIAO", title: "Reunião com cliente", date: d(2), status: "PENDENTE" } }),
    db.deadline.create({ data: { organizationId: org.id, caseId: casos[4].id, type: "OUTRO", title: "Envio de escritura ao cartório", date: d(20), status: "PENDENTE" } }),
    db.deadline.create({ data: { organizationId: org.id, caseId: casos[0].id, type: "PRAZO", title: "Juntada de documentos", date: d(-10), status: "CONCLUIDO" } }),
  ]);

  // Honorários
  await Promise.all([
    db.invoice.create({ data: { organizationId: org.id, clientId: clientes[0].id, caseId: casos[0].id, description: "Honorários — contratos TI", amount: 8000, status: "PAGO", dueDate: d(-30), paidAt: d(-28) } }),
    db.invoice.create({ data: { organizationId: org.id, clientId: clientes[0].id, caseId: casos[0].id, description: "Honorários mensais — Jun/2026", amount: 1200, status: "PENDENTE", dueDate: d(5) } }),
    db.invoice.create({ data: { organizationId: org.id, clientId: clientes[1].id, caseId: casos[1].id, description: "Honorários contratuais", amount: 4500, status: "ATRASADO", dueDate: d(-15) } }),
    db.invoice.create({ data: { organizationId: org.id, clientId: clientes[2].id, caseId: casos[2].id, description: "Consultoria jurídica", amount: 12000, status: "PAGO", dueDate: d(-60), paidAt: d(-58) } }),
    db.invoice.create({ data: { organizationId: org.id, clientId: clientes[3].id, caseId: casos[3].id, description: "Honorários — divórcio", amount: 5500, status: "PENDENTE", dueDate: d(10) } }),
    db.invoice.create({ data: { organizationId: org.id, clientId: clientes[4].id, caseId: casos[4].id, description: "Honorários — inventário", amount: 7000, status: "PENDENTE", dueDate: d(30) } }),
    db.invoice.create({ data: { organizationId: org.id, clientId: clientes[5].id, caseId: casos[5].id, description: "Planejamento tributário", amount: 15000, status: "PAGO", dueDate: d(-45), paidAt: d(-40) } }),
    db.invoice.create({ data: { organizationId: org.id, clientId: clientes[0].id, caseId: casos[6].id, description: "Êxito — due diligence", amount: 20000, status: "PAGO", dueDate: d(-90), paidAt: d(-85) } }),
  ]);

  // Tarefas
  await Promise.all([
    db.task.create({ data: { organizationId: org.id, title: "Revisar contrato Tech Solutions", caseId: casos[0].id, assignedToId: advogado.id, assignedToName: advogado.name, status: "EM_ANDAMENTO", priority: "ALTA", dueDate: d(3) } }),
    db.task.create({ data: { organizationId: org.id, title: "Preparar petição trabalhista", caseId: casos[1].id, assignedToId: advogado.id, assignedToName: advogado.name, status: "PENDENTE", priority: "ALTA", dueDate: d(2) } }),
    db.task.create({ data: { organizationId: org.id, title: "Ligar para cliente — atualização", assignedToId: secretaria.id, assignedToName: secretaria.name, status: "PENDENTE", priority: "MEDIA", dueDate: d(1) } }),
    db.task.create({ data: { organizationId: org.id, title: "Organizar documentos do inventário", caseId: casos[4].id, assignedToId: advogado2.id, assignedToName: advogado2.name, status: "PENDENTE", priority: "BAIXA", dueDate: d(7) } }),
  ]);

  return { admin, advogado, secretaria };
}

async function main() {
  console.log("🌱 Iniciando seed...\n");

  const trial = await seedTrial();
  const pro = await seedPro();

  console.log("\n✅ Seed concluído!\n");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║           CREDENCIAIS DE ACESSO                 ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║  PLANO TRIAL (7 dias, 3 usuários max, sem IA)   ║");
  console.log("║  Admin   → trial@lexo.dev       / senha123      ║");
  console.log("║  Advogado→ trial.advogado@lexo.dev / senha123   ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║  PLANO PRO (ilimitado, todas as features)       ║");
  console.log("║  Admin   → pro@lexo.dev         / senha123      ║");
  console.log("║  Advogado→ pro.advogado@lexo.dev  / senha123    ║");
  console.log("║  Secretar→ pro.secretaria@lexo.dev / senha123   ║");
  console.log("╚══════════════════════════════════════════════════╝");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
