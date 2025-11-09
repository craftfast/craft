-- AlterTable
ALTER TABLE "users" ALTER COLUMN "enabledModels" SET DEFAULT ARRAY['claude-haiku-4-5']::TEXT[];
