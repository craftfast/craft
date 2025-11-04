/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredById" TEXT;

-- CreateTable
CREATE TABLE "referral_credits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "creditsAwarded" INTEGER NOT NULL DEFAULT 1,
    "awardedForMonth" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_credits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referral_credits_userId_awardedForMonth_idx" ON "referral_credits"("userId", "awardedForMonth");

-- CreateIndex
CREATE INDEX "referral_credits_referredUserId_idx" ON "referral_credits"("referredUserId");

-- CreateIndex
CREATE INDEX "referral_credits_status_idx" ON "referral_credits"("status");

-- CreateIndex
CREATE INDEX "referral_credits_createdAt_idx" ON "referral_credits"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "referral_credits_userId_referredUserId_awardedForMonth_key" ON "referral_credits"("userId", "referredUserId", "awardedForMonth");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_credits" ADD CONSTRAINT "referral_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
