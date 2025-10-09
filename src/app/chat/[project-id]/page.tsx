import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CodingInterface from "@/components/CodingInterface";
import type { Session } from "next-auth";

// Force dynamic rendering to ensure fresh project data
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: {
    "project-id": string;
  };
}

export default async function ProjectCodingPage({ params }: PageProps) {
  const session = (await getServerSession(authOptions)) as Session | null;

  // If not logged in, redirect to sign in
  if (!session) {
    redirect("/auth/signin");
  }

  // Await params before accessing properties (Next.js 15 requirement)
  const resolvedParams = await params;
  const projectId = resolvedParams["project-id"];

  // Fetch the project and verify ownership
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      user: true,
    },
  });

  // If project doesn't exist or user doesn't own it, redirect to dashboard
  if (!project || project.userId !== session.user.id) {
    redirect("/dashboard");
  }

  return <CodingInterface project={project} user={session.user} />;
}
