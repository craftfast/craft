/*
  Warnings:

  - You are about to drop the column `aiTokensUsed` on the `usage_records` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ai_token_usage" ADD COLUMN     "callType" TEXT NOT NULL DEFAULT 'agent';

-- AlterTable
ALTER TABLE "usage_records" DROP COLUMN "aiTokensUsed";

-- CreateIndex
CREATE INDEX "ai_token_usage_callType_createdAt_idx" ON "ai_token_usage"("callType", "createdAt");
