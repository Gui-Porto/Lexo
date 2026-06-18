-- CreateTable RateHit
CREATE TABLE "RateHit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateHit_key_createdAt_idx" ON "RateHit"("key", "createdAt");
