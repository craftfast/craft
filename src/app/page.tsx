import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import CraftInput from "@/components/CraftInput";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-background to-stone-100 dark:from-neutral-900 dark:via-background dark:to-neutral-800 opacity-60" />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <Logo iconClassName="text-white dark:text-white" />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center flex-1 min-h-0 py-12 sm:py-16">
        <div className="w-full max-w-3xl mx-auto px-6 sm:px-8">
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
        <div className="w-full text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            By messaging Craft, you agree to our{" "}
            <a
              href="#terms"
              className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline underline-offset-2 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
            >
              Terms of Service
            </a>{" "}
            and acknowledge that you have read our{" "}
            <a
              href="#privacy"
              className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline underline-offset-2 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
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
