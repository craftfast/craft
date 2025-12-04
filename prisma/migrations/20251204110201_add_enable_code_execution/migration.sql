-- AlterTable
ALTER TABLE "users" ADD COLUMN     "enableCodeExecution" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "enableWebSearch" SET DEFAULT true,
ALTER COLUMN "enableImageGeneration" SET DEFAULT true;
