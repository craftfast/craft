/*
  Warnings:

  - You are about to drop the column `enabledModels` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `preferredModel` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "enabledModels",
DROP COLUMN "preferredModel";
