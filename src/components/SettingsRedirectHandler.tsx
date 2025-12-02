"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { parseSettingsParams } from "@/lib/url-params";

/**
 * URL Query Parameter Handler for Settings Page Redirect
 *
 * Redirects to settings pages based on URL parameters:
 * - ?settings=general - Redirect to /settings
 * - ?settings=billing - Redirect to /settings/billing
 * - ?settings=usage - Redirect to /settings/usage
 * - ?settings=account - Redirect to /settings/account
 * - ?settings=integrations - Redirect to /settings/integrations
 * - ?settings=personalization - Redirect to /settings/personalization
 * - ?settings=model-preferences - Redirect to /settings/models
 */
export default function SettingsRedirectHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (hasProcessed) return;

    const params = parseSettingsParams(searchParams);
    if (params?.tab) {
      setHasProcessed(true);
      // Map tab names to paths
      const tabToPath: Record<string, string> = {
        general: "/settings",
        billing: "/settings/billing",
        usage: "/settings/usage",
        account: "/settings/account",
        integrations: "/settings/integrations",
        personalization: "/settings/personalization",
        "model-preferences": "/settings/models",
      };
      const targetPath = tabToPath[params.tab] || "/settings";
      router.push(targetPath);
    }
  }, [searchParams, hasProcessed, router]);

  return null;
}
