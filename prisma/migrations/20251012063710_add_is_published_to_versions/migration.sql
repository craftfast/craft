-- AlterTable
ALTER TABLE "public"."project_versions" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "project_versions_projectId_isPublished_idx" ON "public"."project_versions"("projectId", "isPublished");
