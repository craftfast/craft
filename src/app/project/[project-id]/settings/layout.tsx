"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import SidebarLayout from "@/components/SidebarLayout";
import {
  Settings,
  Lock,
  Eye,
  Users,
  GitBranch,
  Cloud,
  Clock,
  FolderOpen,
} from "lucide-react";

type ProjectSettingsSection =
  | "general"
  | "environment"
  | "views"
  | "collaborators"
  | "git"
  | "deployments"
  | "versions"
  | "knowledge";

const menuItems: {
  id: ProjectSettingsSection;
  label: string;
  path: string;
  icon: React.ElementType;
}[] = [
  { id: "general", label: "General", path: "", icon: Settings },
  { id: "environment", label: "Environment", path: "/environment", icon: Lock },
  { id: "views", label: "Views", path: "/views", icon: Eye },
  {
    id: "collaborators",
    label: "Collaborators",
    path: "/collaborators",
    icon: Users,
  },
  { id: "versions", label: "Version History", path: "/versions", icon: Clock },
  { id: "git", label: "GitHub", path: "/git", icon: GitBranch },
  {
    id: "deployments",
    label: "Deployments",
    path: "/deployments",
    icon: Cloud,
  },
  { id: "knowledge", label: "Knowledge", path: "/knowledge", icon: FolderOpen },
];

export default function ProjectSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [projectName, setProjectName] = useState<string>("");

  const projectId = params["project-id"] as string;
  const basePath = `/project/${projectId}/settings`;

  // Fetch project name
  useEffect(() => {
    if (projectId) {
      fetch(`/api/projects/${projectId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch project");
          return res.json();
        })
        .then((data) => {
          if (data.project?.name) {
            setProjectName(data.project.name);
          }
        })
        .catch((err) => console.error("Error fetching project:", err));
    }
  }, [projectId]);

  // Determine active section from pathname
  const getActiveSection = (): ProjectSettingsSection => {
    if (pathname === basePath || pathname === `${basePath}/general`)
      return "general";
    if (pathname === `${basePath}/environment`) return "environment";
    if (pathname === `${basePath}/views`) return "views";
    if (pathname === `${basePath}/collaborators`) return "collaborators";
    if (pathname === `${basePath}/git`) return "git";
    if (pathname === `${basePath}/deployments`) return "deployments";
    if (pathname === `${basePath}/versions`) return "versions";
    if (pathname === `${basePath}/knowledge`) return "knowledge";
    return "general";
  };

  const activeSection = getActiveSection();

  // Show loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <SidebarLayout>
      <ProjectSettingsContent
        projectId={projectId}
        projectName={projectName}
        basePath={basePath}
        activeSection={activeSection}
      >
        {children}
      </ProjectSettingsContent>
    </SidebarLayout>
  );
}

function ProjectSettingsContent({
  projectId,
  projectName,
  basePath,
  activeSection,
  children,
}: {
  projectId: string;
  projectName: string;
  basePath: string;
  activeSection: ProjectSettingsSection;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const projectNameElement = (
    <button
      onClick={() => router.push(`/project/${projectId}`)}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
    >
      {projectName ? (
        <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
          {projectName}
        </span>
      ) : (
        <span className="h-4 w-24 bg-muted animate-pulse rounded" />
      )}
    </button>
  );

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <AppHeader fixed afterLogo={projectNameElement} />

      {/* Main Content - with padding for fixed header */}
      <div className="flex-1 flex pt-12 overflow-hidden">
        {/* Left Sidebar - Menu (Fixed) */}
        <div className="w-64 flex-shrink-0 fixed top-14 left-0 bottom-0 overflow-y-auto bg-background [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Settings Title */}
          <div className="px-4 pt-2 pb-2">
            <h1 className="text-xl font-semibold text-foreground">
              Project Settings
            </h1>
          </div>
          <nav className="p-4 pt-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(`${basePath}${item.path}`)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                    activeSection === item.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Panel - Content (with left margin for fixed sidebar) */}
        <div className="flex-1 ml-64 bg-background p-2 overflow-hidden">
          <div className="h-full border border-border rounded-2xl overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50">
            <div className="max-w-3xl mx-auto p-8 pt-14">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
