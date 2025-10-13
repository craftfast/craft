-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthlyUsd" DOUBLE PRECISION NOT NULL,
    "priceMonthlyInr" DOUBLE PRECISION NOT NULL,
    "features" JSONB NOT NULL,
    "maxProjects" INTEGER,
    "databaseSizeGb" DOUBLE PRECISION NOT NULL,
    "storageSizeGb" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_subscriptions" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "polarCheckoutId" TEXT,
    "polarPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_token_usage" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "endpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_token_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "aiTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "aiCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "databaseSizeGb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "databaseCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageSizeGb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bandwidthGb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bandwidthCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "authMau" INTEGER NOT NULL DEFAULT 0,
    "authCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "edgeFunctionInvocations" INTEGER NOT NULL DEFAULT 0,
    "edgeFunctionCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "subscriptionFeeUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiUsageCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "databaseCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bandwidthCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "authCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "edgeFunctionCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "polarCheckoutId" TEXT,
    "polarPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'polar',
    "polarCheckoutId" TEXT,
    "polarPaymentId" TEXT,
    "polarSignature" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE INDEX "plans_name_idx" ON "plans"("name");

-- CreateIndex
CREATE INDEX "plans_isActive_idx" ON "plans"("isActive");

-- CreateIndex
CREATE INDEX "team_subscriptions_teamId_idx" ON "team_subscriptions"("teamId");

-- CreateIndex
CREATE INDEX "team_subscriptions_planId_idx" ON "team_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "team_subscriptions_status_idx" ON "team_subscriptions"("status");

-- CreateIndex
CREATE INDEX "team_subscriptions_currentPeriodEnd_idx" ON "team_subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "team_subscriptions_teamId_key" ON "team_subscriptions"("teamId");

-- CreateIndex
CREATE INDEX "ai_token_usage_teamId_createdAt_idx" ON "ai_token_usage"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_token_usage_userId_createdAt_idx" ON "ai_token_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_token_usage_projectId_createdAt_idx" ON "ai_token_usage"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_token_usage_model_createdAt_idx" ON "ai_token_usage"("model", "createdAt");

-- CreateIndex
CREATE INDEX "ai_token_usage_createdAt_idx" ON "ai_token_usage"("createdAt");

-- CreateIndex
CREATE INDEX "usage_records_teamId_billingPeriodStart_idx" ON "usage_records"("teamId", "billingPeriodStart");

-- CreateIndex
CREATE INDEX "usage_records_billingPeriodEnd_idx" ON "usage_records"("billingPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_subscriptionId_billingPeriodStart_key" ON "usage_records"("subscriptionId", "billingPeriodStart");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_teamId_idx" ON "invoices"("teamId");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_billingPeriodStart_idx" ON "invoices"("billingPeriodStart");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "payment_transactions_teamId_idx" ON "payment_transactions"("teamId");

-- CreateIndex
CREATE INDEX "payment_transactions_invoiceId_idx" ON "payment_transactions"("invoiceId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_polarCheckoutId_idx" ON "payment_transactions"("polarCheckoutId");

-- CreateIndex
CREATE INDEX "payment_transactions_polarPaymentId_idx" ON "payment_transactions"("polarPaymentId");

-- CreateIndex
CREATE INDEX "payment_transactions_createdAt_idx" ON "payment_transactions"("createdAt");

-- AddForeignKey
ALTER TABLE "team_subscriptions" ADD CONSTRAINT "team_subscriptions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_subscriptions" ADD CONSTRAINT "team_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "team_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "team_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
