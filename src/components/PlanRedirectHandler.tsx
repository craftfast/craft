"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CustomCheckoutModal from "./CustomCheckoutModal";

/**
 * URL Query Parameter Handler for Plan/Credits Modals
 *
 * Handles opening modals based on URL parameters:
 * - ?plan=credits - Open add credits modal
 * - ?plan=upgrade - Redirect to pricing (future use)
 */
export default function PlanRedirectHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (hasProcessed) return;

    const plan = searchParams.get("plan");

    if (plan === "credits") {
      setShowCreditsModal(true);
      setHasProcessed(true);
    } else if (plan === "upgrade") {
      // Redirect to pricing page
      router.push("/pricing");
      setHasProcessed(true);
    }
  }, [searchParams, hasProcessed, router]);

  const handleClose = () => {
    setShowCreditsModal(false);
    setHasProcessed(false);
    // Clean up URL params
    const url = new URL(window.location.href);
    url.searchParams.delete("plan");
    router.replace(url.pathname + url.search);
  };

  if (!showCreditsModal) {
    return null;
  }

  return (
    <CustomCheckoutModal
      isOpen={showCreditsModal}
      onClose={handleClose}
      onSuccess={handleClose}
    />
  );
}
