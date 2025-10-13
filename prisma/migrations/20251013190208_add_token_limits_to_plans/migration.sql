-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "canPurchaseTokens" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthlyTokenLimit" INTEGER;
