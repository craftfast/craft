-- CreateTable
CREATE TABLE "vercel_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "vercelUserId" TEXT,
    "vercelTeamId" TEXT,
    "email" TEXT,
    "username" TEXT,
    "scopes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vercel_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "githubUserId" INTEGER NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "scopes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_repositories" (
    "id" TEXT NOT NULL,
    "githubIntegrationId" TEXT NOT NULL,
    "projectId" TEXT,
    "githubRepoId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "htmlUrl" TEXT NOT NULL,
    "cloneUrl" TEXT NOT NULL,
    "sshUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vercelIntegrationId" TEXT,
    "githubRepositoryId" TEXT,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "vercelDeploymentId" TEXT,
    "vercelProjectId" TEXT,
    "vercelUrl" TEXT,
    "vercelAliases" TEXT[],
    "githubCommitSha" TEXT,
    "githubBranch" TEXT,
    "buildLog" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vercel_integrations_userId_key" ON "vercel_integrations"("userId");

-- CreateIndex
CREATE INDEX "vercel_integrations_userId_idx" ON "vercel_integrations"("userId");

-- CreateIndex
CREATE INDEX "vercel_integrations_isActive_idx" ON "vercel_integrations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "github_integrations_userId_key" ON "github_integrations"("userId");

-- CreateIndex
CREATE INDEX "github_integrations_userId_idx" ON "github_integrations"("userId");

-- CreateIndex
CREATE INDEX "github_integrations_githubUserId_idx" ON "github_integrations"("githubUserId");

-- CreateIndex
CREATE INDEX "github_integrations_isActive_idx" ON "github_integrations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "github_repositories_githubRepoId_key" ON "github_repositories"("githubRepoId");

-- CreateIndex
CREATE INDEX "github_repositories_githubIntegrationId_idx" ON "github_repositories"("githubIntegrationId");

-- CreateIndex
CREATE INDEX "github_repositories_projectId_idx" ON "github_repositories"("projectId");

-- CreateIndex
CREATE INDEX "github_repositories_githubRepoId_idx" ON "github_repositories"("githubRepoId");

-- CreateIndex
CREATE INDEX "deployments_projectId_idx" ON "deployments"("projectId");

-- CreateIndex
CREATE INDEX "deployments_userId_idx" ON "deployments"("userId");

-- CreateIndex
CREATE INDEX "deployments_vercelIntegrationId_idx" ON "deployments"("vercelIntegrationId");

-- CreateIndex
CREATE INDEX "deployments_githubRepositoryId_idx" ON "deployments"("githubRepositoryId");

-- CreateIndex
CREATE INDEX "deployments_platform_idx" ON "deployments"("platform");

-- CreateIndex
CREATE INDEX "deployments_status_idx" ON "deployments"("status");

-- CreateIndex
CREATE INDEX "deployments_createdAt_idx" ON "deployments"("createdAt");

-- AddForeignKey
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_githubIntegrationId_fkey" FOREIGN KEY ("githubIntegrationId") REFERENCES "github_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_vercelIntegrationId_fkey" FOREIGN KEY ("vercelIntegrationId") REFERENCES "vercel_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_githubRepositoryId_fkey" FOREIGN KEY ("githubRepositoryId") REFERENCES "github_repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
