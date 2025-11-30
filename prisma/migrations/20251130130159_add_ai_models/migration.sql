-- CreateEnum
CREATE TYPE "AIModelProvider" AS ENUM ('ANTHROPIC', 'OPENAI', 'GOOGLE', 'XAI', 'OPENROUTER');

-- CreateEnum
CREATE TYPE "AIModelTier" AS ENUM ('FAST', 'EXPERT');

-- CreateEnum
CREATE TYPE "AIModelUseCase" AS ENUM ('ORCHESTRATOR', 'MEMORY', 'CODING', 'IMAGE_GENERATION', 'VIDEO_GENERATION');

-- CreateEnum
CREATE TYPE "AIModelInputType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'PDF', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "AIModelOutputType" AS ENUM ('TEXT', 'CODE', 'IMAGE', 'AUDIO', 'VIDEO', 'STRUCTURED_DATA');

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "provider" "AIModelProvider" NOT NULL,
    "tier" "AIModelTier" NOT NULL,
    "description" TEXT NOT NULL,
    "useCase" "AIModelUseCase" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_capabilities" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "supportedInputs" "AIModelInputType"[],
    "supportedOutputs" "AIModelOutputType"[],
    "maxContextLength" INTEGER,
    "supportsStreaming" BOOLEAN NOT NULL DEFAULT true,
    "supportsSystemPrompts" BOOLEAN NOT NULL DEFAULT true,
    "supportsWebSearch" BOOLEAN NOT NULL DEFAULT false,
    "supportsFunctionCalling" BOOLEAN NOT NULL DEFAULT true,
    "supportsJsonMode" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_pricing" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputTokens" DOUBLE PRECISION NOT NULL,
    "outputTokens" DOUBLE PRECISION NOT NULL,
    "longContextThreshold" INTEGER,
    "inputTokensLongContext" DOUBLE PRECISION,
    "outputTokensLongContext" DOUBLE PRECISION,
    "cacheCreation" DOUBLE PRECISION,
    "cacheRead" DOUBLE PRECISION,
    "cacheCreationLongContext" DOUBLE PRECISION,
    "cacheReadLongContext" DOUBLE PRECISION,
    "cacheDuration" TEXT,
    "imageInputTokens" DOUBLE PRECISION,
    "audioInputTokens" DOUBLE PRECISION,
    "videoInputTokens" DOUBLE PRECISION,
    "audioOutputTokens" DOUBLE PRECISION,
    "images" DOUBLE PRECISION,
    "videoSeconds" DOUBLE PRECISION,
    "webSearchFreePerDay" INTEGER,
    "webSearch" DOUBLE PRECISION,
    "mapsGroundingFreePerDay" INTEGER,
    "mapsGrounding" DOUBLE PRECISION,
    "pricingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_defaults" (
    "id" TEXT NOT NULL,
    "useCase" "AIModelUseCase" NOT NULL,
    "modelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ai_model_defaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_audit_logs" (
    "id" TEXT NOT NULL,
    "modelId" TEXT,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_model_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_models_provider_idx" ON "ai_models"("provider");

-- CreateIndex
CREATE INDEX "ai_models_tier_idx" ON "ai_models"("tier");

-- CreateIndex
CREATE INDEX "ai_models_useCase_idx" ON "ai_models"("useCase");

-- CreateIndex
CREATE INDEX "ai_models_isEnabled_idx" ON "ai_models"("isEnabled");

-- CreateIndex
CREATE INDEX "ai_models_isDefault_idx" ON "ai_models"("isDefault");

-- CreateIndex
CREATE INDEX "ai_models_useCase_isEnabled_idx" ON "ai_models"("useCase", "isEnabled");

-- CreateIndex
CREATE INDEX "ai_models_useCase_isDefault_idx" ON "ai_models"("useCase", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "ai_model_capabilities_modelId_key" ON "ai_model_capabilities"("modelId");

-- CreateIndex
CREATE INDEX "ai_model_capabilities_modelId_idx" ON "ai_model_capabilities"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_model_pricing_modelId_key" ON "ai_model_pricing"("modelId");

-- CreateIndex
CREATE INDEX "ai_model_pricing_modelId_idx" ON "ai_model_pricing"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_model_defaults_useCase_key" ON "ai_model_defaults"("useCase");

-- CreateIndex
CREATE INDEX "ai_model_defaults_useCase_idx" ON "ai_model_defaults"("useCase");

-- CreateIndex
CREATE INDEX "ai_model_audit_logs_modelId_idx" ON "ai_model_audit_logs"("modelId");

-- CreateIndex
CREATE INDEX "ai_model_audit_logs_action_idx" ON "ai_model_audit_logs"("action");

-- CreateIndex
CREATE INDEX "ai_model_audit_logs_performedBy_idx" ON "ai_model_audit_logs"("performedBy");

-- CreateIndex
CREATE INDEX "ai_model_audit_logs_createdAt_idx" ON "ai_model_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "ai_model_capabilities" ADD CONSTRAINT "ai_model_capabilities_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ai_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_model_pricing" ADD CONSTRAINT "ai_model_pricing_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ai_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
