import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Logo from "@/components/Logo";
import DashboardHeader from "@/components/DashboardHeader";
import Projects from "@/components/Projects";
import { getUserPersonalTeam, getTeamById } from "@/lib/team";
import type { Session } from "next-auth";

export default async function ProjectsPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  // If not logged in, redirect to home page
  if (!session) {
    redirect("/home");
  }

  // Try to get selected team from cookie, otherwise use personal team
  const cookieStore = await cookies();
  const selectedTeamId = cookieStore.get("selectedTeamId")?.value;

  let team;
  if (selectedTeamId) {
    team = await getTeamById(selectedTeamId, session.user.id);
  }

  // Fallback to personal team if no selected team or team not found
  if (!team) {
    team = await getUserPersonalTeam(session.user.id);
  }

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
              teamId={team?.id}
              teamSubscription={team?.subscription}
            />
          </div>
        </div>
      </header>

      {/* Main Content with padding to account for fixed header */}
      <main className="relative flex-1 min-h-0 mt-18">
        {/* Projects Section - Full Width */}
        <div className="w-full mx-auto px-4">
          <Projects />
        </div>
      </main>
    </div>
  );
}
