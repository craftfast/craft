"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SubscriptionModal from "./SubscriptionModal";

interface PlanRedirectHandlerProps {
  currentPlan: string;
}

/**
 * Handles the plan selection flow when users are redirected from pricing page
 * Shows subscription modal if a plan parameter is present in the URL
 */
export default function PlanRedirectHandler({
  currentPlan,
}: PlanRedirectHandlerProps) {
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState<"PRO" | "AGENT" | null>(null);

  useEffect(() => {
    const planParam = searchParams.get("plan");

    // Only show modal if plan parameter exists and it's not hobby
    // (hobby doesn't need subscription modal)
    if (planParam) {
      const uppercasePlan = planParam.toUpperCase();

      if (uppercasePlan === "PRO" || uppercasePlan === "AGENT") {
        setTargetPlan(uppercasePlan as "PRO" | "AGENT");
        setShowModal(true);

        // Clean up URL by removing the plan parameter after reading it
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("plan");
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
  }, [searchParams]);

  return (
    <SubscriptionModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      currentPlan={currentPlan}
      targetPlan={targetPlan || undefined}
    />
  );
}
