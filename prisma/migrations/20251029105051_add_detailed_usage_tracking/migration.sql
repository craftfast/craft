-- AlterTable
ALTER TABLE "ai_token_usage" ADD COLUMN     "creditsUsed" DECIMAL(10,4) NOT NULL DEFAULT 0,
ADD COLUMN     "modelMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE "usage_records" ADD COLUMN     "aiCallTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "aiInputTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiModelMultipliers" JSONB,
ADD COLUMN     "aiModelsUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "aiOutputTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiTotalTokens" INTEGER NOT NULL DEFAULT 0;
