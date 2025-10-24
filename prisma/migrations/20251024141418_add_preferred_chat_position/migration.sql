-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferredChatPosition" TEXT NOT NULL DEFAULT 'left';

-- CreateIndex
CREATE INDEX "token_purchases_expiresAt_idx" ON "token_purchases"("expiresAt");
