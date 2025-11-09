-- AlterTable
ALTER TABLE "users" ALTER COLUMN "enabledModels" SET DEFAULT ARRAY['minimax/minimax-m2', 'claude-sonnet-4.5', 'openai/gpt-5']::TEXT[];
