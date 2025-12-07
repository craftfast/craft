/*
  Warnings:

  - You are about to drop the column `enabledCodingModels` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `preferredCodingModel` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "enabledCodingModels",
DROP COLUMN "preferredCodingModel",
ADD COLUMN     "modelPreferences" JSONB DEFAULT '{}';
