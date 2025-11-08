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

export interface SubscriptionData {
    plan: {
        name: string;
        displayName: string;
        priceMonthlyUsd: number;
        maxProjects: number | null;
        monthlyCredits: number | null;
        features: Record<string, unknown>;
    };
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    monthly?: {
        limit: number;
        used: number;
        remaining: number;
        periodEnd: Date;
        daysUntilReset: number;
    };
}

export interface CreditBalanceData {
    monthly: {
        limit: number;
        used: number;
        remaining: number;
        periodEnd: Date;
        daysUntilReset: number;
    };
    plan: {
        name: string;
        displayName: string;
        monthlyCredits: number | null;
    };
}

export interface SubscriptionHistoryData {
    currentSubscription: {
        id: string;
        planName: string;
        planDisplayName: string;
        status: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        cancelledAt: Date | null;
        createdAt: Date;
        priceMonthlyUsd: number;
    } | null;
    usageRecords: Array<{
        id: string;
        billingPeriodStart: Date;
        billingPeriodEnd: Date;
        aiCreditsUsed: number;
        aiCostUsd: number;
        totalCostUsd: number;
        createdAt: Date;
    }>;
    invoices: Array<{
        id: string;
        invoiceNumber: string;
        status: string;
        billingPeriodStart: Date;
        billingPeriodEnd: Date;
        subscriptionFeeUsd: number;
        aiUsageCostUsd: number;
        totalUsd: number;
        paidAt: Date | null;
        createdAt: Date;
    }>;
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
    isAutoTriggeringCheckout: boolean;
    subscriptionData: SubscriptionData | null;
    creditBalanceData: CreditBalanceData | null;
    subscriptionHistory: SubscriptionHistoryData | null;
    selectedProTierIndex: number;
    setSelectedProTierIndex: (index: number) => void;
    isPurchasing: boolean;
    updateUrlParams: (params: Record<string, unknown>) => void;
    handleOpenEmbeddedCheckout: (monthlyCredits: number) => Promise<void>;
    fetchBillingData: () => void;
}

export type SettingsTab =
    | "general"
    | "billing"
    | "usage"
    | "account"
    | "integrations"
    | "personalization"
    | "referrals";
