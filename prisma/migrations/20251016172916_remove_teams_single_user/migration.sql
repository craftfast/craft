/*
  Warnings:

  - You are about to drop the column `teamId` on the `ai_token_usage` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `token_purchases` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the `team_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teams` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `payment_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `usage_records` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_members" DROP CONSTRAINT "team_members_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_members" DROP CONSTRAINT "team_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_subscriptions" DROP CONSTRAINT "team_subscriptions_planId_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_subscriptions" DROP CONSTRAINT "team_subscriptions_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."teams" DROP CONSTRAINT "teams_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."usage_records" DROP CONSTRAINT "usage_records_subscriptionId_fkey";

-- DropIndex
DROP INDEX "public"."ai_token_usage_teamId_createdAt_idx";

-- DropIndex
DROP INDEX "public"."files_teamId_idx";

-- DropIndex
DROP INDEX "public"."invoices_teamId_idx";

-- DropIndex
DROP INDEX "public"."payment_transactions_teamId_idx";

-- DropIndex
DROP INDEX "public"."token_purchases_teamId_idx";

-- DropIndex
DROP INDEX "public"."usage_records_teamId_billingPeriodStart_idx";

-- AlterTable
ALTER TABLE "ai_token_usage" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "files" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "teamId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payment_transactions" DROP COLUMN "teamId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "token_purchases" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "usage_records" DROP COLUMN "teamId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."team_members";

-- DropTable
DROP TABLE "public"."team_subscriptions";

-- DropTable
DROP TABLE "public"."teams";

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "polarCheckoutId" TEXT,
    "polarPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_userId_key" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_idx" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_subscriptions_planId_idx" ON "user_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");

-- CreateIndex
CREATE INDEX "user_subscriptions_currentPeriodEnd_idx" ON "user_subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- CreateIndex
CREATE INDEX "payment_transactions_userId_idx" ON "payment_transactions"("userId");

-- CreateIndex
CREATE INDEX "usage_records_userId_billingPeriodStart_idx" ON "usage_records"("userId", "billingPeriodStart");

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
