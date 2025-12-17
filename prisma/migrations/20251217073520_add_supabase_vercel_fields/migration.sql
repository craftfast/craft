-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "supabaseApiUrl" TEXT,
ADD COLUMN     "supabaseDbPassword" TEXT,
ADD COLUMN     "supabaseProjectId" TEXT,
ADD COLUMN     "supabaseProjectRef" TEXT,
ADD COLUMN     "supabaseProvisionedAt" TIMESTAMP(3),
ADD COLUMN     "supabaseStatus" TEXT,
ADD COLUMN     "vercelProjectId" TEXT,
ADD COLUMN     "vercelProjectName" TEXT,
ADD COLUMN     "vercelUrl" TEXT;

-- CreateIndex
CREATE INDEX "projects_supabaseProjectRef_idx" ON "projects"("supabaseProjectRef");

-- CreateIndex
CREATE INDEX "projects_vercelProjectId_idx" ON "projects"("vercelProjectId");
