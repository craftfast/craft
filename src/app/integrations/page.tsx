"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import SidebarLayout from "@/components/SidebarLayout";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Loader2,
  Key,
  ExternalLink,
  Search,
  Plus,
  MessageSquarePlus,
  Grid3X3,
  List,
  X,
  ChevronDown,
} from "lucide-react";

interface IntegrationStatus {
  connected: boolean;
  login?: string;
  username?: string;
  email?: string;
  handle?: string;
  imgUrl?: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "development" | "deployment" | "design" | "communication" | "ai";
  icon: React.ReactNode;
  iconBg: string;
  status: IntegrationStatus | null;
  isAvailable: boolean;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [vercelStatus, setVercelStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [figmaStatus, setFigmaStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [showVercelTokenInput, setShowVercelTokenInput] = useState(false);
  const [vercelToken, setVercelToken] = useState("");
  const [isConnectingWithToken, setIsConnectingWithToken] = useState(false);

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestIntegrationName, setRequestIntegrationName] = useState("");
  const [requestIntegrationDescription, setRequestIntegrationDescription] =
    useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    if (session) {
      checkIntegrationStatus();
    }
  }, [session]);

  const checkIntegrationStatus = async () => {
    setIsLoading(true);
    try {
      const [githubRes, vercelRes, figmaRes] = await Promise.all([
        fetch("/api/integrations/github/status"),
        fetch("/api/integrations/vercel/status"),
        fetch("/api/integrations/figma/status"),
      ]);

      if (githubRes.ok) {
        const data = await githubRes.json();
        setGithubStatus(data);
      }
      if (vercelRes.ok) {
        const data = await vercelRes.json();
        setVercelStatus(data);
      }
      if (figmaRes.ok) {
        const data = await figmaRes.json();
        setFigmaStatus(data);
      }
    } catch (error) {
      console.error("Failed to check integration status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (provider: "github" | "vercel" | "figma") => {
    setConnectingTo(provider);
    try {
      const res = await fetch(`/api/integrations/${provider}/connect`);
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(`Failed to connect to ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      toast.error(`Failed to connect to ${provider}`);
    } finally {
      setConnectingTo(null);
    }
  };

  const handleVercelTokenConnect = async () => {
    if (!vercelToken.trim()) {
      toast.error("Please enter your Vercel access token");
      return;
    }

    setIsConnectingWithToken(true);
    try {
      const res = await fetch("/api/integrations/vercel/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: vercelToken.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Connected to Vercel as ${data.username || data.email}`);
        setVercelStatus({
          connected: true,
          username: data.username,
          email: data.email,
        });
        setShowVercelTokenInput(false);
        setVercelToken("");
      } else {
        toast.error(data.error || "Failed to connect with token");
      }
    } catch (error) {
      console.error("Failed to connect with token:", error);
      toast.error("Failed to connect with token");
    } finally {
      setIsConnectingWithToken(false);
    }
  };

  const handleDisconnect = async (provider: "github" | "vercel" | "figma") => {
    try {
      const res = await fetch(`/api/integrations/${provider}/disconnect`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success(`Disconnected from ${provider}`);
        if (provider === "github") setGithubStatus(null);
        if (provider === "vercel") setVercelStatus(null);
        if (provider === "figma") setFigmaStatus(null);
      } else {
        toast.error(`Failed to disconnect from ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      toast.error(`Failed to disconnect from ${provider}`);
    }
  };

  const handleRequestIntegration = async () => {
    if (!requestIntegrationName.trim()) {
      toast.error("Please enter an integration name");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      // Submit feedback as integration request
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "feature",
          message: `Integration Request: ${requestIntegrationName}\n\nDescription: ${
            requestIntegrationDescription || "No description provided"
          }`,
        }),
      });

      if (res.ok) {
        toast.success("Integration request submitted! We'll review it soon.");
        setShowRequestModal(false);
        setRequestIntegrationName("");
        setRequestIntegrationDescription("");
      } else {
        toast.error("Failed to submit request");
      }
    } catch (error) {
      console.error("Failed to submit integration request:", error);
      toast.error("Failed to submit request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Define all integrations
  const integrations: Integration[] = useMemo(
    () => [
      {
        id: "github",
        name: "GitHub",
        description: "Deploy and manage repositories",
        category: "development",
        iconBg: "bg-neutral-900 dark:bg-white",
        icon: (
          <svg
            className="w-6 h-6 text-white dark:text-neutral-900"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
        ),
        status: githubStatus,
        isAvailable: true,
      },
      {
        id: "vercel",
        name: "Vercel",
        description: "Deploy and host your projects",
        category: "deployment",
        iconBg: "bg-neutral-900 dark:bg-neutral-900",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="white"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L2 20h20L12 2z" />
          </svg>
        ),
        status: vercelStatus,
        isAvailable: true,
      },
      {
        id: "figma",
        name: "Figma",
        description: "Import designs to project knowledge",
        category: "design",
        iconBg: "bg-white dark:bg-neutral-900 border border-input",
        icon: (
          <svg className="w-6 h-6" viewBox="0 0 38 57" fill="none">
            <path
              d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
              fill="#1ABCFE"
            />
            <path
              d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
              fill="#0ACF83"
            />
            <path
              d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
              fill="#FF7262"
            />
            <path
              d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
              fill="#F24E1E"
            />
            <path
              d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
              fill="#A259FF"
            />
          </svg>
        ),
        status: figmaStatus,
        isAvailable: true,
      },
      // Coming Soon Integrations
      {
        id: "slack",
        name: "Slack",
        description: "Get notifications and updates in Slack",
        category: "communication",
        iconBg: "bg-neutral-100 dark:bg-neutral-800",
        icon: (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
              fill="#E01E5A"
            />
          </svg>
        ),
        status: null,
        isAvailable: false,
      },
      {
        id: "netlify",
        name: "Netlify",
        description: "Alternative deployment platform",
        category: "deployment",
        iconBg: "bg-neutral-100 dark:bg-neutral-800",
        icon: (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M16.934 8.519a1.044 1.044 0 0 1 .303.03l2.9-2.9-.287-.287-3.56 1.166a1.045 1.045 0 0 1 .644.99zm-.93.478a1.043 1.043 0 0 1-.283.716l1.947 5.907.26-.26-1.975-6.248a1.008 1.008 0 0 1 .052-.115zm2.25 2.939a1.033 1.033 0 0 1 .053-.058l-1.674-1.675-1.947 1.947 1.675 1.675c.026-.02.052-.038.079-.055zm-5.625-5.625l1.675 1.675a1.033 1.033 0 0 1 .058-.053l-1.675-1.674zm.001-.001L10.955 4.636l-.287.287 1.674 1.674a1.008 1.008 0 0 1 .113-.05l.05-.164a1.043 1.043 0 0 1 .053-.043l-.254-.254zm-1.618 5.145a1.044 1.044 0 0 1-.716.283c-.032 0-.064-.002-.095-.005L7.04 14.895l5.172 5.172.287-.287-2.487-8.325zM12.23 5.13l.287-.287-5.05-5.05-.286.287 4.67 4.67.001.001.052.042a1.044 1.044 0 0 1 .326.337zm-1.333 4.472a1.044 1.044 0 0 1-.029-.251l-.001-.032-5.08 1.666.287.287 4.823-1.67zm1.025.263a1.044 1.044 0 0 1-.398-.078l-.068.226-1.946 6.145 8.37 2.733.287-.287-6.245-8.739zm-1.638.093a1.044 1.044 0 0 1-.716-.283l-1.675 1.675 1.675 1.675a1.033 1.033 0 0 1 .053.058l1.947-1.947-1.226-1.226a1.008 1.008 0 0 1-.058.048zm.012-2.026a1.044 1.044 0 0 1 .03-.303l-4.67-4.67-.287.287 4.67 4.67a1.044 1.044 0 0 1 .257.016zm8.57 5.156a1.043 1.043 0 0 1-.262-.682l-5.08-1.666-.001.032-.253 8.42 5.596 1.83.287-.287-4.67-4.67-.001-.001-.052-.042a1.044 1.044 0 0 1-.326-.337l1.675-1.674a1.043 1.043 0 0 1 .058.053l1.674-1.674a1.008 1.008 0 0 1-.05-.113l1.405.461z"
              fill="#00C7B7"
            />
          </svg>
        ),
        status: null,
        isAvailable: false,
      },
      {
        id: "linear",
        name: "Linear",
        description: "Project management and issue tracking",
        category: "development",
        iconBg: "bg-neutral-100 dark:bg-neutral-800",
        icon: (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M3.185 11.092a.367.367 0 0 0-.09.488l9.326 9.326a.367.367 0 0 0 .488-.09 9.035 9.035 0 0 0-9.724-9.724zM2.18 13.61a.367.367 0 0 0-.18.318v6.982c0 .61.495 1.104 1.104 1.104h6.982a.367.367 0 0 0 .318-.18L2.18 13.61zM12.819 21.82a.367.367 0 0 0 .318-.18l8.681-8.681a.367.367 0 0 0-.18-.318 9.036 9.036 0 0 0-8.819 9.179zM20.896 11.728a.367.367 0 0 0 .318-.18A9 9 0 0 0 12.452 2.786a.367.367 0 0 0-.18.318l8.624 8.624zM10.908 3.185a.367.367 0 0 0 .09-.488L10.67 2.37A9 9 0 0 0 3.37 10.67l.326.328a.367.367 0 0 0 .488-.09 9.035 9.035 0 0 0 6.724-7.724z"
              fill="#5E6AD2"
            />
          </svg>
        ),
        status: null,
        isAvailable: false,
      },
      {
        id: "notion",
        name: "Notion",
        description: "Import documentation and notes",
        category: "development",
        iconBg: "bg-neutral-100 dark:bg-neutral-800",
        icon: (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.014 3.306c.407.342.565.32 1.34.271l12.6-.763c.238 0 .04-.238-.04-.277l-2.093-1.514c-.357-.277-.832-.584-1.742-.506l-12.199.91c-.594.05-.713.297-.475.494l2.609 1.385zm.446 2.64v13.235c0 .713.357 1.02 1.158.97l13.861-.792c.802-.049 1.1-.474 1.1-1.088V5.07c0-.612-.237-.919-.772-.87l-14.479.83c-.575.05-.868.357-.868.919zm13.703.356c.079.356 0 .712-.357.752l-.674.13v9.791c-.585.318-.1.495-.793.495-.445 0-.663-.139-.1-.692l-3.43-10.681.297 11.84.673.149s0 .712-.495.712l-2.723.158c-.079-.158 0-.554.278-.619l.714-.178V8.254L7.14 8.48c-.079-.356.119-.863.673-.911l2.921-.178 3.55 10.807.277-11.768 1.208-.089c.079.158.079.673 0 1.03zm-13.62-1.267c0-.713.595-1.267 1.208-1.267l13.822-.832c.594-.05 1.189.317 1.189 1.03v14.326c0 .594-.178.792-.654.832l-14.637.832c-.435.05-.928-.039-.928-.871V5.035z"
              fill="currentColor"
            />
          </svg>
        ),
        status: null,
        isAvailable: false,
      },
    ],
    [githubStatus, vercelStatus, figmaStatus]
  );

  const categories = [
    { id: "all", label: "All" },
    { id: "development", label: "Development" },
    { id: "deployment", label: "Deployment" },
    { id: "design", label: "Design" },
    { id: "communication", label: "Communication" },
  ];

  // Filter integrations
  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      const matchesSearch =
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || integration.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [integrations, searchQuery, selectedCategory]);

  // Count connected integrations
  const connectedCount = integrations.filter((i) => i.status?.connected).length;

  // Loading state
  if (isPending) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      </SidebarLayout>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!session) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          {/* Header */}
          <AppHeader />

          {/* Auth Required Message */}
          <main className="flex-1 flex items-center justify-center pb-12">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Sign in to manage integrations
              </h2>
              <p className="text-muted-foreground mb-6">
                Create an account or sign in to connect GitHub, Vercel, and
                other services.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" asChild className="rounded-full">
                  <Link href="/auth/signin">Log in</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </div>
            </div>
          </main>
        </div>
      </SidebarLayout>
    );
  }

  const renderIntegrationCard = (integration: Integration) => {
    const isConnected = integration.status?.connected;
    const statusSetter =
      integration.id === "github"
        ? setGithubStatus
        : integration.id === "vercel"
        ? setVercelStatus
        : setFigmaStatus;

    return (
      <div
        key={integration.id}
        className={`p-4 bg-muted/50 rounded-xl border border-input transition-all ${
          !integration.isAvailable ? "opacity-60" : "hover:border-foreground/20"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full ${integration.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              {integration.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {integration.name}
                </p>
                {!integration.isAvailable && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isConnected
                  ? integration.id === "github"
                    ? `Connected as @${
                        integration.status?.login ||
                        integration.status?.username
                      }`
                    : integration.id === "vercel"
                    ? `Connected as ${
                        integration.status?.username ||
                        integration.status?.email
                      }`
                    : `Connected as @${
                        integration.status?.handle || integration.status?.email
                      }`
                  : integration.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isConnected && (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
            )}
            {isLoading && integration.isAvailable ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : integration.isAvailable ? (
              isConnected ? (
                <button
                  onClick={() =>
                    handleDisconnect(
                      integration.id as "github" | "vercel" | "figma"
                    )
                  }
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      handleConnect(
                        integration.id as "github" | "vercel" | "figma"
                      )
                    }
                    disabled={connectingTo === integration.id}
                    className="px-3 py-1.5 text-xs font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
                  >
                    {connectingTo === integration.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Connect"
                    )}
                  </button>
                  {integration.id === "vercel" && (
                    <button
                      onClick={() =>
                        setShowVercelTokenInput(!showVercelTokenInput)
                      }
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                      title="Connect with access token"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            ) : null}
          </div>
        </div>

        {/* Vercel Token Input */}
        {integration.id === "vercel" &&
          showVercelTokenInput &&
          !vercelStatus?.connected && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span>
                  Create a token at{" "}
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline hover:no-underline inline-flex items-center gap-1"
                  >
                    vercel.com/account/tokens
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  placeholder="Paste your Vercel access token"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleVercelTokenConnect}
                  disabled={isConnectingWithToken || !vercelToken.trim()}
                  className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
                >
                  {isConnectingWithToken ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>
            </div>
          )}
      </div>
    );
  };

  // Integrations title after logo
  const integrationsTitle = (
    <Link
      href="/integrations"
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
    >
      <span className="text-md font-semibold text-foreground">
        Integrations
      </span>
    </Link>
  );

  // Integrated search bar with category filter dropdown and view toggle
  const searchAndFilters = (
    <div className="hidden md:flex items-center gap-2 w-full max-w-xl">
      {/* Search with integrated category filter */}
      <div className="flex-1 flex items-center bg-muted/50 border border-input rounded-lg overflow-hidden">
        <Search className="w-4 h-4 text-muted-foreground ml-3" />
        <input
          type="text"
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm bg-transparent border-none focus:outline-none placeholder:text-muted-foreground"
        />
        {/* Category dropdown integrated in search bar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border-l border-input transition-colors">
              <span>
                {categories.find((c) => c.id === selectedCategory)?.label}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl">
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-lg text-xs ${
                  selectedCategory === category.id ? "font-medium" : ""
                }`}
              >
                {category.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* View Toggle */}
      <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-input">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === "grid"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-1.5 rounded-md transition-colors ${
            viewMode === "list"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Request Integration button before credits
  const requestButton = (
    <Button
      onClick={() => setShowRequestModal(true)}
      size="sm"
      className="rounded-full"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline text-sm">Request</span>
    </Button>
  );

  return (
    <SidebarLayout>
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        {/* Header */}
        <AppHeader
          afterLogo={integrationsTitle}
          centerContent={searchAndFilters}
          beforeCredits={requestButton}
        />

        {/* Mobile Search and Filters */}
        <div className="md:hidden px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {/* Search with filter */}
            <div className="flex-1 flex items-center bg-muted/50 border border-input rounded-lg overflow-hidden">
              <Search className="w-4 h-4 text-muted-foreground ml-3" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-2 py-2 text-sm bg-transparent border-none focus:outline-none placeholder:text-muted-foreground"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-2 py-2 text-xs text-muted-foreground border-l border-input">
                    <span>
                      {categories
                        .find((c) => c.id === selectedCategory)
                        ?.label?.substring(0, 3)}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`rounded-lg text-xs ${
                        selectedCategory === category.id ? "font-medium" : ""
                      }`}
                    >
                      {category.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* View Toggle */}
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-input">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Full page scrollable */}
        <main className="flex-1 overflow-y-auto pb-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="px-4 sm:px-6 lg:px-8 pt-6">
            {/* Integrations Grid/List */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "space-y-3"
              }
            >
              {filteredIntegrations.length > 0 ? (
                filteredIntegrations.map(renderIntegrationCard)
              ) : (
                <div className="col-span-full py-12 text-center">
                  <p className="text-muted-foreground">
                    No integrations found matching your search.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-2 text-sm text-foreground underline hover:no-underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="mt-8 p-6 bg-muted/30 rounded-2xl border border-input max-w-3xl">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                About Integrations
              </h3>
              <p className="text-sm text-muted-foreground">
                Integrations you connect here are available across all your
                projects. Once connected, you can use them for deployment,
                version control, design imports, and more. Your integration
                credentials are securely stored and can be disconnected at any
                time.
              </p>
            </div>
          </div>
        </main>

        {/* Request Integration Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Request an Integration
                </h2>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Can&apos;t find the integration you need? Let us know and
                we&apos;ll consider adding it.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Integration Name *
                  </label>
                  <input
                    type="text"
                    value={requestIntegrationName}
                    onChange={(e) => setRequestIntegrationName(e.target.value)}
                    placeholder="e.g., Jira, Stripe, AWS"
                    className="w-full px-4 py-2.5 text-sm bg-muted/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    value={requestIntegrationDescription}
                    onChange={(e) =>
                      setRequestIntegrationDescription(e.target.value)
                    }
                    placeholder="Tell us how you'd use this integration..."
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm bg-muted/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestIntegration}
                    disabled={
                      isSubmittingRequest || !requestIntegrationName.trim()
                    }
                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingRequest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
