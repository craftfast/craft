"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import UserMenu from "./UserMenu";

export default function HomeHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationLinks = [
    { href: "/pricing", label: "Pricing" },
    { href: "/help", label: "Help" },
    { href: "/enterprise", label: "Enterprise" },
    {
      href: "https://github.com/craftdottech/craft",
      label: "Contribute",
      external: true,
    },
    { href: "https://x.com/craftdottech", label: "Updates", external: true },
  ];

  return (
    <>
      {/* Desktop Navigation - Centered */}
      <nav className="hidden sm:flex items-center gap-6 md:absolute md:left-1/2 md:-translate-x-1/2">
        {navigationLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors inline-flex items-center gap-1"
          >
            {link.label}
            {link.external && (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            )}
          </a>
        ))}
      </nav>

      {/* Desktop Auth/User Menu */}
      <div className="hidden sm:flex items-center gap-3">
        {session?.user ? (
          <>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-600 transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </button>
            <UserMenu user={session.user} showDashboardLink={true} />
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/auth/signin")}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-600 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/auth/signup")}
              className="px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors"
            >
              Sign up
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
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

      {/* Mobile Menu */}
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
                <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
              </>
            )}
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
                {link.external && (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </a>
            ))}
            <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
            {session?.user ? (
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
            ) : (
              <>
                <button
                  onClick={() => {
                    router.push("/auth/signin");
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-600 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    router.push("/auth/signup");
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
