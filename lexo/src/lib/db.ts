import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// idleTimeoutMillis baixo evita reciclar uma conexão que ficou "zumbi" depois que o
// compute do Neon hiberna por inatividade — sem isso, o pool de vida longa do dev
// reutiliza uma conexão morta e o driver adapter reporta erro de protocolo como se
// fosse uma violação de constraint qualquer.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, idleTimeoutMillis: 10_000 });
pool.on("error", (err) => {
  console.error("[db] erro inesperado no pool do Postgres:", err);
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg(pool) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
