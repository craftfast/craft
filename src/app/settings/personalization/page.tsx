"use client";

import { PersonalizationTab } from "@/components/settings";

export default function PersonalizationSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">Personalization</h2>
      </div>
      <PersonalizationTab />
    </div>
  );
}
