-- CreateTable
CREATE TABLE "token_purchases" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenAmount" INTEGER NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "polarCheckoutId" TEXT,
    "polarPaymentId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "tokensRemaining" INTEGER NOT NULL,
    "transactionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "token_purchases_teamId_idx" ON "token_purchases"("teamId");

-- CreateIndex
CREATE INDEX "token_purchases_userId_idx" ON "token_purchases"("userId");

-- CreateIndex
CREATE INDEX "token_purchases_status_idx" ON "token_purchases"("status");

-- CreateIndex
CREATE INDEX "token_purchases_polarCheckoutId_idx" ON "token_purchases"("polarCheckoutId");

-- CreateIndex
CREATE INDEX "token_purchases_polarPaymentId_idx" ON "token_purchases"("polarPaymentId");

-- CreateIndex
CREATE INDEX "token_purchases_purchasedAt_idx" ON "token_purchases"("purchasedAt");
