/*
  Warnings:

  - You are about to drop the column `emailChangeToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `emailChangeTokenExpiry` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `pendingEmail` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."users_emailChangeToken_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailChangeToken",
DROP COLUMN "emailChangeTokenExpiry",
DROP COLUMN "pendingEmail";
