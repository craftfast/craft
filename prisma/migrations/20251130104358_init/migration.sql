-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING', 'UNPAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BalanceTransactionType" AS ENUM ('TOPUP', 'AI_USAGE', 'SANDBOX_USAGE', 'STORAGE_USAGE', 'DATABASE_USAGE', 'DEPLOYMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "preferredChatPosition" TEXT NOT NULL DEFAULT 'left',
    "preferredTheme" TEXT NOT NULL DEFAULT 'system',
    "responseTone" TEXT,
    "customInstructions" TEXT,
    "occupation" TEXT,
    "techStack" TEXT,
    "enableMemory" BOOLEAN NOT NULL DEFAULT false,
    "referenceChatHistory" BOOLEAN NOT NULL DEFAULT true,
    "enableWebSearch" BOOLEAN NOT NULL DEFAULT false,
    "enableImageGeneration" BOOLEAN NOT NULL DEFAULT false,
    "preferredCodingModel" TEXT DEFAULT 'anthropic/claude-sonnet-4.5',
    "enabledCodingModels" TEXT[] DEFAULT ARRAY['anthropic/claude-haiku-4.5', 'anthropic/claude-sonnet-4.5', 'openai/gpt-5-mini', 'openai/gpt-5.1', 'google/gemini-2.5-flash', 'google/gemini-3-pro-preview', 'x-ai/grok-code-fast-1']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginMethod" TEXT,
    "deletionScheduledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "razorpayCustomerId" TEXT,
    "accountBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "scope" TEXT,
    "accessToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idToken" TEXT,
    "password" TEXT,
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "token" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "impersonatedBy" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'document',
    "status" TEXT NOT NULL DEFAULT 'active',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "generationStatus" TEXT NOT NULL DEFAULT 'template',
    "lastCodeUpdateAt" TIMESTAMP(3),
    "codeFiles" JSONB NOT NULL DEFAULT '{}',
    "sandboxId" TEXT,
    "sandboxPausedAt" TIMESTAMP(3),
    "lastBackupAt" TIMESTAMP(3),
    "previewImage" TEXT,
    "previewImageCapturedAtVersion" INTEGER,
    "environmentVariables" JSONB NOT NULL DEFAULT '{}',
    "customViews" JSONB NOT NULL DEFAULT '[]',
    "gitSettings" JSONB NOT NULL DEFAULT '{}',
    "deploymentSettings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "chatMessageId" TEXT,
    "path" TEXT,
    "r2Key" TEXT NOT NULL,
    "r2Url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'upload',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileChanges" JSONB,
    "toolCalls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_versions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT,
    "codeFiles" JSONB NOT NULL,
    "chatMessageId" TEXT,
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_collaborators" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_git_connections" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "repository" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "username" TEXT,
    "repoUrl" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "project_git_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_deployments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "deploymentId" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_files" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "r2Url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_webhooks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_environment_variables" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "project_environment_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment_variable_audits" (
    "id" TEXT NOT NULL,
    "envVarId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environment_variable_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthlyUsd" DOUBLE PRECISION NOT NULL,
    "features" JSONB NOT NULL,
    "maxProjects" INTEGER,
    "monthlyCredits" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "razorpayPlanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySubscriptionId" TEXT,
    "razorpayCustomerId" TEXT,
    "monthlyCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "periodCreditsReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gracePeriodEndsAt" TIMESTAMP(3),
    "paymentFailedAt" TIMESTAMP(3),
    "pendingPlanId" TEXT,
    "planChangeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_credit_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "providerCostUsd" DOUBLE PRECISION NOT NULL,
    "endpoint" TEXT,
    "callType" TEXT NOT NULL DEFAULT 'agent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_credit_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "aiCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sandboxCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "databaseCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "storageCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deployCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "aiCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sandboxCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "databaseCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deployCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "subscriptionFeeUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiUsageCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'razorpay',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "taxAmount" DOUBLE PRECISION,
    "taxRate" DOUBLE PRECISION,
    "taxCountryCode" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BalanceTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balanceBefore" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vercel_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "vercelUserId" TEXT,
    "vercelTeamId" TEXT,
    "email" TEXT,
    "username" TEXT,
    "scopes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vercel_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "installationId" INTEGER,
    "githubUserId" INTEGER NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "scopes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_repositories" (
    "id" TEXT NOT NULL,
    "githubIntegrationId" TEXT NOT NULL,
    "projectId" TEXT,
    "githubRepoId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "htmlUrl" TEXT NOT NULL,
    "cloneUrl" TEXT NOT NULL,
    "sshUrl" TEXT,
    "description" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vercelIntegrationId" TEXT,
    "githubRepositoryId" TEXT,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "vercelDeploymentId" TEXT,
    "vercelProjectId" TEXT,
    "vercelUrl" TEXT,
    "vercelAliases" TEXT[],
    "githubCommitSha" TEXT,
    "githubBranch" TEXT,
    "buildLog" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "message" TEXT NOT NULL,
    "sentiment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "email" TEXT,
    "provider" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,

    CONSTRAINT "two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sandbox_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sandboxId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "providerCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
    "providerCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
    "providerCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buildDurationMin" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "razorpay_webhook_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "projectId" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "sessionData" JSONB NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "projectId" TEXT,
    "phase" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedTo" TEXT NOT NULL DEFAULT 'coding-agent',
    "tier" TEXT NOT NULL DEFAULT 'fast',
    "dependsOn" TEXT[],
    "result" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_razorpayCustomerId_key" ON "users"("razorpayCustomerId");

-- CreateIndex
CREATE INDEX "users_razorpayCustomerId_idx" ON "users"("razorpayCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_userId_providerId_key" ON "accounts"("userId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_value_key" ON "verifications"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "password_history_userId_idx" ON "password_history"("userId");

-- CreateIndex
CREATE INDEX "password_history_createdAt_idx" ON "password_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "pending_account_links_token_key" ON "pending_account_links"("token");

-- CreateIndex
CREATE INDEX "pending_account_links_userId_idx" ON "pending_account_links"("userId");

-- CreateIndex
CREATE INDEX "pending_account_links_email_idx" ON "pending_account_links"("email");

-- CreateIndex
CREATE INDEX "pending_account_links_token_idx" ON "pending_account_links"("token");

-- CreateIndex
CREATE INDEX "projects_sandboxId_idx" ON "projects"("sandboxId");

-- CreateIndex
CREATE UNIQUE INDEX "files_r2Key_key" ON "files"("r2Key");

-- CreateIndex
CREATE INDEX "files_userId_idx" ON "files"("userId");

-- CreateIndex
CREATE INDEX "files_projectId_idx" ON "files"("projectId");

-- CreateIndex
CREATE INDEX "files_chatMessageId_idx" ON "files"("chatMessageId");

-- CreateIndex
CREATE INDEX "files_r2Key_idx" ON "files"("r2Key");

-- CreateIndex
CREATE INDEX "files_purpose_idx" ON "files"("purpose");

-- CreateIndex
CREATE INDEX "files_projectId_path_idx" ON "files"("projectId", "path");

-- CreateIndex
CREATE INDEX "files_chatMessageId_createdAt_idx" ON "files"("chatMessageId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_projectId_idx" ON "chat_messages"("projectId");

-- CreateIndex
CREATE INDEX "chat_messages_projectId_createdAt_idx" ON "chat_messages"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_versions_projectId_createdAt_idx" ON "project_versions"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_versions_projectId_isBookmarked_idx" ON "project_versions"("projectId", "isBookmarked");

-- CreateIndex
CREATE INDEX "project_versions_projectId_isPublished_idx" ON "project_versions"("projectId", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "project_versions_projectId_version_key" ON "project_versions"("projectId", "version");

-- CreateIndex
CREATE INDEX "project_collaborators_projectId_idx" ON "project_collaborators"("projectId");

-- CreateIndex
CREATE INDEX "project_collaborators_userId_idx" ON "project_collaborators"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_collaborators_projectId_userId_key" ON "project_collaborators"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_git_connections_projectId_key" ON "project_git_connections"("projectId");

-- CreateIndex
CREATE INDEX "project_git_connections_projectId_idx" ON "project_git_connections"("projectId");

-- CreateIndex
CREATE INDEX "project_git_connections_provider_idx" ON "project_git_connections"("provider");

-- CreateIndex
CREATE INDEX "project_deployments_projectId_idx" ON "project_deployments"("projectId");

-- CreateIndex
CREATE INDEX "project_deployments_provider_idx" ON "project_deployments"("provider");

-- CreateIndex
CREATE INDEX "project_deployments_status_idx" ON "project_deployments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_files_r2Key_key" ON "knowledge_files"("r2Key");

-- CreateIndex
CREATE INDEX "knowledge_files_projectId_idx" ON "knowledge_files"("projectId");

-- CreateIndex
CREATE INDEX "knowledge_files_r2Key_idx" ON "knowledge_files"("r2Key");

-- CreateIndex
CREATE INDEX "project_webhooks_projectId_idx" ON "project_webhooks"("projectId");

-- CreateIndex
CREATE INDEX "project_webhooks_isActive_idx" ON "project_webhooks"("isActive");

-- CreateIndex
CREATE INDEX "project_environment_variables_projectId_idx" ON "project_environment_variables"("projectId");

-- CreateIndex
CREATE INDEX "project_environment_variables_key_idx" ON "project_environment_variables"("key");

-- CreateIndex
CREATE INDEX "project_environment_variables_createdBy_idx" ON "project_environment_variables"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "project_environment_variables_projectId_key_key" ON "project_environment_variables"("projectId", "key");

-- CreateIndex
CREATE INDEX "environment_variable_audits_envVarId_idx" ON "environment_variable_audits"("envVarId");

-- CreateIndex
CREATE INDEX "environment_variable_audits_performedBy_idx" ON "environment_variable_audits"("performedBy");

-- CreateIndex
CREATE INDEX "environment_variable_audits_action_idx" ON "environment_variable_audits"("action");

-- CreateIndex
CREATE INDEX "environment_variable_audits_createdAt_idx" ON "environment_variable_audits"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_idx" ON "webhook_deliveries"("webhookId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_eventType_idx" ON "webhook_deliveries"("eventType");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "webhook_deliveries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plans_razorpayPlanId_key" ON "plans"("razorpayPlanId");

-- CreateIndex
CREATE INDEX "plans_name_idx" ON "plans"("name");

-- CreateIndex
CREATE INDEX "plans_isActive_idx" ON "plans"("isActive");

-- CreateIndex
CREATE INDEX "plans_razorpayPlanId_idx" ON "plans"("razorpayPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_userId_key" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_razorpaySubscriptionId_key" ON "user_subscriptions"("razorpaySubscriptionId");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_idx" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_subscriptions_planId_idx" ON "user_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");

-- CreateIndex
CREATE INDEX "user_subscriptions_currentPeriodEnd_idx" ON "user_subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "user_subscriptions_gracePeriodEndsAt_idx" ON "user_subscriptions"("gracePeriodEndsAt");

-- CreateIndex
CREATE INDEX "user_subscriptions_razorpaySubscriptionId_idx" ON "user_subscriptions"("razorpaySubscriptionId");

-- CreateIndex
CREATE INDEX "user_subscriptions_razorpayCustomerId_idx" ON "user_subscriptions"("razorpayCustomerId");

-- CreateIndex
CREATE INDEX "ai_credit_usage_userId_createdAt_idx" ON "ai_credit_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_usage_projectId_createdAt_idx" ON "ai_credit_usage"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_usage_model_createdAt_idx" ON "ai_credit_usage"("model", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_usage_callType_createdAt_idx" ON "ai_credit_usage"("callType", "createdAt");

-- CreateIndex
CREATE INDEX "ai_credit_usage_createdAt_idx" ON "ai_credit_usage"("createdAt");

-- CreateIndex
CREATE INDEX "usage_records_userId_billingPeriodStart_idx" ON "usage_records"("userId", "billingPeriodStart");

-- CreateIndex
CREATE INDEX "usage_records_billingPeriodEnd_idx" ON "usage_records"("billingPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_subscriptionId_billingPeriodStart_key" ON "usage_records"("subscriptionId", "billingPeriodStart");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_billingPeriodStart_idx" ON "invoices"("billingPeriodStart");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "payment_transactions_userId_idx" ON "payment_transactions"("userId");

-- CreateIndex
CREATE INDEX "payment_transactions_invoiceId_idx" ON "payment_transactions"("invoiceId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_razorpayOrderId_idx" ON "payment_transactions"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "payment_transactions_razorpayPaymentId_idx" ON "payment_transactions"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "payment_transactions_createdAt_idx" ON "payment_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "balance_transactions_userId_createdAt_idx" ON "balance_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "balance_transactions_type_createdAt_idx" ON "balance_transactions"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "webhook_events_createdAt_idx" ON "webhook_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vercel_integrations_userId_key" ON "vercel_integrations"("userId");

-- CreateIndex
CREATE INDEX "vercel_integrations_userId_idx" ON "vercel_integrations"("userId");

-- CreateIndex
CREATE INDEX "vercel_integrations_isActive_idx" ON "vercel_integrations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "github_integrations_userId_key" ON "github_integrations"("userId");

-- CreateIndex
CREATE INDEX "github_integrations_userId_idx" ON "github_integrations"("userId");

-- CreateIndex
CREATE INDEX "github_integrations_githubUserId_idx" ON "github_integrations"("githubUserId");

-- CreateIndex
CREATE INDEX "github_integrations_installationId_idx" ON "github_integrations"("installationId");

-- CreateIndex
CREATE INDEX "github_integrations_isActive_idx" ON "github_integrations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "github_repositories_githubRepoId_key" ON "github_repositories"("githubRepoId");

-- CreateIndex
CREATE INDEX "github_repositories_githubIntegrationId_idx" ON "github_repositories"("githubIntegrationId");

-- CreateIndex
CREATE INDEX "github_repositories_projectId_idx" ON "github_repositories"("projectId");

-- CreateIndex
CREATE INDEX "github_repositories_githubRepoId_idx" ON "github_repositories"("githubRepoId");

-- CreateIndex
CREATE INDEX "deployments_projectId_idx" ON "deployments"("projectId");

-- CreateIndex
CREATE INDEX "deployments_userId_idx" ON "deployments"("userId");

-- CreateIndex
CREATE INDEX "deployments_vercelIntegrationId_idx" ON "deployments"("vercelIntegrationId");

-- CreateIndex
CREATE INDEX "deployments_githubRepositoryId_idx" ON "deployments"("githubRepositoryId");

-- CreateIndex
CREATE INDEX "deployments_platform_idx" ON "deployments"("platform");

-- CreateIndex
CREATE INDEX "deployments_status_idx" ON "deployments"("status");

-- CreateIndex
CREATE INDEX "deployments_createdAt_idx" ON "deployments"("createdAt");

-- CreateIndex
CREATE INDEX "feedback_userId_idx" ON "feedback"("userId");

-- CreateIndex
CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");

-- CreateIndex
CREATE INDEX "security_events_userId_createdAt_idx" ON "security_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_eventType_createdAt_idx" ON "security_events"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_severity_createdAt_idx" ON "security_events"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_ipAddress_createdAt_idx" ON "security_events"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_email_createdAt_idx" ON "security_events"("email", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_success_createdAt_idx" ON "security_events"("success", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_createdAt_idx" ON "security_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_userId_key" ON "two_factor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

-- CreateIndex
CREATE INDEX "rate_limit_key_idx" ON "rate_limit"("key");

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

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_webhook_events_eventId_key" ON "razorpay_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "razorpay_webhook_events_eventType_idx" ON "razorpay_webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "razorpay_webhook_events_status_idx" ON "razorpay_webhook_events"("status");

-- CreateIndex
CREATE INDEX "razorpay_webhook_events_createdAt_idx" ON "razorpay_webhook_events"("createdAt");

-- CreateIndex
CREATE INDEX "user_memories_userId_category_idx" ON "user_memories"("userId", "category");

-- CreateIndex
CREATE INDEX "user_memories_userId_isActive_idx" ON "user_memories"("userId", "isActive");

-- CreateIndex
CREATE INDEX "user_memories_userId_importance_idx" ON "user_memories"("userId", "importance");

-- CreateIndex
CREATE INDEX "user_memories_userId_lastUsedAt_idx" ON "user_memories"("userId", "lastUsedAt");

-- CreateIndex
CREATE INDEX "user_memories_projectId_idx" ON "user_memories"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "memory_categories_name_key" ON "memory_categories"("name");

-- CreateIndex
CREATE INDEX "memory_categories_name_idx" ON "memory_categories"("name");

-- CreateIndex
CREATE INDEX "memory_categories_sortOrder_idx" ON "memory_categories"("sortOrder");

-- CreateIndex
CREATE INDEX "agent_sessions_userId_idx" ON "agent_sessions"("userId");

-- CreateIndex
CREATE INDEX "agent_sessions_projectId_idx" ON "agent_sessions"("projectId");

-- CreateIndex
CREATE INDEX "agent_sessions_status_idx" ON "agent_sessions"("status");

-- CreateIndex
CREATE INDEX "agent_sessions_expiresAt_idx" ON "agent_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "agent_sessions_userId_status_idx" ON "agent_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "tasks_sessionId_idx" ON "tasks"("sessionId");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_sessionId_status_idx" ON "tasks"("sessionId", "status");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_account_links" ADD CONSTRAINT "pending_account_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_versions" ADD CONSTRAINT "project_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_git_connections" ADD CONSTRAINT "project_git_connections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_files" ADD CONSTRAINT "knowledge_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_files" ADD CONSTRAINT "knowledge_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_webhooks" ADD CONSTRAINT "project_webhooks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_environment_variables" ADD CONSTRAINT "project_environment_variables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_environment_variables" ADD CONSTRAINT "project_environment_variables_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_environment_variables" ADD CONSTRAINT "project_environment_variables_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_variable_audits" ADD CONSTRAINT "environment_variable_audits_envVarId_fkey" FOREIGN KEY ("envVarId") REFERENCES "project_environment_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_variable_audits" ADD CONSTRAINT "environment_variable_audits_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "project_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_githubIntegrationId_fkey" FOREIGN KEY ("githubIntegrationId") REFERENCES "github_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_githubRepositoryId_fkey" FOREIGN KEY ("githubRepositoryId") REFERENCES "github_repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_vercelIntegrationId_fkey" FOREIGN KEY ("vercelIntegrationId") REFERENCES "vercel_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memories" ADD CONSTRAINT "user_memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
