import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrações usam a conexão direta do Neon (sem pooler) — o pooler
    // em modo transaction não suporta os advisory locks que o migrate usa.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
