"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SettingsModal from "./SettingsModal";

interface SettingsRedirectHandlerProps {
  currentPlan: string;
}

/**
 * Handles the settings modal redirect from pricing page
 * Shows settings modal with billing tab and selected tier when settings parameter is present
 */
export default function SettingsRedirectHandler({
  currentPlan,
}: SettingsRedirectHandlerProps) {
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [initialProTierIndex, setInitialProTierIndex] = useState<number | null>(
    null
  );
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Skip if already processed
    if (hasProcessed) {
      return;
    }

    const settingsParam = searchParams.get("settings");
    const tierParam = searchParams.get("tier");

    console.log(
      "SettingsRedirectHandler - settingsParam:",
      settingsParam,
      "tierParam:",
      tierParam
    );

    // Only show modal if settings parameter exists and it's 'billing'
    if (settingsParam === "billing") {
      // Parse tier index, default to 0 if not provided or invalid
      const tierIndex = tierParam ? parseInt(tierParam, 10) : 0;
      const validTierIndex = isNaN(tierIndex) ? 0 : tierIndex;

      console.log(
        "SettingsRedirectHandler - Setting tier index to:",
        validTierIndex
      );

      // Set tier index first, then show modal
      setInitialProTierIndex(validTierIndex);
      setShowModal(true);
      setHasProcessed(true);

      // Clean up URL by removing the settings and tier parameters after reading them
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("settings");
      newUrl.searchParams.delete("tier");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams, hasProcessed]);

  // Only render modal when we have a valid tier index
  if (!showModal || initialProTierIndex === null) {
    return null;
  }

  return (
    <SettingsModal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
        setInitialProTierIndex(null);
      }}
      initialTab="billing"
      initialProTierIndex={initialProTierIndex}
      autoTriggerCheckout={true} // Auto-trigger checkout when coming from pricing page
    />
  );
}
