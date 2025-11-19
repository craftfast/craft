/**
 * URL Query Parameter Management Utility
 * Professional system for handling deep-linking and navigation with query parameters
 */

// Modal types
export type ModalType = "settings" | "projects" | "feedback" | "pricing";

// Projects modal options
export type ProjectsViewMode = "grid" | "list";
export type ProjectsSortOption = "recent" | "name" | "oldest";

export type SettingsTab =
    | "general"
    | "personalization"
    | "billing"
    | "usage"
    | "account"
    | "integrations";

export type SettingsOption =
    | "profile"
    | "password"
    | "theme"
    | "chat-position"
    | "models"
    | "credits"
    | "history"
    | "project-filter"
    | "endpoint-filter"
    | "date-filter"
    | "two-factor"
    | "sessions"
    | "delete-account"
    | "github"
    | "vercel"
    | "netlify";

export interface SettingsQueryParams {
    /** Which settings tab to open */
    tab?: SettingsTab;
    /** Specific option/section within the tab */
    option?: SettingsOption;
    /** For billing tab: which tier to pre-select (0-2) */
    tier?: number;
    /** For billing tab: auto-trigger checkout */
    checkout?: boolean;
    /** For models: pre-select a specific model */
    model?: string;
    /** For usage: filter by project ID */
    project?: string;
    /** For usage: filter by endpoint */
    endpoint?: string;
    /** For usage: start date filter (ISO string) */
    startDate?: string;
    /** For usage: end date filter (ISO string) */
    endDate?: string;
    /** For usage: page number */
    page?: number;
}

/**
 * Build URL with settings query parameters
 */
export function buildSettingsUrl(
    baseUrl: string,
    params: SettingsQueryParams
): string {
    const url = new URL(baseUrl, window.location.origin);

    // Add tab parameter
    if (params.tab) {
        url.searchParams.set("settings", params.tab);
    }

    // Add option parameter
    if (params.option) {
        url.searchParams.set("option", params.option);
    }

    // Add tier parameter for billing
    if (params.tier !== undefined) {
        url.searchParams.set("tier", params.tier.toString());
    }

    // Add checkout trigger
    if (params.checkout) {
        url.searchParams.set("checkout", "true");
    }

    // Add model parameter
    if (params.model) {
        url.searchParams.set("model", params.model);
    }

    // Add usage filters
    if (params.project) {
        url.searchParams.set("project", params.project);
    }
    if (params.endpoint) {
        url.searchParams.set("endpoint", params.endpoint);
    }
    if (params.startDate) {
        url.searchParams.set("startDate", params.startDate);
    }
    if (params.endDate) {
        url.searchParams.set("endDate", params.endDate);
    }
    if (params.page) {
        url.searchParams.set("page", params.page.toString());
    }

    return url.toString();
}

/**
 * Parse settings query parameters from URLSearchParams
 */
export function parseSettingsParams(
    searchParams: URLSearchParams
): SettingsQueryParams | null {
    const settingsParam = searchParams.get("settings");
    if (!settingsParam) return null;

    const params: SettingsQueryParams = {
        tab: settingsParam as SettingsTab,
    };

    // Parse option
    const option = searchParams.get("option");
    if (option) {
        params.option = option as SettingsOption;
    }

    // Parse tier
    const tier = searchParams.get("tier");
    if (tier) {
        const parsed = parseInt(tier, 10);
        if (!isNaN(parsed)) {
            params.tier = parsed;
        }
    }

    // Parse checkout trigger
    const checkout = searchParams.get("checkout");
    if (checkout === "true") {
        params.checkout = true;
    }

    // Parse model
    const model = searchParams.get("model");
    if (model) {
        params.model = model;
    }

    // Parse usage filters
    const project = searchParams.get("project");
    if (project) {
        params.project = project;
    }

    const endpoint = searchParams.get("endpoint");
    if (endpoint) {
        params.endpoint = endpoint;
    }

    const startDate = searchParams.get("startDate");
    if (startDate) {
        params.startDate = startDate;
    }

    const endDate = searchParams.get("endDate");
    if (endDate) {
        params.endDate = endDate;
    }

    const page = searchParams.get("page");
    if (page) {
        const parsed = parseInt(page, 10);
        if (!isNaN(parsed)) {
            params.page = parsed;
        }
    }

    return params;
}

/**
 * Projects Modal Query Parameters
 */
export interface ProjectsQueryParams {
    view?: ProjectsViewMode;
    sort?: ProjectsSortOption;
    search?: string;
}

/**
 * Build URL with projects query parameters
 */
export function buildProjectsUrl(baseUrl: string, params: ProjectsQueryParams = {}): string {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set("modal", "projects");

    if (params.view) {
        url.searchParams.set("view", params.view);
    }
    if (params.sort) {
        url.searchParams.set("sort", params.sort);
    }
    if (params.search) {
        url.searchParams.set("search", params.search);
    }

    return url.toString();
}

/**
 * Parse projects query parameters from URLSearchParams
 */
export function parseProjectsParams(searchParams: URLSearchParams): ProjectsQueryParams | null {
    const modal = searchParams.get("modal");
    if (modal !== "projects") return null;

    const params: ProjectsQueryParams = {};

    const view = searchParams.get("view");
    if (view && (view === "grid" || view === "list")) {
        params.view = view;
    }

    const sort = searchParams.get("sort");
    if (sort && (sort === "recent" || sort === "name" || sort === "oldest")) {
        params.sort = sort;
    }

    const search = searchParams.get("search");
    if (search) {
        params.search = search;
    }

    return params;
}

/**
 * Build URL with feedback modal
 */
export function buildFeedbackUrl(baseUrl: string): string {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set("modal", "feedback");
    return url.toString();
}

/**
 * Parse modal type from URLSearchParams
 */
export function parseModalType(searchParams: URLSearchParams): ModalType | null {
    const settingsModal = searchParams.get("settings");
    if (settingsModal) return "settings";

    const modal = searchParams.get("modal");
    if (modal === "projects") return "projects";
    if (modal === "feedback") return "feedback";
    if (modal === "pricing") return "pricing";

    return null;
}

/**
 * Clean up all modal query parameters from URL
 */
export function cleanModalParams(): void {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const paramsToRemove = [
        // Settings params
        "settings",
        "option",
        "tier",
        "checkout",
        "model",
        "project",
        "endpoint",
        "startDate",
        "endDate",
        "page",
        // General modal params
        "modal",
        "view",
        "sort",
        "search",
    ];

    let hasChanges = false;
    paramsToRemove.forEach((param) => {
        if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
            hasChanges = true;
        }
    });

    if (hasChanges) {
        window.history.replaceState({}, "", url.toString());
    }
}

/**
 * Clean up settings query parameters from URL
 * @deprecated Use cleanModalParams() instead for broader support
 */
export function cleanSettingsParams(): void {
    cleanModalParams();
}

/**
 * Navigate to settings with specific parameters
 */
export function navigateToSettings(params: SettingsQueryParams): string {
    return buildSettingsUrl("/", params);
}

/**
 * Quick helper functions for common navigation scenarios
 */
export const settingsNavigation = {
    /** Open settings to general tab */
    general: () => navigateToSettings({ tab: "general" }),

    /** Open settings to profile */
    profile: () => navigateToSettings({ tab: "general", option: "profile" }),

    /** Open settings to password */
    password: () => navigateToSettings({ tab: "account", option: "password" }),

    /** Open settings to theme preferences */
    theme: () =>
        navigateToSettings({ tab: "personalization", option: "theme" }),

    /** Open settings to model preferences with optional pre-selected model */
    models: (modelId?: string) =>
        navigateToSettings({
            tab: "personalization",
            option: "models",
            model: modelId,
        }),

    /** Open settings to billing */
    billing: () => navigateToSettings({ tab: "billing" }),

    /** Open settings to billing with specific tier */
    billingWithTier: (tierIndex: number) =>
        navigateToSettings({ tab: "billing", tier: tierIndex }),

    /** Open settings to billing and trigger checkout */
    checkout: (tierIndex: number) =>
        navigateToSettings({ tab: "billing", tier: tierIndex, checkout: true }),

    /** Open settings to usage */
    usage: () => navigateToSettings({ tab: "usage" }),

    /** Open settings to usage with project filter */
    usageByProject: (projectId: string) =>
        navigateToSettings({ tab: "usage", project: projectId }),

    /** Open settings to usage with endpoint filter */
    usageByEndpoint: (endpoint: string) =>
        navigateToSettings({ tab: "usage", endpoint }),

    /** Open settings to account */
    account: () => navigateToSettings({ tab: "account" }),

    /** Open settings to two-factor authentication */
    twoFactor: () =>
        navigateToSettings({ tab: "account", option: "two-factor" }),

    /** Open settings to integrations */
    integrations: () => navigateToSettings({ tab: "integrations" }),

    /** Open settings to specific integration */
    integration: (provider: "github" | "vercel" | "netlify") =>
        navigateToSettings({ tab: "integrations", option: provider }),
};
