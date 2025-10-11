/*
  Warnings:

  - You are about to drop the column `aiGenerationCount` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `lastGeneratedAt` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."projects" DROP COLUMN "aiGenerationCount",
DROP COLUMN "lastGeneratedAt",
ADD COLUMN     "lastCodeUpdateAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "chat_messages_role_createdAt_idx" ON "public"."chat_messages"("role", "createdAt");
