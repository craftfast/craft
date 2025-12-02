"use client";

import { BillingTab } from "@/components/settings";

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">Balance & Billing</h2>
      </div>
      <BillingTab />
    </div>
  );
}
