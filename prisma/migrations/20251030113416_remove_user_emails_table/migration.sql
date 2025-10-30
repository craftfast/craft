/*
  Warnings:

  - You are about to drop the `user_emails` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."user_emails" DROP CONSTRAINT "user_emails_userId_fkey";

-- DropTable
DROP TABLE "public"."user_emails";
