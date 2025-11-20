/*
  Warnings:

  - You are about to drop the column `polarCheckoutId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `polarPaymentId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `polarCheckoutId` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `polarPaymentId` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `polarSignature` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `polarPriceId` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `polarProductId` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `polarCheckoutId` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `polarCustomerId` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `polarPaymentId` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `polarSubscriptionId` on the `user_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `polarCustomerExtId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `polarCustomerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `polar_usage_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `polar_webhook_events` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[razorpayPlanId]` on the table `plans` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpaySubscriptionId]` on the table `user_subscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payment_transactions_polarCheckoutId_idx";

-- DropIndex
DROP INDEX "payment_transactions_polarPaymentId_idx";

-- DropIndex
DROP INDEX "plans_polarProductId_idx";

-- DropIndex
DROP INDEX "plans_polarProductId_key";

-- DropIndex
DROP INDEX "user_subscriptions_polarCustomerId_idx";

-- DropIndex
DROP INDEX "user_subscriptions_polarSubscriptionId_idx";

-- DropIndex
DROP INDEX "user_subscriptions_polarSubscriptionId_key";

-- DropIndex
DROP INDEX "users_polarCustomerExtId_idx";

-- DropIndex
DROP INDEX "users_polarCustomerExtId_key";

-- DropIndex
DROP INDEX "users_polarCustomerId_idx";

-- DropIndex
DROP INDEX "users_polarCustomerId_key";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "polarCheckoutId",
DROP COLUMN "polarPaymentId",
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;

-- AlterTable
ALTER TABLE "payment_transactions" DROP COLUMN "polarCheckoutId",
DROP COLUMN "polarPaymentId",
DROP COLUMN "polarSignature",
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT,
ALTER COLUMN "paymentMethod" SET DEFAULT 'razorpay';

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "polarPriceId",
DROP COLUMN "polarProductId",
ADD COLUMN     "razorpayPlanId" TEXT;

-- AlterTable
ALTER TABLE "user_subscriptions" DROP COLUMN "polarCheckoutId",
DROP COLUMN "polarCustomerId",
DROP COLUMN "polarPaymentId",
DROP COLUMN "polarSubscriptionId",
ADD COLUMN     "razorpayCustomerId" TEXT,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "polarCustomerExtId",
DROP COLUMN "polarCustomerId",
ADD COLUMN     "razorpayCustomerId" TEXT;

-- DropTable
DROP TABLE "polar_usage_events";

-- DropTable
DROP TABLE "polar_webhook_events";

-- CreateTable
CREATE TABLE "razorpay_webhook_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_webhook_events_eventId_key" ON "razorpay_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "razorpay_webhook_events_eventType_idx" ON "razorpay_webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "razorpay_webhook_events_status_idx" ON "razorpay_webhook_events"("status");

-- CreateIndex
CREATE INDEX "razorpay_webhook_events_createdAt_idx" ON "razorpay_webhook_events"("createdAt");

-- CreateIndex
CREATE INDEX "payment_transactions_razorpayOrderId_idx" ON "payment_transactions"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "payment_transactions_razorpayPaymentId_idx" ON "payment_transactions"("razorpayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_razorpayPlanId_key" ON "plans"("razorpayPlanId");

-- CreateIndex
CREATE INDEX "plans_razorpayPlanId_idx" ON "plans"("razorpayPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_razorpaySubscriptionId_key" ON "user_subscriptions"("razorpaySubscriptionId");

-- CreateIndex
CREATE INDEX "user_subscriptions_razorpaySubscriptionId_idx" ON "user_subscriptions"("razorpaySubscriptionId");

-- CreateIndex
CREATE INDEX "user_subscriptions_razorpayCustomerId_idx" ON "user_subscriptions"("razorpayCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_razorpayCustomerId_key" ON "users"("razorpayCustomerId");

-- CreateIndex
CREATE INDEX "users_razorpayCustomerId_idx" ON "users"("razorpayCustomerId");
