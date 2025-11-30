/**
 * Admin Dashboard Page
 *
 * Main admin dashboard with KPIs, charts, and quick stats
 */

import { Suspense } from "react";
import {
  Users,
  FolderKanban,
  CreditCard,
  Cpu,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
} from "lucide-react";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Stats Card Component
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {value}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {trend && trendValue && (
            <>
              {trend === "up" && (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
              {trend === "down" && (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend === "up"
                    ? "text-green-600 dark:text-green-400"
                    : trend === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-neutral-500"
                }`}
              >
                {trendValue}
              </span>
            </>
          )}
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card
          key={i}
          className="rounded-2xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader className="pb-2">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Dashboard Stats Component
async function DashboardStats() {
  // Get stats from database
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastWeek,
    totalProjects,
    activeProjects,
    totalRevenue,
    recentRevenue,
    aiUsageToday,
  ] = await Promise.all([
    // Total users
    prisma.user.count({ where: { deletedAt: null } }),
    // New users this month
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
    }),
    // New users last week
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo }, deletedAt: null },
    }),
    // Total projects
    prisma.project.count(),
    // Active projects (updated in last 7 days)
    prisma.project.count({
      where: { updatedAt: { gte: sevenDaysAgo }, status: "active" },
    }),
    // Total revenue (successful payments)
    prisma.paymentTransaction
      .aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
      })
      .then((r) => r._sum.amount || 0),
    // Recent revenue (last 30 days)
    prisma.paymentTransaction
      .aggregate({
        where: {
          status: "completed",
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
      })
      .then((r) => r._sum.amount || 0),
    // AI usage today
    prisma.aICreditUsage.count({
      where: { createdAt: { gte: yesterday } },
    }),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={totalUsers.toLocaleString()}
        description={`+${newUsersLastWeek} this week`}
        icon={Users}
        trend="up"
        trendValue={`+${newUsersThisMonth}`}
      />
      <StatsCard
        title="Total Projects"
        value={totalProjects.toLocaleString()}
        description={`${activeProjects} active this week`}
        icon={FolderKanban}
      />
      <StatsCard
        title="Total Revenue"
        value={`$${totalRevenue.toLocaleString()}`}
        description={`$${recentRevenue.toLocaleString()} last 30 days`}
        icon={DollarSign}
        trend={recentRevenue > 0 ? "up" : "neutral"}
      />
      <StatsCard
        title="AI Requests Today"
        value={aiUsageToday.toLocaleString()}
        description="Total API calls"
        icon={Cpu}
      />
    </div>
  );
}

// Recent Activity Component
async function RecentActivity() {
  const recentUsers = await prisma.user.findMany({
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
  });

  const recentProjects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Users */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Users
          </CardTitle>
          <CardDescription>Latest user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {user.name || "No name"}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="text-xs text-neutral-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Recent Projects
          </CardTitle>
          <CardDescription>Latest projects created</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {project.name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    by {project.user.name || project.user.email}
                  </p>
                </div>
                <div className="text-xs text-neutral-400">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// System Health Component
async function SystemHealth() {
  const [
    pendingWebhooks,
    failedWebhooks,
    activeSessions,
    recentSecurityEvents,
  ] = await Promise.all([
    prisma.webhookEvent.count({ where: { status: "PENDING" } }),
    prisma.webhookEvent.count({ where: { status: "FAILED" } }),
    prisma.session.count({
      where: { expiresAt: { gt: new Date() } },
    }),
    prisma.securityEvent.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        success: false,
      },
    }),
  ]);

  return (
    <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>Current system status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {activeSessions}
            </div>
            <div className="text-sm text-neutral-500">Active Sessions</div>
          </div>
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {pendingWebhooks}
            </div>
            <div className="text-sm text-neutral-500">Pending Webhooks</div>
          </div>
          <div
            className={`rounded-xl p-4 ${
              failedWebhooks > 0
                ? "bg-red-50 dark:bg-red-950"
                : "bg-neutral-50 dark:bg-neutral-900"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                failedWebhooks > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-neutral-900 dark:text-neutral-100"
              }`}
            >
              {failedWebhooks}
            </div>
            <div className="text-sm text-neutral-500">Failed Webhooks</div>
          </div>
          <div
            className={`rounded-xl p-4 ${
              recentSecurityEvents > 10
                ? "bg-amber-50 dark:bg-amber-950"
                : "bg-neutral-50 dark:bg-neutral-900"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                recentSecurityEvents > 10
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-neutral-900 dark:text-neutral-100"
              }`}
            >
              {recentSecurityEvents}
            </div>
            <div className="text-sm text-neutral-500">Failed Auth (24h)</div>
          </div>
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
          Overview of your platform metrics and KPIs
        </p>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* System Health */}
      <Suspense
        fallback={
          <Card className="rounded-2xl animate-pulse h-32 bg-neutral-100 dark:bg-neutral-900" />
        }
      >
        <SystemHealth />
      </Suspense>

      {/* Recent Activity */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card
                key={i}
                className="rounded-2xl animate-pulse h-80 bg-neutral-100 dark:bg-neutral-900"
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
