/**
 * Admin Sidebar Navigation
 *
 * Streamlined sidebar for self-hosted Craft instances
 * Focus: User management, support, and system operations
 * Analytics/metrics go to /open page (public transparency)
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Cpu,
  MessageSquare,
  Shield,
  Webhook,
  CreditCard,
  Settings,
  ChevronLeft,
  MessageCircle,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

// Navigation items grouped by function
const navItems = [
  // Core Management
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage users",
  },
  {
    name: "Projects",
    href: "/admin/projects",
    icon: FolderKanban,
    description: "Debug projects",
  },
  // AI & Billing
  {
    name: "AI Models",
    href: "/admin/ai-models",
    icon: Cpu,
    description: "Configure models",
  },
  {
    name: "Billing",
    href: "/admin/billing",
    icon: CreditCard,
    description: "Transactions",
  },
  // Support
  {
    name: "Support",
    href: "/admin/support",
    icon: MessageSquare,
    description: "User chat",
  },
  {
    name: "Feedback",
    href: "/admin/feedback",
    icon: MessageCircle,
    description: "User feedback",
  },
  // System & Security
  {
    name: "Security",
    href: "/admin/security-events",
    icon: Shield,
    description: "Auth events",
  },
  {
    name: "Audit Logs",
    href: "/admin/audit-logs",
    icon: History,
    description: "Change history",
  },
  {
    name: "Webhooks",
    href: "/admin/webhooks",
    icon: Webhook,
    description: "Queue status",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Instance config",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-4 px-2">
            <Logo variant="icon" className="h-6!" href="/admin" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive
                      ? "text-neutral-700 dark:text-neutral-300"
                      : "text-neutral-400 dark:text-neutral-500"
                  )}
                />
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span
                    className={cn(
                      "text-xs",
                      isActive
                        ? "text-neutral-500 dark:text-neutral-400"
                        : "text-neutral-400 dark:text-neutral-500"
                    )}
                  >
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </div>
    </aside>
  );
}
