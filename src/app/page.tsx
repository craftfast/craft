import { Suspense } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import AppHeader from "@/components/AppHeader";
import CraftInput from "@/components/CraftInput";
import PaymentSuccessHandler from "@/components/PaymentSuccessHandler";
import ModalRedirectHandler from "@/components/ModalRedirectHandler";

export default async function Home() {
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Payment Success Handler - Updates balance when returning from checkout */}
        <PaymentSuccessHandler />

        {/* Modal Redirect Handler - Shows projects/feedback modals based on URL parameters */}
        <Suspense fallback={null}>
          <ModalRedirectHandler />
        </Suspense>

        {/* Header with Sidebar */}
        <AppHeader />

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
    </SidebarLayout>
  );
}
