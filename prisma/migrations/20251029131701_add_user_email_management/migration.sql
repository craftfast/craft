-- CreateTable
CREATE TABLE "user_emails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationExpiry" TIMESTAMP(3),
    "provider" TEXT DEFAULT 'credentials',
    "providerAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_emails_email_key" ON "user_emails"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_emails_verificationToken_key" ON "user_emails"("verificationToken");

-- CreateIndex
CREATE INDEX "user_emails_userId_idx" ON "user_emails"("userId");

-- CreateIndex
CREATE INDEX "user_emails_email_idx" ON "user_emails"("email");

-- CreateIndex
CREATE INDEX "user_emails_isPrimary_idx" ON "user_emails"("isPrimary");

-- AddForeignKey
ALTER TABLE "user_emails" ADD CONSTRAINT "user_emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
