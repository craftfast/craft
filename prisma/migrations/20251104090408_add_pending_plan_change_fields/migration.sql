-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "pendingPlanId" TEXT,
ADD COLUMN     "planChangeAt" TIMESTAMP(3);
