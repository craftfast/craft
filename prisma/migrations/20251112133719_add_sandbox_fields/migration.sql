-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "sandboxId" TEXT,
ADD COLUMN     "sandboxPausedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "projects_sandboxId_idx" ON "projects"("sandboxId");
