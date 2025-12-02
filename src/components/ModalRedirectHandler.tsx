"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FeedbackModal from "./FeedbackModal";
import { parseModalType } from "@/lib/url-params";

/**
 * Professional URL Query Parameter Handler for Non-Settings Modals
 *
 * Handles opening modals or redirecting based on URL parameters:
 * - ?modal=projects - Redirect to /projects page
 * - ?modal=feedback - Open feedback modal
 *
 * Settings are handled separately by SettingsRedirectHandler
 */
export default function ModalRedirectHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [modalType, setModalType] = useState<"feedback" | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Skip if already processed
    if (hasProcessed) {
      return;
    }

    // Parse modal type
    const type = parseModalType(searchParams);

    // Redirect projects to /projects page
    if (type === "projects") {
      setHasProcessed(true);
      // Preserve sort and search params
      const sort = searchParams.get("sort");
      const search = searchParams.get("search");
      const params = new URLSearchParams();
      if (sort) params.set("sort", sort);
      if (search) params.set("search", search);
      const queryString = params.toString();
      router.push(`/projects${queryString ? `?${queryString}` : ""}`);
    } else if (type === "feedback") {
      setModalType("feedback");
      setHasProcessed(true);
    }
  }, [searchParams, hasProcessed, router]);

  const handleClose = () => {
    setModalType(null);
    setHasProcessed(false);
  };

  if (!modalType) {
    return null;
  }

  return (
    <>
      {modalType === "feedback" && (
        <FeedbackModal isOpen={true} onClose={handleClose} />
      )}
    </>
  );
}
