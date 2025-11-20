import type { SettingsOption } from "@/lib/url-params";

export interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?:
    | "general"
    | "billing"
    | "usage"
    | "account"
    | "integrations"
    | "personalization"
    | "referrals";
    initialOption?: SettingsOption;
    initialProTierIndex?: number;
    autoTriggerCheckout?: boolean;
    initialModel?: string;
    initialProject?: string;
    initialEndpoint?: string;
    initialPage?: number;
}

export interface ExtendedUser {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
}

export interface CreditUsageRecord {
    id: string;
    projectId: string;
    projectName: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    creditsUsed: number;
    callType: "agent" | "chat" | "edit";
    endpoint: string;
    createdAt: string;
}

export interface CreditUsageData {
    records: CreditUsageRecord[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
    };
    filters: {
        projects: Array<{ id: string; name: string }>;
        endpoints: string[];
    };
}

export interface ReferralData {
    referralCode: string;
    referrals: Array<{
        id: string;
        email: string | null;
        name: string | null;
        createdAt: string;
    }>;
    totalReferrals: number;
    totalCreditsEarned: number;
    currentMonthlyCredits: number;
}

export interface BillingTabProps {
    isLoadingBilling: boolean;
    isPurchasing: boolean;
    updateUrlParams: (params: Record<string, unknown>) => void;
}

export type SettingsTab =
    | "general"
    | "billing"
    | "usage"
    | "account"
    | "integrations"
    | "personalization"
    | "referrals";
