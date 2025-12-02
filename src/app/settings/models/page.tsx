"use client";

import ModelPreferencesTab from "@/components/settings/ModelPreferencesTab";

export default function ModelsSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">AI Models</h2>
      </div>
      <ModelPreferencesTab />
    </div>
  );
}
