-- CreateTable
CREATE TABLE "project_environment_variables" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "project_environment_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment_variable_audits" (
    "id" TEXT NOT NULL,
    "envVarId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environment_variable_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_environment_variables_projectId_idx" ON "project_environment_variables"("projectId");

-- CreateIndex
CREATE INDEX "project_environment_variables_key_idx" ON "project_environment_variables"("key");

-- CreateIndex
CREATE INDEX "project_environment_variables_createdBy_idx" ON "project_environment_variables"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "project_environment_variables_projectId_key_key" ON "project_environment_variables"("projectId", "key");

-- CreateIndex
CREATE INDEX "environment_variable_audits_envVarId_idx" ON "environment_variable_audits"("envVarId");

-- CreateIndex
CREATE INDEX "environment_variable_audits_performedBy_idx" ON "environment_variable_audits"("performedBy");

-- CreateIndex
CREATE INDEX "environment_variable_audits_action_idx" ON "environment_variable_audits"("action");

-- CreateIndex
CREATE INDEX "environment_variable_audits_createdAt_idx" ON "environment_variable_audits"("createdAt");

-- AddForeignKey
ALTER TABLE "project_environment_variables" ADD CONSTRAINT "project_environment_variables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_environment_variables" ADD CONSTRAINT "project_environment_variables_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_environment_variables" ADD CONSTRAINT "project_environment_variables_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_variable_audits" ADD CONSTRAINT "environment_variable_audits_envVarId_fkey" FOREIGN KEY ("envVarId") REFERENCES "project_environment_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_variable_audits" ADD CONSTRAINT "environment_variable_audits_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
