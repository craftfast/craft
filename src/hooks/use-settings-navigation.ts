/**
 * Hook: useModalNavigation
 * Professional navigation helper for opening modals with specific configurations
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
    settingsNavigation,
    buildProjectsUrl,
    buildFeedbackUrl,
    type SettingsQueryParams,
    type ProjectsQueryParams
} from "@/lib/url-params";

export function useModalNavigation() {
    const router = useRouter();

    /**
     * Navigate to projects modal
     */
    const openProjects = useCallback((params: ProjectsQueryParams = {}) => {
        const url = buildProjectsUrl("/", params);
        router.push(url);
    }, [router]);

    /**
     * Navigate to feedback modal
     */
    const openFeedback = useCallback(() => {
        const url = buildFeedbackUrl("/");
        router.push(url);
    }, [router]);

    return {
        openProjects,
        openFeedback,
    };
}

/**
 * Hook: useSettingsNavigation
 * Professional navigation helper for opening settings with specific configurations
 */
export function useSettingsNavigation() {
    const router = useRouter();
    const modalNav = useModalNavigation();

    /**
     * Navigate to settings with custom parameters
     */
    const navigateToSettings = useCallback(
        (params: SettingsQueryParams) => {
            const url = settingsNavigation.general();
            // Build custom URL based on params
            const urlObj = new URL(url, window.location.origin);

            if (params.tab) {
                urlObj.searchParams.set("settings", params.tab);
            }
            if (params.option) {
                urlObj.searchParams.set("option", params.option);
            }
            if (params.tier !== undefined) {
                urlObj.searchParams.set("tier", params.tier.toString());
            }
            if (params.checkout) {
                urlObj.searchParams.set("checkout", "true");
            }
            if (params.model) {
                urlObj.searchParams.set("model", params.model);
            }
            if (params.project) {
                urlObj.searchParams.set("project", params.project);
            }
            if (params.endpoint) {
                urlObj.searchParams.set("endpoint", params.endpoint);
            }
            if (params.startDate) {
                urlObj.searchParams.set("startDate", params.startDate);
            }
            if (params.endDate) {
                urlObj.searchParams.set("endDate", params.endDate);
            }
            if (params.page) {
                urlObj.searchParams.set("page", params.page.toString());
            }

            router.push(urlObj.pathname + urlObj.search);
        },
        [router]
    );

    /**
     * Quick navigation functions
     */
    const openGeneral = useCallback(() => {
        router.push(settingsNavigation.general());
    }, [router]);

    const openProfile = useCallback(() => {
        router.push(settingsNavigation.profile());
    }, [router]);

    const openPassword = useCallback(() => {
        router.push(settingsNavigation.password());
    }, [router]);

    const openTheme = useCallback(() => {
        router.push(settingsNavigation.theme());
    }, [router]);

    const openModels = useCallback((modelId?: string) => {
        router.push(settingsNavigation.models(modelId));
    }, [router]);

    const openBilling = useCallback(() => {
        router.push(settingsNavigation.billing());
    }, [router]);

    const openBillingWithTier = useCallback((tierIndex: number) => {
        router.push(settingsNavigation.billingWithTier(tierIndex));
    }, [router]);

    const openCheckout = useCallback((tierIndex: number) => {
        router.push(settingsNavigation.checkout(tierIndex));
    }, [router]);

    const openUsage = useCallback(() => {
        router.push(settingsNavigation.usage());
    }, [router]);

    const openUsageByProject = useCallback((projectId: string) => {
        router.push(settingsNavigation.usageByProject(projectId));
    }, [router]);

    const openUsageByEndpoint = useCallback((endpoint: string) => {
        router.push(settingsNavigation.usageByEndpoint(endpoint));
    }, [router]);

    const openAccount = useCallback(() => {
        router.push(settingsNavigation.account());
    }, [router]);

    const openTwoFactor = useCallback(() => {
        router.push(settingsNavigation.twoFactor());
    }, [router]);

    const openIntegrations = useCallback(() => {
        router.push(settingsNavigation.integrations());
    }, [router]);

    const openIntegration = useCallback(
        (provider: "github" | "vercel" | "netlify") => {
            router.push(settingsNavigation.integration(provider));
        },
        [router]
    );

    return {
        // Main navigation function
        navigateToSettings,

        // Settings shortcuts
        openGeneral,
        openProfile,
        openPassword,
        openTheme,
        openModels,
        openBilling,
        openBillingWithTier,
        openCheckout,
        openUsage,
        openUsageByProject,
        openUsageByEndpoint,
        openAccount,
        openTwoFactor,
        openIntegrations,
        openIntegration,

        // Other modals
        ...modalNav,
    };
}
