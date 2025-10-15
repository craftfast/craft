/*
  Warnings:

  - You are about to rename the column `files` to `codeFiles` on the `project_versions` table.
  - You are about to rename the column `files` to `codeFiles` on the `projects` table.

*/
-- AlterTable - Rename column to preserve data
ALTER TABLE "project_versions" RENAME COLUMN "files" TO "codeFiles";

-- AlterTable - Rename column to preserve data
ALTER TABLE "projects" RENAME COLUMN "files" TO "codeFiles";

