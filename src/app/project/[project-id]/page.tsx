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

  // Fetch user data with accountBalance and personalization (need to serialize Decimal)
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      accountBalance: true,
      enableCodeExecution: true,
    },
  });

  // Balance-based system - no plan tiers needed
  // Serialize user data to plain object (convert Decimal to number)
  const serializedUser = {
    ...session.user,
    accountBalance: userData?.accountBalance
      ? Number(userData.accountBalance)
      : 0,
    enableCodeExecution: userData?.enableCodeExecution ?? true,
  };

  // Serialize project data (convert any Decimal fields in nested user object)
  const serializedProject = {
    ...project,
    user: project.user
      ? {
          ...project.user,
          accountBalance: Number(project.user.accountBalance || 0),
        }
      : undefined,
  };

  return <CodingInterface project={serializedProject} user={serializedUser} />;
}
