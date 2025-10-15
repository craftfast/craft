"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import UserMenu from "./UserMenu";
import TeamSwitcher from "./TeamSwitcher";

interface DashboardHeaderProps {
  title?: string;
  planName?: string;
  teamId?: string;
  teamSubscription?: {
    plan: {
      name: string;
      displayName: string;
    };
  } | null;
}

export default function DashboardHeader({
  title = "Dashboard",
  planName,
  teamId,
  teamSubscription,
}: DashboardHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showPlanBadge = planName === "HOBBY" || planName === "PRO";

  return (
    <>
      <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center w-full">
        <div className="flex items-center justify-start ml-4 border-neutral-200 dark:border-neutral-700">
          <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
          <button
            onClick={() => router.push("/dashboard")}
            className="ml-2 px-2 py-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer rounded-full transition-colors"
          >
            {title}
          </button>
          {showPlanBadge && (
            <span className="mr-2 px-2 py-1 leading-tight text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full border border-neutral-200 dark:border-neutral-700">
              {planName === "HOBBY" ? "Hobby" : "Pro"}
            </span>
          )}
          {teamId && (
            <TeamSwitcher
              currentTeam={{
                id: teamId,
                name: title,
                subscription: teamSubscription || null,
              }}
            />
          )}
        </div>
        <div className="flex items-center justify-center">
          {planName === "HOBBY" && (
            <button
              onClick={() => router.push("/pricing")}
              className="flex items-center leading-tight gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Upgrade to Pro</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => {}}
            className="flex items-center leading-tight gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-600 transition-colors"
            aria-label="Search"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span>Search</span>
          </button>
          <button
            onClick={() => {}}
            className="flex items-center leading-tight gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New Project</span>
          </button>
          {session?.user && (
            <UserMenu user={session.user} showDashboardLink={false} />
          )}
        </div>
      </div>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="sm:hidden p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors ml-auto"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>
      {isMobileMenuOpen && (
        <div className="sm:hidden absolute top-12 left-0 right-0 rounded-3xl bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-lg">
          <nav className="flex flex-col p-4 space-y-2">
            {session?.user && (
              <>
                <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg mb-2">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {session.user.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    router.push("/dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-left"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    router.push("/pricing");
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-left"
                >
                  Upgrade Plan
                </button>
                <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
                <button
                  onClick={async () => {
                    const { signOut } = await import("next-auth/react");
                    await signOut({ callbackUrl: "/home" });
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-600 transition-colors"
                >
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
