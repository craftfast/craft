/*
  Warnings:

  - You are about to drop the column `databaseSizeGb` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `storageSizeGb` on the `plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "databaseSizeGb",
DROP COLUMN "storageSizeGb";
