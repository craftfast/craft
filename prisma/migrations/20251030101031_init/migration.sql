-- CreateTable
CREATE TABLE "pending_account_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_account_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_account_links_token_key" ON "pending_account_links"("token");

-- CreateIndex
CREATE INDEX "pending_account_links_userId_idx" ON "pending_account_links"("userId");

-- CreateIndex
CREATE INDEX "pending_account_links_email_idx" ON "pending_account_links"("email");

-- CreateIndex
CREATE INDEX "pending_account_links_token_idx" ON "pending_account_links"("token");
