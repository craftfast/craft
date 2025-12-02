-- AlterTable
ALTER TABLE "users" ADD COLUMN     "autoInvoiceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoInvoiceThreshold" DECIMAL(10,2),
ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "taxId" TEXT;
