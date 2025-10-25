import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import Projects from "@/components/Projects";
import { getUserSubscription } from "@/lib/subscription";
import type { Session } from "next-auth";

export default async function ProjectsPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  // If not logged in, redirect to home page
  if (!session) {
    redirect("/home");
  }

  // Get user's subscription details
  const subscription = await getUserSubscription(session.user.id);

  return (
    <div className="h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-background" />

      {/* Header - Fixed */}
      <header className="flex-shrink-0 relative z-50 bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <DashboardHeader
            planName={subscription?.plan?.name}
            userId={session.user.id}
            userSubscription={subscription}
            showLogoText={true}
          />
        </div>
      </header>

      {/* Main Content with padding to account for fixed header */}
      <main className="relative flex-1 min-h-0 px-2 pb-2 flex flex-col">
        {/* Projects Section - Full Width with Border - Fixed Height */}
        <div className="flex-1 min-h-0 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden flex flex-col">
          <Projects />
        </div>
      </main>
    </div>
  );
}
