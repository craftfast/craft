import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CodingInterface from "@/components/CodingInterface";

// Force dynamic rendering to ensure fresh project data
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: {
    "project-id": string;
  };
}

export default async function ProjectCodingPage({ params }: PageProps) {
  const session = await getSession();

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

  // If project doesn't exist or user doesn't own it, redirect to home
  if (!project || project.userId !== session.user.id) {
    redirect("/");
  }

  // Balance-based system - no plan tiers needed

  return (
    <CodingInterface
      project={{
        ...project,
        visibility: project.visibility as
          | "public"
          | "secret"
          | "private"
          | undefined,
      }}
      user={session.user}
      planName={planName}
    />
  );
}
