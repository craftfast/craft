/*
  Warnings:

  - You are about to drop the column `thumbnailUrl` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "thumbnailUrl",
ADD COLUMN     "previewImage" TEXT;
