/*
  Warnings:

  - You are about to drop the column `authCostUsd` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `bandwidthCostUsd` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `databaseCostUsd` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `edgeFunctionCostUsd` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `storageCostUsd` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `authCostUsd` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `authMau` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `bandwidthCostUsd` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `bandwidthGb` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `databaseCostUsd` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `databaseSizeGb` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `edgeFunctionCostUsd` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `edgeFunctionInvocations` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `storageCostUsd` on the `usage_records` table. All the data in the column will be lost.
  - You are about to drop the column `storageSizeGb` on the `usage_records` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "authCostUsd",
DROP COLUMN "bandwidthCostUsd",
DROP COLUMN "databaseCostUsd",
DROP COLUMN "edgeFunctionCostUsd",
DROP COLUMN "storageCostUsd";

-- AlterTable
ALTER TABLE "usage_records" DROP COLUMN "authCostUsd",
DROP COLUMN "authMau",
DROP COLUMN "bandwidthCostUsd",
DROP COLUMN "bandwidthGb",
DROP COLUMN "databaseCostUsd",
DROP COLUMN "databaseSizeGb",
DROP COLUMN "edgeFunctionCostUsd",
DROP COLUMN "edgeFunctionInvocations",
DROP COLUMN "storageCostUsd",
DROP COLUMN "storageSizeGb";
