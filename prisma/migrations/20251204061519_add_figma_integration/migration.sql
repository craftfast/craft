-- CreateTable
CREATE TABLE "figma_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "figmaUserId" TEXT NOT NULL,
    "email" TEXT,
    "handle" TEXT,
    "imgUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "figma_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "figma_integrations_userId_key" ON "figma_integrations"("userId");

-- CreateIndex
CREATE INDEX "figma_integrations_userId_idx" ON "figma_integrations"("userId");

-- CreateIndex
CREATE INDEX "figma_integrations_figmaUserId_idx" ON "figma_integrations"("figmaUserId");

-- CreateIndex
CREATE INDEX "figma_integrations_isActive_idx" ON "figma_integrations"("isActive");
