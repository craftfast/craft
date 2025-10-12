-- CreateTable
CREATE TABLE "public"."project_versions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT,
    "files" JSONB NOT NULL,
    "chatMessageId" TEXT,
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_versions_projectId_createdAt_idx" ON "public"."project_versions"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_versions_projectId_isBookmarked_idx" ON "public"."project_versions"("projectId", "isBookmarked");

-- CreateIndex
CREATE UNIQUE INDEX "project_versions_projectId_version_key" ON "public"."project_versions"("projectId", "version");

-- AddForeignKey
ALTER TABLE "public"."project_versions" ADD CONSTRAINT "project_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
