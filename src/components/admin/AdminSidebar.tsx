/**
 * Admin Sidebar Navigation
 *
 * Sidebar with navigation links for admin panel sections
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
  Activity,
  Settings,
  ChevronLeft,
  BarChart3,
  MessageCircle,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

const navItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview & KPIs",
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Charts & trends",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    description: "User management",
  },
  {
    name: "Projects",
    href: "/admin/projects",
    icon: FolderKanban,
    description: "Project management",
  },
  {
    name: "AI Models",
    href: "/admin/ai-models",
    icon: Cpu,
    description: "Model configuration",
  },
  {
    name: "Support Chat",
    href: "/admin/support",
    icon: MessageSquare,
    description: "Chat with users",
  },
  {
    name: "Feedback",
    href: "/admin/feedback",
    icon: MessageCircle,
    description: "User feedback",
  },
  {
    name: "Security Events",
    href: "/admin/security-events",
    icon: Shield,
    description: "Security logs",
  },
  {
    name: "Audit Logs",
    href: "/admin/audit-logs",
    icon: History,
    description: "Model changes",
  },
  {
    name: "Webhooks",
    href: "/admin/webhooks",
    icon: Webhook,
    description: "Webhook monitoring",
  },
  {
    name: "Billing",
    href: "/admin/billing",
    icon: CreditCard,
    description: "Payments & subscriptions",
  },
  {
    name: "Usage",
    href: "/admin/usage",
    icon: Activity,
    description: "System usage stats",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Admin settings",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Logo variant="icon" className="!h-6" href="/admin" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
