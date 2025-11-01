/*
  Warnings:

  - The primary key for the `accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `accounts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."accounts_userId_providerId_key";

-- AlterTable
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("userId", "providerId");
