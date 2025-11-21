-- AlterTable
ALTER TABLE "users" ALTER COLUMN "enableMemory" SET DEFAULT false,
ALTER COLUMN "enabledCodingModels" SET DEFAULT ARRAY['anthropic/claude-haiku-4.5', 'anthropic/claude-sonnet-4.5', 'openai/gpt-5-mini', 'openai/gpt-5.1', 'google/gemini-2.5-flash', 'google/gemini-3-pro-preview', 'x-ai/grok-code-fast-1']::TEXT[];
