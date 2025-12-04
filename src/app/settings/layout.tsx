"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import DashboardHeader from "@/components/DashboardHeader";

type SettingsSection =
  | "general"
  | "personalization"
  | "models"
  | "billing"
  | "usage"
  | "account";

const menuItems: { id: SettingsSection; label: string; path: string }[] = [
  { id: "general", label: "General", path: "/settings" },
  {
    id: "personalization",
    label: "Personalization",
    path: "/settings/personalization",
  },
  { id: "models", label: "Models", path: "/settings/models" },
  { id: "billing", label: "Billing", path: "/settings/billing" },
  { id: "usage", label: "Usage", path: "/settings/usage" },
  { id: "account", label: "Account", path: "/settings/account" },
];

const getMenuIcon = (itemId: SettingsSection) => {
  const iconClass = "w-5 h-5";
  switch (itemId) {
    case "general":
      return (
        <svg
          className={iconClass}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    case "billing":
      return (
        <svg
          className={iconClass}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      );
    case "usage":
      return (
        <svg
          className={iconClass}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    case "account":
      return (
        <svg
          className={iconClass}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case "personalization":
      return (
        <svg
          className={iconClass}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      );
    case "models":
      return (
        <svg
          className={iconClass}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      );
  }
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Determine active section from pathname
  const getActiveSection = (): SettingsSection => {
    if (pathname === "/settings" || pathname === "/settings/general")
      return "general";
    if (pathname === "/settings/personalization") return "personalization";
    if (pathname === "/settings/models") return "models";
    if (pathname === "/settings/billing") return "billing";
    if (pathname === "/settings/usage") return "usage";
    if (pathname === "/settings/account") return "account";
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
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header - Same as dashboard/chat */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 h-12 items-center flex">
          <DashboardHeader userId={session.user.id} showLogoText={true} />
        </div>
      </header>

      {/* Main Content - with padding for fixed header */}
      <div className="flex-1 flex pt-10 overflow-hidden">
        {/* Left Sidebar - Menu (Fixed) */}
        <div className="w-64 flex-shrink-0 fixed top-14 left-0 bottom-0 overflow-y-auto bg-background [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Settings Title */}
          <div className="px-4 pt-2 pb-2">
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          </div>
          <nav className="p-4 pt-2 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                  activeSection === item.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {getMenuIcon(item.id)}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
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
