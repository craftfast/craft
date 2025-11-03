/*
  Warnings:

  - Made the column `monthlyCredits` on table `plans` required. This step will fail if there are existing NULL values in that column.

*/

-- Step 1: Migrate data - convert dailyCredits to monthlyCredits (daily * 30)
UPDATE "plans" 
SET "monthlyCredits" = COALESCE("dailyCredits" * 30, 100)
WHERE "monthlyCredits" IS NULL;

-- Step 2: Set default for any remaining NULLs
UPDATE "plans"
SET "monthlyCredits" = 100
WHERE "monthlyCredits" IS NULL;

-- Step 3: Now make the column NOT NULL
ALTER TABLE "plans" ALTER COLUMN "monthlyCredits" SET NOT NULL,
ALTER COLUMN "monthlyCredits" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "usage_records" ADD COLUMN     "databaseCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "databaseCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deployCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "deployCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sandboxCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sandboxCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "storageCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "storageCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "monthlyCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "periodCreditsReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "sandbox_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sandboxId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "creditsUsed" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sandbox_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "storageType" TEXT NOT NULL,
    "sizeGB" DECIMAL(10,6) NOT NULL,
    "operations" INTEGER NOT NULL DEFAULT 0,
    "creditsUsed" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billingPeriod" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "deploymentId" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'vercel',
    "creditsUsed" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buildDurationMin" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sandbox_usage_userId_createdAt_idx" ON "sandbox_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "sandbox_usage_projectId_createdAt_idx" ON "sandbox_usage"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "sandbox_usage_sandboxId_idx" ON "sandbox_usage"("sandboxId");

-- CreateIndex
CREATE INDEX "storage_usage_userId_billingPeriod_idx" ON "storage_usage"("userId", "billingPeriod");

-- CreateIndex
CREATE INDEX "storage_usage_projectId_billingPeriod_idx" ON "storage_usage"("projectId", "billingPeriod");

-- CreateIndex
CREATE INDEX "storage_usage_storageType_billingPeriod_idx" ON "storage_usage"("storageType", "billingPeriod");

-- CreateIndex
CREATE INDEX "deployment_usage_userId_createdAt_idx" ON "deployment_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "deployment_usage_projectId_createdAt_idx" ON "deployment_usage"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "deployment_usage_platform_idx" ON "deployment_usage"("platform");
