-- AlterTable
ALTER TABLE "users" ADD COLUMN     "enabledCodingModels" TEXT[] DEFAULT ARRAY['anthropic/claude-haiku-4.5', 'anthropic/claude-sonnet-4.5', 'openai/gpt-5-mini', 'openai/gpt-5', 'google/gemini-2.5-flash', 'google/gemini-3-pro-preview', 'minimax/minimax-m2']::TEXT[],
ADD COLUMN     "preferredCodingModel" TEXT DEFAULT 'anthropic/claude-sonnet-4.5';
