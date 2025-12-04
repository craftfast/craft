"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to the new standalone integrations page
export default function IntegrationsSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/integrations");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
    </div>
  );
}
