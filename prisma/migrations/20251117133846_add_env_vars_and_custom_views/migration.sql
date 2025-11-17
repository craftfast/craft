-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "customViews" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "environmentVariables" JSONB NOT NULL DEFAULT '{}';
