/*
  Warnings:

  - You are about to drop the column `autoInvoiceEnabled` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `autoInvoiceThreshold` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "autoInvoiceEnabled",
DROP COLUMN "autoInvoiceThreshold",
ADD COLUMN     "sendInvoiceEmail" BOOLEAN NOT NULL DEFAULT false;
