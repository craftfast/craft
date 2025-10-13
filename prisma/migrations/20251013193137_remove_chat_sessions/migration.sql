/*
  Warnings:

  - You are about to drop the column `chatSessionId` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the `chat_sessions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectId` to the `chat_messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."chat_messages" DROP CONSTRAINT "chat_messages_chatSessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chat_sessions" DROP CONSTRAINT "chat_sessions_projectId_fkey";

-- DropIndex
DROP INDEX "public"."chat_messages_chatSessionId_idx";

-- DropIndex
DROP INDEX "public"."chat_messages_role_createdAt_idx";

-- AlterTable
ALTER TABLE "chat_messages" DROP COLUMN "chatSessionId",
ADD COLUMN     "projectId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."chat_sessions";

-- CreateIndex
CREATE INDEX "chat_messages_projectId_idx" ON "chat_messages"("projectId");

-- CreateIndex
CREATE INDEX "chat_messages_projectId_createdAt_idx" ON "chat_messages"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
