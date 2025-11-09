-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "preferredModel" SET DEFAULT 'minimax/minimax-m2';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "preferredModel" SET DEFAULT 'minimax/minimax-m2',
ALTER COLUMN "enabledModels" SET DEFAULT ARRAY['minimax/minimax-m2', 'claude-haiku-4-5']::TEXT[];
