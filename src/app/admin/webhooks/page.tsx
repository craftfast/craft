/**
 * Admin Webhook Monitoring Page
 *
 * /admin/webhooks - View webhook queue statistics and manage failed webhooks
 * Auth is handled by admin layout
 */

import WebhookMonitoringDashboard from "@/components/admin/WebhookMonitoringDashboard";

export default function AdminWebhooksPage() {
  return <WebhookMonitoringDashboard />;
}
