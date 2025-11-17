"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SettingsModal from "./SettingsModal";

interface PlanRedirectHandlerProps {
  currentPlan: string;
}

/**
 * Handles the plan selection flow when users are redirected from pricing page
 * Shows settings modal with billing tab if a plan parameter is present in the URL
 */
export default function PlanRedirectHandler({
  currentPlan,
}: PlanRedirectHandlerProps) {
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

    const planParam = searchParams.get("plan");
    const tierParam = searchParams.get("tier");

    console.log(
      "PlanRedirectHandler - planParam:",
      planParam,
      "tierParam:",
      tierParam
    );

    // Only show modal if plan parameter exists and it's Pro
    if (planParam) {
      const uppercasePlan = planParam.toUpperCase();

      if (uppercasePlan === "PRO") {
        // Parse tier index, default to 0 if not provided or invalid
        const tierIndex = tierParam ? parseInt(tierParam, 10) : 0;
        const validTierIndex = isNaN(tierIndex) ? 0 : tierIndex;

        console.log(
          "PlanRedirectHandler - Setting tier index to:",
          validTierIndex
        );

        // Set tier index first, then show modal
        setInitialProTierIndex(validTierIndex);
        setShowModal(true);
        setHasProcessed(true);

        // Clean up URL by removing the plan and tier parameters after reading them
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("plan");
        newUrl.searchParams.delete("tier");
        window.history.replaceState({}, "", newUrl.toString());
      }
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
    />
  );
}
