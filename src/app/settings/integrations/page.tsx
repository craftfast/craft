"use client";

import { IntegrationsTab } from "@/components/settings";

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">Integrations</h2>
      </div>
      <IntegrationsTab />
    </div>
  );
}
