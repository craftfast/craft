"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, Github, Twitter, Linkedin } from "lucide-react";

export default function HeaderNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const menuItems = [
    {
      label: "See plans and pricing",
      href: "#pricing",
      icon: (
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "#settings",
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      label: "Help center",
      href: "#help",
      icon: (
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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Release notes",
      href: "#releases",
      icon: (
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
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      ),
    },
    {
      label: "Terms & policies",
      href: "#terms",
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      label: "Contribute",
      href: "https://github.com/craftdottech/craft",
      icon: <Github className="w-4 h-4" />,
      external: true,
    },
    {
      label: "Follow on X",
      href: "https://x.com/craftdottech",
      icon: <Twitter className="w-4 h-4" />,
      external: true,
    },
    {
      label: "Follow on LinkedIn",
      href: "https://linkedin.com/company/craftdottech",
      icon: <Linkedin className="w-4 h-4" />,
      external: true,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Log in Button */}
      <button
        onClick={() => router.push("/auth/signin")}
        className="inline-flex items-center justify-center min-h-9 px-4 text-sm font-medium text-foreground hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-full transition-colors duration-200 border border-stone-300 dark:border-neutral-600"
      >
        Log in
      </button>

      {/* Sign up Button */}
      <button
        onClick={() => router.push("/auth/signup")}
        className="inline-flex items-center justify-center min-h-9 px-4 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-300 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Sign up for free
      </button>

      {/* Settings Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-full transition-colors duration-200 flex items-center justify-center"
          aria-label="Settings menu"
        >
          <HelpCircle className="w-5 h-5 text-foreground" />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="py-1.5">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-stone-50 dark:hover:bg-neutral-800 transition-colors duration-150"
                  onClick={() => setIsMenuOpen(false)}
                  {...(item.external && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                >
                  <span className="text-stone-500 dark:text-neutral-400">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
