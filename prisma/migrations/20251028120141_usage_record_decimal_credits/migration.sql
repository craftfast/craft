/*
  Warnings:

  - You are about to alter the column `aiCreditsUsed` on the `usage_records` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "usage_records" ALTER COLUMN "aiCreditsUsed" SET DEFAULT 0,
ALTER COLUMN "aiCreditsUsed" SET DATA TYPE DECIMAL(10,2);
