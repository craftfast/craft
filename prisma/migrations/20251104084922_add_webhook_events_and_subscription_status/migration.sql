/*
  Warnings:

  - You are about to drop the column `dailyCredits` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `dailyCreditsUsed` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `lastCreditReset` on the `user_subscriptions` table. All the data in the column will be lost.
  - The `status` column on the `user_subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING', 'UNPAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "taxAmount" DOUBLE PRECISION,
ADD COLUMN     "taxCountryCode" TEXT,
ADD COLUMN     "taxRate" DOUBLE PRECISION,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "dailyCredits",
ALTER COLUMN "monthlyCredits" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_subscriptions" DROP COLUMN "dailyCreditsUsed",
DROP COLUMN "lastCreditReset",
ADD COLUMN     "gracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "paymentFailedAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "webhook_events_createdAt_idx" ON "webhook_events"("createdAt");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");

-- CreateIndex
CREATE INDEX "user_subscriptions_gracePeriodEndsAt_idx" ON "user_subscriptions"("gracePeriodEndsAt");
