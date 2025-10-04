"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeaderNav() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationLinks = [
    { href: "#pricing", label: "Pricing" },
    { href: "#help", label: "Help" },
    { href: "#terms", label: "Policy" },
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
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Desktop Auth Buttons */}
      <div className="hidden sm:flex items-center gap-3">
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
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
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
          </nav>
        </div>
      )}
    </>
  );
}
