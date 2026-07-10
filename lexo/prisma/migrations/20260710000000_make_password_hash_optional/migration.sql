-- Contas Google-only nao tem senha
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
