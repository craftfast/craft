-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "preferredModel" SET DEFAULT 'claude-haiku-4-5';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "preferredModel" SET DEFAULT 'claude-haiku-4-5',
ALTER COLUMN "enabledModels" SET DEFAULT ARRAY['claude-haiku-4-5', 'claude-sonnet-4.5']::TEXT[];
