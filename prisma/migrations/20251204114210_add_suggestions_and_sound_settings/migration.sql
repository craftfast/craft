-- AlterTable
ALTER TABLE "users" ADD COLUMN     "soundNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suggestionsEnabled" BOOLEAN NOT NULL DEFAULT true;
