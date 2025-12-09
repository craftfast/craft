/**
 * Types for Settings components
 */

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
