import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import PendingProjectHandler from "@/components/PendingProjectHandler";

export default async function Home() {
  const session = (await getServerSession(authOptions)) as Session | null;

  // Redirect logged-in users to dashboard, others to landing page
  if (session) {
    // User is authenticated - check for pending project on client side
    return <PendingProjectHandler />;
  } else {
    redirect("/home");
  }
}
