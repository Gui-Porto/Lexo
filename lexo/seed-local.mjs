import { PrismaClient } from "./src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const db = new PrismaClient({
  datasources: { db: { url: "postgresql://postgres:postgres@localhost:5432/lexo_dev" } },
});

const hash = await bcrypt.hash("admin123", 10);
await db.organization.create({
  data: {
    name: "Escritório Teste",
    users: {
      create: {
        name: "Admin",
        email: "admin@lexo.dev",
        passwordHash: hash,
        role: "ADMIN",
      },
    },
  },
});

console.log("✓ Usuário criado: admin@lexo.dev / admin123");
await db.$disconnect();
