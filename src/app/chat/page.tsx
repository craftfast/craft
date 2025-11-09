import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import CraftInput from "@/components/CraftInput";
import PaymentSuccessHandler from "@/components/PaymentSuccessHandler";
import PlanRedirectHandler from "@/components/PlanRedirectHandler";
import SettingsRedirectHandler from "@/components/SettingsRedirectHandler";
import ModalRedirectHandler from "@/components/ModalRedirectHandler";
import { getUserSubscription } from "@/lib/subscription";

export default async function DashboardPage() {
  const session = await getSession();

  // If not logged in, redirect to home page
  if (!session) {
    redirect("/home");
  }

  // Get user's subscription details
  const subscription = await getUserSubscription(session.user.id);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Payment Success Handler - Updates credits when returning from checkout */}
      <PaymentSuccessHandler />

      {/* Plan Redirect Handler - Shows subscription modal when redirected from pricing with plan parameter */}
      <Suspense fallback={null}>
        <PlanRedirectHandler
          currentPlan={subscription?.plan?.name || "HOBBY"}
        />
      </Suspense>

      {/* Settings Redirect Handler - Shows settings modal with billing tab when redirected from pricing for tier changes */}
      <Suspense fallback={null}>
        <SettingsRedirectHandler
          currentPlan={subscription?.plan?.name || "HOBBY"}
        />
      </Suspense>

      {/* Modal Redirect Handler - Shows projects/feedback modals based on URL parameters */}
      <Suspense fallback={null}>
        <ModalRedirectHandler />
      </Suspense>

      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <DashboardHeader
            planName={subscription?.plan?.name}
            userId={session.user.id}
            userSubscription={subscription}
            showLogoText={true}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 pb-8">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          {/* Centered Greeting */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-foreground">
            What can I help you craft?
          </h1>

          {/* Chat Input */}
          <CraftInput />
        </div>
      </main>
    </div>
  );
}
