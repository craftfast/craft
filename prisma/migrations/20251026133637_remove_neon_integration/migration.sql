/*
  Warnings:

  - You are about to drop the `neon_databases` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."neon_databases" DROP CONSTRAINT "neon_databases_projectId_fkey";

-- DropTable
DROP TABLE "public"."neon_databases";
