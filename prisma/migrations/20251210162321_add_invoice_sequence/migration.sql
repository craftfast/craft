-- CreateTable
CREATE TABLE "invoice_sequences" (
    "id" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoice_sequences_financialYear_key" ON "invoice_sequences"("financialYear");
