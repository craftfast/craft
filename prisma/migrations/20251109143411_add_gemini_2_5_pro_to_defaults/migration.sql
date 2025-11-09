-- AlterTable
ALTER TABLE "users" ALTER COLUMN "enabledModels" SET DEFAULT ARRAY['minimax/minimax-m2', 'moonshotai/kimi-k2-thinking', 'claude-haiku-4-5', 'google/gemini-2.5-pro-001', 'openai/gpt-5', 'claude-sonnet-4.5']::TEXT[];
