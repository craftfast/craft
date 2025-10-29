/*
  Warnings:

  - A unique constraint covering the columns `[emailChangeToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailChangeToken" TEXT,
ADD COLUMN     "emailChangeTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "pendingEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_emailChangeToken_key" ON "users"("emailChangeToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");
