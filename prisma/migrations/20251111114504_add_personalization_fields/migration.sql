-- AlterTable
ALTER TABLE "users" ADD COLUMN     "customInstructions" TEXT,
ADD COLUMN     "enableImageGeneration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableMemory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableWebSearch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "referenceChatHistory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "responseTone" TEXT,
ADD COLUMN     "techStack" TEXT;

-- CreateTable
CREATE TABLE "user_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "projectId" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_memories_userId_category_idx" ON "user_memories"("userId", "category");

-- CreateIndex
CREATE INDEX "user_memories_userId_isActive_idx" ON "user_memories"("userId", "isActive");

-- CreateIndex
CREATE INDEX "user_memories_userId_importance_idx" ON "user_memories"("userId", "importance");

-- CreateIndex
CREATE INDEX "user_memories_userId_lastUsedAt_idx" ON "user_memories"("userId", "lastUsedAt");

-- CreateIndex
CREATE INDEX "user_memories_projectId_idx" ON "user_memories"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "memory_categories_name_key" ON "memory_categories"("name");

-- CreateIndex
CREATE INDEX "memory_categories_name_idx" ON "memory_categories"("name");

-- CreateIndex
CREATE INDEX "memory_categories_sortOrder_idx" ON "memory_categories"("sortOrder");

-- AddForeignKey
ALTER TABLE "user_memories" ADD CONSTRAINT "user_memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
