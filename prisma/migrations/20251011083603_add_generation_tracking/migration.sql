-- AlterTable
ALTER TABLE "public"."projects" ADD COLUMN     "aiGenerationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "generationStatus" TEXT NOT NULL DEFAULT 'template',
ADD COLUMN     "lastGeneratedAt" TIMESTAMP(3);
