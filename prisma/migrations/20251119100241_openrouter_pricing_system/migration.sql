/*
  Warnings:

  - You are about to drop the column `costUsd` on the `ai_credit_usage` table. All the data in the column will be lost.
  - You are about to drop the column `creditsUsed` on the `ai_credit_usage` table. All the data in the column will be lost.
  - You are about to drop the column `modelMultiplier` on the `ai_credit_usage` table. All the data in the column will be lost.
  - You are about to drop the column `costUsd` on the `deployment_usage` table. All the data in the column will be lost.
  - You are about to drop the column `creditsUsed` on the `deployment_usage` table. All the data in the column will be lost.
  - You are about to drop the column `costUsd` on the `sandbox_usage` table. All the data in the column will be lost.
  - You are about to drop the column `creditsUsed` on the `sandbox_usage` table. All the data in the column will be lost.
  - You are about to drop the column `costUsd` on the `storage_usage` table. All the data in the column will be lost.
  - You are about to drop the column `creditsUsed` on the `storage_usage` table. All the data in the column will be lost.
  - Added the required column `providerCostUsd` to the `ai_credit_usage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BalanceTransactionType" AS ENUM ('TOPUP', 'AI_USAGE', 'SANDBOX_USAGE', 'STORAGE_USAGE', 'DATABASE_USAGE', 'DEPLOYMENT');

-- AlterTable: Add new column with default, copy data, then remove default
ALTER TABLE "ai_credit_usage" ADD COLUMN "providerCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;
UPDATE "ai_credit_usage" SET "providerCostUsd" = "costUsd" WHERE "costUsd" IS NOT NULL;
ALTER TABLE "ai_credit_usage" ALTER COLUMN "providerCostUsd" DROP DEFAULT;
ALTER TABLE "ai_credit_usage" DROP COLUMN "costUsd",
DROP COLUMN "creditsUsed",
DROP COLUMN "modelMultiplier";

-- AlterTable
ALTER TABLE "deployment_usage" DROP COLUMN "costUsd",
DROP COLUMN "creditsUsed",
ADD COLUMN     "providerCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sandbox_usage" DROP COLUMN "costUsd",
DROP COLUMN "creditsUsed",
ADD COLUMN     "providerCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "storage_usage" DROP COLUMN "costUsd",
DROP COLUMN "creditsUsed",
ADD COLUMN     "providerCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "balance_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BalanceTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balanceBefore" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "balance_transactions_userId_createdAt_idx" ON "balance_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "balance_transactions_type_createdAt_idx" ON "balance_transactions"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
