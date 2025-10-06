import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

export default async function Home() {
  const session = (await getServerSession(authOptions)) as Session | null;

  // Redirect logged-in users to dashboard, others to landing page
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/home");
  }
}
