"use client";

import { BarChart3 } from "lucide-react";

export default function ProjectUsageBillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">Usage & Billing</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Track usage metrics and costs for enabled services and integrations
        </p>
      </div>

      {/* Coming Soon Message */}
      <div className="p-8 rounded-xl border border-dashed text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Usage & Billing Tracking</h3>
        <p className="text-sm text-muted-foreground">
          Detailed usage metrics and cost tracking will be available soon.
        </p>
      </div>
    </div>
  );
}
