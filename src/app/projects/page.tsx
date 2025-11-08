import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import Projects from "@/components/Projects";
import { getUserSubscription } from "@/lib/subscription";

export default async function ProjectsPage() {
  const session = await getSession();

  // If not logged in, redirect to home page
  if (!session) {
    redirect("/home");
  }

  // Get user's subscription details
  const subscription = await getUserSubscription(session.user.id);

  return (
    <div className="h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 relative z-[40]">
        <div className="px-2 sm:px-4 py-2">
          <DashboardHeader
            planName={subscription?.plan?.name}
            userId={session.user.id}
            userSubscription={subscription}
            showLogoText={true}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 min-h-0 flex flex-col">
        {/* Projects Section - Full Height */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Projects />
        </div>
      </main>
    </div>
  );
}
