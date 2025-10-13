import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import DashboardHeader from "@/components/DashboardHeader";
import CraftInput from "@/components/CraftInput";
import RecentProjects from "@/components/RecentProjects";
import { getUserPersonalTeam } from "@/lib/team";
import type { Session } from "next-auth";

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  // If not logged in, redirect to home page
  if (!session) {
    redirect("/home");
  }

  // Fetch the user's personal team
  const team = await getUserPersonalTeam(session.user.id);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-background to-stone-100 dark:from-neutral-900 dark:via-background dark:to-neutral-800 opacity-60" />

      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo
              showText={false}
              iconClassName="text-white dark:text-white"
              href="/dashboard"
            />
            <DashboardHeader
              title={team?.name}
              planName={team?.subscription?.plan?.name}
            />
          </div>
        </div>
      </header>

      {/* Main Content with padding to account for fixed header */}
      <main className="relative flex-1 min-h-0 py-8 sm:py-12 md:py-16 pt-20 sm:pt-24">
        {/* Chat Input Section */}
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 mb-16 mt-[10%]">
          {/* Centered Greeting with Personalization */}
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground mb-2">
              What can I help you craft?
            </h1>
          </div>

          {/* ChatGPT-style Input */}
          <CraftInput />
        </div>

        {/* Recent Projects Section - Full Width */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <RecentProjects />
        </div>
      </main>
    </div>
  );
}
