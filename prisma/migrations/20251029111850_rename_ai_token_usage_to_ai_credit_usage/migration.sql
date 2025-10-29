/*
  Warnings:

  - You are about to drop the column `aiModelMultipliers` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the `ai_token_usage` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "usage_records" DROP COLUMN "aiModelMultipliers";

-- DropTable
DROP TABLE "public"."ai_token_usage";

-- CreateTable
CREATE TABLE "ai_credit_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "creditsUsed" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "modelMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "endpoint" TEXT,
    "callType" TEXT NOT NULL DEFAULT 'agent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_credit_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_credit_usage_userId_createdAt_idx" ON "ai_credit_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_usage_projectId_createdAt_idx" ON "ai_credit_usage"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_usage_model_createdAt_idx" ON "ai_credit_usage"("model", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_usage_callType_createdAt_idx" ON "ai_credit_usage"("callType", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_usage_createdAt_idx" ON "ai_credit_usage"("createdAt");
