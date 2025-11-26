"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SettingsModal from "./SettingsModal";
import { parseSettingsParams } from "@/lib/url-params";

type SettingsTab =
  | "general"
  | "billing"
  | "usage"
  | "account"
  | "integrations"
  | "personalization"
  | "model-preferences";

/**
 * URL Query Parameter Handler for Settings Modal
 *
 * Handles opening settings modal based on URL parameters:
 * - ?settings=general - Open settings with General tab
 * - ?settings=billing - Open settings with Billing tab
 * - ?settings=usage - Open settings with Usage tab
 * - ?settings=account - Open settings with Account tab
 * - ?settings=integrations - Open settings with Integrations tab
 * - ?settings=personalization - Open settings with Personalization tab
 * - ?settings=model-preferences - Open settings with Model Preferences tab
 */
export default function SettingsRedirectHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (hasProcessed) return;

    const params = parseSettingsParams(searchParams);
    if (params?.tab) {
      setSettingsTab(params.tab as SettingsTab);
      setHasProcessed(true);
    }
  }, [searchParams, hasProcessed]);

  const handleClose = () => {
    setSettingsTab(null);
    setHasProcessed(false);
    // Clean up URL params
    const url = new URL(window.location.href);
    url.searchParams.delete("settings");
    router.replace(url.pathname + url.search);
  };

  if (!settingsTab) {
    return null;
  }

  return (
    <SettingsModal
      isOpen={true}
      onClose={handleClose}
      initialTab={settingsTab}
    />
  );
}
