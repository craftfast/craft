/**
 * Billing Page Route
 *
 * Full-page billing interface for managing subscriptions
 */

import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Suspense } from "react";
import BillingPage from "@/components/BillingPage";
import PaymentStatusHandler from "@/components/PaymentStatusHandler";

export default async function BillingRoute() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  // Get user's subscription with full plan details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  const currentPlan = user?.subscription?.plan?.name || "HOBBY";
  const currentCredits = user?.subscription?.plan?.monthlyCredits || 0;

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <PaymentStatusHandler />
      </Suspense>
      <BillingPage currentPlan={currentPlan} currentCredits={currentCredits} />
    </div>
  );
}
