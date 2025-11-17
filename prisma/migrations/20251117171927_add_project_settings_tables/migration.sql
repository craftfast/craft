-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "deploymentSettings" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "gitSettings" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "project_collaborators" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_git_connections" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "repository" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "username" TEXT,
    "repoUrl" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "project_git_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_deployments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "deploymentId" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_files" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "r2Url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_collaborators_projectId_idx" ON "project_collaborators"("projectId");

-- CreateIndex
CREATE INDEX "project_collaborators_userId_idx" ON "project_collaborators"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_collaborators_projectId_userId_key" ON "project_collaborators"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_git_connections_projectId_key" ON "project_git_connections"("projectId");

-- CreateIndex
CREATE INDEX "project_git_connections_projectId_idx" ON "project_git_connections"("projectId");

-- CreateIndex
CREATE INDEX "project_git_connections_provider_idx" ON "project_git_connections"("provider");

-- CreateIndex
CREATE INDEX "project_deployments_projectId_idx" ON "project_deployments"("projectId");

-- CreateIndex
CREATE INDEX "project_deployments_provider_idx" ON "project_deployments"("provider");

-- CreateIndex
CREATE INDEX "project_deployments_status_idx" ON "project_deployments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_files_r2Key_key" ON "knowledge_files"("r2Key");

-- CreateIndex
CREATE INDEX "knowledge_files_projectId_idx" ON "knowledge_files"("projectId");

-- CreateIndex
CREATE INDEX "knowledge_files_r2Key_idx" ON "knowledge_files"("r2Key");

-- AddForeignKey
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_git_connections" ADD CONSTRAINT "project_git_connections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_files" ADD CONSTRAINT "knowledge_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_files" ADD CONSTRAINT "knowledge_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
