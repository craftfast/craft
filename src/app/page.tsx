import { getSession } from "@/lib/get-session";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import HomeHeader from "@/components/HomeHeader";
import DashboardHeader from "@/components/DashboardHeader";
import CraftInput from "@/components/CraftInput";
import PaymentSuccessHandler from "@/components/PaymentSuccessHandler";
import ModalRedirectHandler from "@/components/ModalRedirectHandler";
export default async function Home() {
  const session = await getSession();

  // Authenticated users see chat content
  if (session) {
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

  // Unauthenticated users see home page content
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-background" />

      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo variant="extended" className="!h-5" href="/" />
            <HomeHeader />
          </div>
        </div>
      </header>

      {/* Main Content with padding to account for fixed header */}
      <main className="relative flex items-center justify-center flex-1 min-h-0 py-8 sm:py-12 md:py-16 pt-20 sm:pt-24">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Centered Greeting */}
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground mb-2">
              What can I help you craft?
            </h1>
          </div>

          {/* ChatGPT-style Input */}
          <CraftInput />
        </div>
      </main>

      {/* Terms and Privacy Notice - Fixed at bottom */}
      <footer className="relative z-10 w-full py-4 flex-shrink-0">
        <div className="w-full text-center px-4">
          <p className="text-xs text-muted-foreground">
            By messaging Craft, you agree to our{" "}
            <a
              href="/terms"
              className="text-foreground hover:text-foreground/80 underline underline-offset-2 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Terms of Service
            </a>{" "}
            and acknowledge that you have read our{" "}
            <a
              href="/privacy"
              className="text-foreground hover:text-foreground/80 underline underline-offset-2 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
