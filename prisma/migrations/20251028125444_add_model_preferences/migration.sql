-- AlterTable
ALTER TABLE "users" ADD COLUMN     "enabledModels" TEXT[] DEFAULT ARRAY['gpt-5-mini', 'claude-haiku-4-5', 'gpt-5', 'claude-sonnet-4.5']::TEXT[],
ADD COLUMN     "preferredModel" TEXT NOT NULL DEFAULT 'gpt-5';
