import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import PendingProjectHandler from "@/components/PendingProjectHandler";

export default async function Home() {
  const session = await getSession();

  // Redirect logged-in users to dashboard, others to landing page
  if (session) {
    // User is authenticated - check for pending project on client side
    return <PendingProjectHandler />;
  } else {
    redirect("/home");
  }
}
