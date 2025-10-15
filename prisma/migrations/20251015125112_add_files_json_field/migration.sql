-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "files" JSONB NOT NULL DEFAULT '{}';
