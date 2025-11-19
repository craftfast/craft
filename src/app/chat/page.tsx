import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import CraftInput from "@/components/CraftInput";
import PaymentSuccessHandler from "@/components/PaymentSuccessHandler";
import ModalRedirectHandler from "@/components/ModalRedirectHandler";

export default async function DashboardPage() {
  const session = await getSession();

  // If not logged in, redirect to home page
  if (!session) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Payment Success Handler - Updates balance when returning from checkout */}
      <PaymentSuccessHandler />

      {/* Modal Redirect Handler - Shows projects/feedback modals based on URL parameters */}
      <Suspense fallback={null}>
        <ModalRedirectHandler />
      </Suspense>

      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <DashboardHeader userId={session.user.id} showLogoText={true} />
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
