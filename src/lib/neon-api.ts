/**
 * Neon API Client
 * Seamless database provisioning for Craft projects using Neon's AI Agent Plan
 * 
 * Documentation:
 * - API Reference: https://neon.com/docs/reference/api-reference
 * - Claimable Databases: https://neon.com/docs/workflows/claimable-database-integration
 * - Database Versioning: https://neon.com/docs/ai/ai-database-versioning
 * - Consumption Metrics: https://neon.com/docs/guides/consumption-metrics
 */

const NEON_API_BASE = "https://console.neon.tech/api/v2";

// ============================================================================
// TYPES
// ============================================================================

export interface NeonProject {
    id: string;
    name: string;
    region_id: string;
    pg_version: number;
    owner_id: string;
    org_id?: string;
}

export interface NeonConnectionUri {
    connection_uri: string;
    connection_parameters?: {
        database: string;
        host: string;
        password: string;
        role: string;
        uri: string;
    };
}

export interface NeonCreateProjectResponse {
    project: NeonProject;
    connection_uris: NeonConnectionUri[];
    branch: {
        id: string;
        name: string;
        project_id: string;
    };
    databases: Array<{
        id: number;
        name: string;
        owner_name: string;
    }>;
    endpoints: Array<{
        id: string;
        host: string;
        region_id: string;
    }>;
    roles: Array<{
        name: string;
        password: string;
    }>;
}

export interface NeonTransferRequest {
    id: string;
    project_id: string;
    created_at: string;
    expires_at: string;
}

export interface NeonBranch {
    id: string;
    name: string;
    project_id: string;
    parent_id?: string;
    created_at: string;
}

export interface NeonConsumptionMetrics {
    from: string;
    to: string;
    total_usage: {
        compute_time_seconds: number;
        active_time_seconds: number;
        written_data_bytes: number;
        data_transfer_bytes: number;
        data_storage_bytes_hour: number;
    };
    projects?: Array<{
        project_id: string;
        compute_time_seconds: number;
        active_time_seconds: number;
        written_data_bytes: number;
        data_transfer_bytes: number;
        data_storage_bytes_hour: number;
    }>;
}

// ============================================================================
// NEON API CLIENT
// ============================================================================

export class NeonAPI {
    private apiKey: string;
    private orgId?: string;

    constructor(apiKey?: string, orgId?: string) {
        this.apiKey = apiKey || process.env.NEON_API_KEY || "";
        this.orgId = orgId;

        if (!this.apiKey) {
            throw new Error("NEON_API_KEY environment variable is required");
        }
    }

    /**
     * Set organization ID for subsequent requests
     * Useful for multi-org setups (free tier vs pro tier)
     */
    setOrgId(orgId: string) {
        this.orgId = orgId;
    }

    /**
     * Make authenticated request to Neon API
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${NEON_API_BASE}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(
                `Neon API error (${response.status}): ${error}`
            );
        }

        return response.json();
    }

    // ========================================================================
    // PROJECT MANAGEMENT
    // ========================================================================

    /**
     * Create a new Neon project for a user
     * 
     * @param projectName - Name of the project (defaults to project ID if not specified)
     * @param region - AWS region (default: us-east-2 for low latency)
     * @param pgVersion - PostgreSQL version (default: 17)
     * @returns Created project with connection details
     */
    async createProject(
        projectName: string,
        region: string = "aws-us-east-2",
        pgVersion: number = 17
    ): Promise<NeonCreateProjectResponse> {
        const payload: Record<string, unknown> = {
            project: {
                name: projectName,
                region_id: region,
                pg_version: pgVersion,
            },
        };

        // Add organization ID if available (required for AI Agent plan)
        if (this.orgId) {
            (payload.project as Record<string, unknown>).org_id = this.orgId;
        }

        return this.request<NeonCreateProjectResponse>("/projects", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }

    /**
     * Get project details
     */
    async getProject(projectId: string): Promise<{ project: NeonProject }> {
        return this.request<{ project: NeonProject }>(
            `/projects/${projectId}`
        );
    }

    /**
     * Delete a project (cleanup)
     */
    async deleteProject(projectId: string): Promise<{ project: NeonProject }> {
        return this.request<{ project: NeonProject }>(
            `/projects/${projectId}`,
            {
                method: "DELETE",
            }
        );
    }

    // ========================================================================
    // PROJECT TRANSFER (CLAIMABLE DATABASES)
    // ========================================================================

    /**
     * Create a transfer request for project claiming
     * 
     * @param projectId - Neon project ID
     * @param ttlSeconds - Time to live in seconds (default: 7 days)
     * @returns Transfer request details
     */
    async createTransferRequest(
        projectId: string,
        ttlSeconds: number = 604800 // 7 days default
    ): Promise<NeonTransferRequest> {
        return this.request<NeonTransferRequest>(
            `/projects/${projectId}/transfer_requests`,
            {
                method: "POST",
                body: JSON.stringify({ ttl_seconds: ttlSeconds }),
            }
        );
    }

    /**
     * Generate claim URL for user to take ownership
     * 
     * @param projectId - Neon project ID
     * @param transferRequestId - Transfer request ID
     * @param redirectUrl - Optional URL to redirect after claiming
     * @returns Claim URL
     */
    generateClaimUrl(
        projectId: string,
        transferRequestId: string,
        redirectUrl?: string
    ): string {
        let url = `https://console.neon.tech/app/claim?p=${projectId}&tr=${transferRequestId}`;

        if (redirectUrl) {
            url += `&ru=${encodeURIComponent(redirectUrl)}`;
        }

        return url;
    }

    // ========================================================================
    // BRANCHES (DATABASE VERSIONING)
    // ========================================================================

    /**
     * Create a branch (database snapshot/version)
     * Perfect for versioning AI-generated databases
     * 
     * @param projectId - Neon project ID
     * @param branchName - Name of the branch
     * @param parentBranchId - Parent branch to fork from (optional)
     * @returns Created branch
     */
    async createBranch(
        projectId: string,
        branchName: string,
        parentBranchId?: string
    ): Promise<{ branch: NeonBranch }> {
        const payload: Record<string, unknown> = {
            branch: {
                name: branchName,
            },
        };

        if (parentBranchId) {
            (payload.branch as Record<string, unknown>).parent_id = parentBranchId;
        }

        return this.request<{ branch: NeonBranch }>(
            `/projects/${projectId}/branches`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
    }

    /**
     * List all branches for a project
     */
    async listBranches(projectId: string): Promise<{ branches: NeonBranch[] }> {
        return this.request<{ branches: NeonBranch[] }>(
            `/projects/${projectId}/branches`
        );
    }

    /**
     * Delete a branch
     */
    async deleteBranch(
        projectId: string,
        branchId: string
    ): Promise<{ branch: NeonBranch }> {
        return this.request<{ branch: NeonBranch }>(
            `/projects/${projectId}/branches/${branchId}`,
            {
                method: "DELETE",
            }
        );
    }

    // ========================================================================
    // CONSUMPTION METRICS (BILLING)
    // ========================================================================

    /**
     * Get consumption metrics for billing
     * 
     * @param from - Start date (ISO 8601)
     * @param to - End date (ISO 8601)
     * @param granularity - Granularity: 'hourly', 'daily', 'monthly'
     * @param projectIds - Optional array of project IDs to filter
     * @returns Consumption metrics
     */
    async getConsumptionMetrics(
        from: string,
        to: string,
        granularity: "hourly" | "daily" | "monthly" = "daily",
        projectIds?: string[]
    ): Promise<NeonConsumptionMetrics> {
        const params = new URLSearchParams({
            from,
            to,
            granularity,
        });

        if (this.orgId) {
            params.append("org_id", this.orgId);
        }

        if (projectIds && projectIds.length > 0) {
            projectIds.forEach((id) => params.append("project_ids", id));
        }

        return this.request<NeonConsumptionMetrics>(
            `/consumption/projects?${params.toString()}`
        );
    }

    /**
     * Get account-level consumption (all projects)
     */
    async getAccountConsumption(
        from: string,
        to: string
    ): Promise<NeonConsumptionMetrics> {
        const params = new URLSearchParams({ from, to });

        if (this.orgId) {
            params.append("org_id", this.orgId);
        }

        return this.request<NeonConsumptionMetrics>(
            `/consumption/projects?${params.toString()}`
        );
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get singleton Neon API instance
 */
let neonApiInstance: NeonAPI | null = null;

export function getNeonAPI(orgId?: string): NeonAPI {
    if (!neonApiInstance) {
        neonApiInstance = new NeonAPI();
    }

    // Set org ID if provided (for multi-org setups)
    if (orgId) {
        neonApiInstance.setOrgId(orgId);
    }

    return neonApiInstance;
}

/**
 * Get organization ID based on user's plan
 * @param planName - "HOBBY", "PRO", or "AGENT"
 * @returns Appropriate Neon organization ID
 */
export function getNeonOrgIdForPlan(planName: string): string {
    const freeOrg = process.env.NEON_FREE_ORG_ID;
    const proOrg = process.env.NEON_PRO_ORG_ID;

    switch (planName.toUpperCase()) {
        case "HOBBY":
            if (!freeOrg) {
                throw new Error("NEON_FREE_ORG_ID environment variable is required for Hobby plan");
            }
            return freeOrg;

        case "PRO":
        case "AGENT":
            if (!proOrg) {
                throw new Error("NEON_PRO_ORG_ID environment variable is required for Pro/Agent plans");
            }
            return proOrg;

        default:
            // Default to free tier
            if (!freeOrg) {
                throw new Error("NEON_FREE_ORG_ID environment variable is required");
            }
            return freeOrg;
    }
}

/**
 * Extract connection details from Neon connection URI
 */
export function parseConnectionUri(uri: string) {
    try {
        const url = new URL(uri);
        return {
            host: url.hostname,
            port: url.port || "5432",
            database: url.pathname.slice(1), // Remove leading /
            user: url.username,
            password: url.password,
            ssl: url.searchParams.get("sslmode") === "require",
        };
    } catch (error) {
        throw new Error(`Invalid connection URI: ${error}`);
    }
}

/**
 * Convert bytes to GB for consumption tracking
 */
export function bytesToGb(bytes: number): number {
    return bytes / (1024 * 1024 * 1024);
}

/**
 * Convert storage bytes-hour to GB-month (approximation)
 */
export function storageBytesHourToGbMonth(bytesHour: number): number {
    // Average hours per month: ~730
    const hoursPerMonth = 730;
    return (bytesHour / hoursPerMonth) / (1024 * 1024 * 1024);
}
