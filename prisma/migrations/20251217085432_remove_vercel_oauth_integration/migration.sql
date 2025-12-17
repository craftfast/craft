/*
  Warnings:

  - You are about to drop the column `vercelIntegrationId` on the `deployments` table. All the data in the column will be lost.
  - You are about to drop the `vercel_integrations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "deployments" DROP CONSTRAINT "deployments_vercelIntegrationId_fkey";

-- DropIndex
DROP INDEX "deployments_vercelIntegrationId_idx";

-- AlterTable
ALTER TABLE "deployments" DROP COLUMN "vercelIntegrationId";

-- DropTable
DROP TABLE "vercel_integrations";
