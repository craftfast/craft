-- CreateTable
CREATE TABLE "two_factor_pending_sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_pending_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_pending_sessions_token_key" ON "two_factor_pending_sessions"("token");

-- CreateIndex
CREATE INDEX "two_factor_pending_sessions_email_idx" ON "two_factor_pending_sessions"("email");

-- CreateIndex
CREATE INDEX "two_factor_pending_sessions_token_idx" ON "two_factor_pending_sessions"("token");

-- CreateIndex
CREATE INDEX "two_factor_pending_sessions_expiresAt_idx" ON "two_factor_pending_sessions"("expiresAt");
