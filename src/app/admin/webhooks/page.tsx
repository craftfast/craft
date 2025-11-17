/**
 * Admin Webhook Monitoring Page
 *
 * /admin/webhooks - View webhook queue statistics and manage failed webhooks
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import WebhookMonitoringDashboard from "@/components/admin/WebhookMonitoringDashboard";

export default async function AdminWebhooksPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // TODO: Add admin role check
  // For now, any authenticated user can view (should be admin-only in production)

  return <WebhookMonitoringDashboard />;
}
