/*
  Warnings:

  - You are about to drop the column `aiCallTypes` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `aiInputTokens` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `aiModelsUsed` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `aiOutputTokens` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `aiTotalTokens` on the `usage_records` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usage_records" DROP COLUMN "aiCallTypes",
DROP COLUMN "aiInputTokens",
DROP COLUMN "aiModelsUsed",
DROP COLUMN "aiOutputTokens",
DROP COLUMN "aiTotalTokens";
