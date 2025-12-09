/**
 * Admin Dashboard Page
 *
 * Operational dashboard for self-hosted Craft instances
 * Focus: System health, recent activity, items needing attention
 * Detailed metrics/analytics go to /open page (public transparency)
 */

import { Suspense } from "react";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Shield,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Quick Stats Component - Simplified
async function QuickStats() {
  const now = new Date();
  const today = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, activeUsersThisWeek, totalProjects, aiCallsToday] =
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: {
          deletedAt: null,
          sessions: { some: { createdAt: { gte: thisWeek } } },
        },
      }),
      prisma.project.count(),
      prisma.aICreditUsage.count({ where: { createdAt: { gte: today } } }),
    ]);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2">
              <Users className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <div className="text-sm text-neutral-500">Total Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2">
              <Activity className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeUsersThisWeek}</div>
              <div className="text-sm text-neutral-500">Active (7d)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2">
              <FolderKanban className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <div className="text-sm text-neutral-500">Projects</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2">
              <Cpu className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{aiCallsToday}</div>
              <div className="text-sm text-neutral-500">AI Calls (24h)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeleton
function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card
          key={i}
          className="rounded-2xl border-neutral-200 dark:border-neutral-800"
        >
          <CardContent className="p-4">
            <div className="h-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Items Needing Attention
async function AttentionItems() {
  const [
    failedWebhooks,
    pendingWebhooks,
    unreadSupport,
    failedAuthToday,
    bannedUsers,
  ] = await Promise.all([
    prisma.webhookEvent.count({ where: { status: "FAILED" } }),
    prisma.webhookEvent.count({ where: { status: "PENDING" } }),
    prisma.supportMessage.count({
      where: { isRead: false, isFromAdmin: false },
    }),
    prisma.securityEvent.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        success: false,
      },
    }),
    prisma.user.count({ where: { banned: true } }),
  ]);

  const items = [
    {
      label: "Failed Webhooks",
      count: failedWebhooks,
      href: "/admin/webhooks",
      critical: failedWebhooks > 0,
    },
    {
      label: "Pending Webhooks",
      count: pendingWebhooks,
      href: "/admin/webhooks",
      critical: pendingWebhooks > 100,
    },
    {
      label: "Unread Support Messages",
      count: unreadSupport,
      href: "/admin/support",
      critical: unreadSupport > 0,
    },
    {
      label: "Failed Auth (24h)",
      count: failedAuthToday,
      href: "/admin/security-events",
      critical: failedAuthToday > 50,
    },
    {
      label: "Banned Users",
      count: bannedUsers,
      href: "/admin/users?role=banned",
      critical: false,
    },
  ];

  const hasIssues = items.some((item) => item.critical);

  return (
    <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasIssues ? (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {hasIssues ? "Needs Attention" : "All Clear"}
        </CardTitle>
        <CardDescription>
          {hasIssues ? "Items requiring your attention" : "No urgent issues"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <span className="text-sm font-medium">{item.label}</span>
              <Badge
                className={`rounded-full ${
                  item.critical
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                {item.count}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Activity Component
async function RecentActivity() {
  const [recentUsers, recentProjects] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        image: true,
      },
    }),
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Users */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Recent Signups
            </CardTitle>
            <Link
              href="/admin/users"
              className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1"
            >
              View all <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUsers.map(
              (user: {
                id: string;
                name: string | null;
                email: string;
                createdAt: Date;
                image: string | null;
              }) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        {user.name?.[0] || user.email[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || user.email}
                    </p>
                  </div>
                  <div className="text-xs text-neutral-400 shrink-0">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4" />
              Recent Projects
            </CardTitle>
            <Link
              href="/admin/projects"
              className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1"
            >
              View all <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentProjects.map(
              (project: {
                id: string;
                name: string;
                createdAt: Date;
                user: { name: string | null; email: string };
              }) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 -mx-2 px-2 py-1 rounded-lg transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <FolderKanban className="h-4 w-4 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {project.user.name || project.user.email}
                    </p>
                  </div>
                  <div className="text-xs text-neutral-400 shrink-0">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick Links
function QuickLinks() {
  const links = [
    { label: "Support Chat", href: "/admin/support", icon: MessageSquare },
    { label: "Security Events", href: "/admin/security-events", icon: Shield },
    { label: "AI Models", href: "/admin/ai-models", icon: Cpu },
  ];

  return (
    <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Dashboard
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          System overview and items needing attention
        </p>
      </div>

      {/* Quick Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <QuickStats />
      </Suspense>

      {/* Attention Items + Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Suspense
          fallback={
            <Card className="rounded-2xl animate-pulse h-64 bg-neutral-100 dark:bg-neutral-900" />
          }
        >
          <AttentionItems />
        </Suspense>
        <QuickLinks />
      </div>

      {/* Recent Activity */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card
                key={i}
                className="rounded-2xl animate-pulse h-64 bg-neutral-100 dark:bg-neutral-900"
              />
            ))}
          </div>
        }
      >
        <RecentActivity />
      </Suspense>
    </div>
  );
}
