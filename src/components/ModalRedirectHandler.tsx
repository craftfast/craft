"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProjectsModal from "./ProjectsModal";
import FeedbackModal from "./FeedbackModal";
import { parseModalType } from "@/lib/url-params";

/**
 * Professional URL Query Parameter Handler for Non-Settings Modals
 *
 * Handles opening modals based on URL parameters:
 * - ?modal=projects&view=grid&sort=recent - Open projects modal with grid view sorted by recent
 * - ?modal=projects&view=list&sort=name&search=test - Open projects modal with list view, sorted by name, filtered by search
 * - ?modal=feedback - Open feedback modal
 *
 * Settings modal is handled separately by SettingsRedirectHandler due to its complexity
 */
export default function ModalRedirectHandler() {
  const searchParams = useSearchParams();
  const [modalType, setModalType] = useState<"projects" | "feedback" | null>(
    null
  );
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Skip if already processed
    if (hasProcessed) {
      return;
    }

    // Parse modal type
    const type = parseModalType(searchParams);

    // Only handle projects and feedback modals (settings handled separately)
    if (type === "projects") {
      setModalType("projects");
      setHasProcessed(true);
    } else if (type === "feedback") {
      setModalType("feedback");
      setHasProcessed(true);
    }
  }, [searchParams, hasProcessed]);

  const handleClose = () => {
    setModalType(null);
    setHasProcessed(false);
  };

  if (!modalType) {
    return null;
  }

  return (
    <>
      {modalType === "projects" && (
        <ProjectsModal isOpen={true} onClose={handleClose} />
      )}
      {modalType === "feedback" && (
        <FeedbackModal isOpen={true} onClose={handleClose} />
      )}
    </>
  );
}
