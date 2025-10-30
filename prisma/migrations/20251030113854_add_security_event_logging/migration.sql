-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "email" TEXT,
    "provider" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_events_userId_createdAt_idx" ON "security_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_eventType_createdAt_idx" ON "security_events"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_severity_createdAt_idx" ON "security_events"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_ipAddress_createdAt_idx" ON "security_events"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_email_createdAt_idx" ON "security_events"("email", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_success_createdAt_idx" ON "security_events"("success", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_createdAt_idx" ON "security_events"("createdAt");
