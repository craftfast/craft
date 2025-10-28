/*
  Warnings:

  - You are about to drop the column `canPurchaseTokens` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyTokenLimit` on the `plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "canPurchaseTokens",
DROP COLUMN "monthlyTokenLimit",
ADD COLUMN     "dailyCredits" INTEGER,
ADD COLUMN     "monthlyCredits" INTEGER;

-- AlterTable
ALTER TABLE "usage_records" ADD COLUMN     "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "dailyCreditsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCreditReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
