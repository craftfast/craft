/*
  Warnings:

  - You are about to alter the column `dailyCreditsUsed` on the `user_subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "user_subscriptions" ALTER COLUMN "dailyCreditsUsed" SET DEFAULT 0,
ALTER COLUMN "dailyCreditsUsed" SET DATA TYPE DECIMAL(10,2);
