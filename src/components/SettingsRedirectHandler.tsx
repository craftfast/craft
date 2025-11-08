"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SettingsModal from "./SettingsModal";
import {
  parseSettingsParams,
  cleanSettingsParams,
  type SettingsTab,
  type SettingsOption,
} from "@/lib/url-params";

interface SettingsRedirectHandlerProps {
  currentPlan: string;
}

/**
 * Professional URL Query Parameter Handler for Settings Modal
 *
 * Supports deep-linking to specific settings with query parameters:
 * - ?settings=billing&tier=1 - Open billing with tier pre-selected
 * - ?settings=personalization&option=models&model=claude-opus-4 - Open model preferences with specific model
 * - ?settings=usage&project=abc123 - Open usage filtered by project
 * - ?settings=account&option=two-factor - Open two-factor settings
 *
 * And many more combinations for professional navigation experience
 */
export default function SettingsRedirectHandler({
  currentPlan,
}: SettingsRedirectHandlerProps) {
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [initialTab, setInitialTab] = useState<SettingsTab>("general");
  const [initialOption, setInitialOption] = useState<
    SettingsOption | undefined
  >();
  const [initialProTierIndex, setInitialProTierIndex] = useState<number>(0);
  const [autoTriggerCheckout, setAutoTriggerCheckout] = useState(false);
  const [initialModel, setInitialModel] = useState<string | undefined>();
  const [initialProject, setInitialProject] = useState<string | undefined>();
  const [initialEndpoint, setInitialEndpoint] = useState<string | undefined>();
  const [initialPage, setInitialPage] = useState<number | undefined>();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Skip if already processed
    if (hasProcessed) {
      return;
    }

    // Parse all settings parameters
    const params = parseSettingsParams(searchParams);

    if (!params) {
      return; // No settings parameter found
    }

    console.log("SettingsRedirectHandler - Parsed params:", params);

    // Configure modal based on parameters
    setInitialTab(params.tab || "general");
    setInitialOption(params.option);
    setInitialProTierIndex(params.tier ?? 0);
    setAutoTriggerCheckout(params.checkout ?? false);
    setInitialModel(params.model);
    setInitialProject(params.project);
    setInitialEndpoint(params.endpoint);
    setInitialPage(params.page);

    setShowModal(true);
    setHasProcessed(true);

    // Don't clean URL here - let the modal handle it on close
  }, [searchParams, hasProcessed]);

  if (!showModal) {
    return null;
  }

  return (
    <SettingsModal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
        // Reset all state
        setInitialTab("general");
        setInitialOption(undefined);
        setInitialProTierIndex(0);
        setAutoTriggerCheckout(false);
        setInitialModel(undefined);
        setInitialProject(undefined);
        setInitialEndpoint(undefined);
        setInitialPage(undefined);
      }}
      initialTab={initialTab}
      initialOption={initialOption}
      initialProTierIndex={initialProTierIndex}
      autoTriggerCheckout={autoTriggerCheckout}
      initialModel={initialModel}
      initialProject={initialProject}
      initialEndpoint={initialEndpoint}
      initialPage={initialPage}
    />
  );
}
