/**
 * Supabase for Platforms Service
 * 
 * Provisions and manages Supabase projects under Craft's organization.
 * Users don't need to connect their own Supabase account - Craft manages everything.
 * 
 * API Reference: https://api.supabase.com/api/v1
 * Docs: https://supabase.com/docs/guides/integrations/supabase-for-platforms
 */

import crypto from "crypto";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_API_URL = "https://api.supabase.com/v1";
const SUPABASE_SERVICE_TOKEN = process.env.SUPABASE_SERVICE_TOKEN;
const SUPABASE_ORG_SLUG = process.env.SUPABASE_ORG_SLUG;
const SUPABASE_DEFAULT_INSTANCE_SIZE = process.env.SUPABASE_DEFAULT_INSTANCE_SIZE || "micro";

// Map AWS region codes to Supabase smart group codes
// Supabase only accepts: 'americas' | 'emea' | 'apac'
function getSupabaseRegion(): "americas" | "emea" | "apac" {
    const envRegion = process.env.SUPABASE_DEFAULT_REGION || "americas";

    // If already a valid Supabase region, return it
    if (envRegion === "americas" || envRegion === "emea" || envRegion === "apac") {
        return envRegion;
    }

    // Map AWS/common region codes to Supabase smart groups
    const regionMapping: Record<string, "americas" | "emea" | "apac"> = {
        // Americas
        "us-east-1": "americas",
        "us-east-2": "americas",
        "us-west-1": "americas",
        "us-west-2": "americas",
        "ca-central-1": "americas",
        "sa-east-1": "americas",
        // EMEA (Europe, Middle East, Africa)
        "eu-west-1": "emea",
        "eu-west-2": "emea",
        "eu-west-3": "emea",
        "eu-central-1": "emea",
        "eu-north-1": "emea",
        "me-south-1": "emea",
        "af-south-1": "emea",
        // APAC (Asia Pacific)
        "ap-southeast-1": "apac",
        "ap-southeast-2": "apac",
        "ap-northeast-1": "apac",
        "ap-northeast-2": "apac",
        "ap-northeast-3": "apac",
        "ap-south-1": "apac",
        "ap-east-1": "apac",
    };

    return regionMapping[envRegion] || "americas";
}

const SUPABASE_DEFAULT_REGION = getSupabaseRegion();

// =============================================================================
// TYPES
// =============================================================================

export interface SupabaseProject {
    id: string;
    ref: string;
    name: string;
    organization_id: string;
    region: string;
    created_at: string;
    status: "ACTIVE_HEALTHY" | "COMING_UP" | "INACTIVE" | "UNKNOWN";
    database?: {
        host: string;
        port: number;
        name: string;
        user: string;
        version: string;
    };
}

export interface SupabaseApiKey {
    name: string;
    api_key: string;
    type: "anon" | "service_role" | "publishable" | "secret";
}

export interface SupabaseProjectHealth {
    name: string;
    status: "ACTIVE_HEALTHY" | "COMING_UP" | "INACTIVE" | "UNKNOWN";
    error?: string;
}

export interface CreateProjectOptions {
    name: string;
    region?: "americas" | "emea" | "apac";
    instanceSize?: string;
    /** Custom database password - if not provided, a secure one will be generated */
    dbPassword?: string;
}

export interface SupabaseCredentials {
    projectRef: string;
    apiUrl: string;
    anonKey: string;
    serviceRoleKey: string;
    databaseUrl: string;
    dbHost: string;
    dbPort: number;
    dbName: string;
    dbUser: string;
    dbPassword: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a secure random password for database
 */
function generateSecurePassword(length = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const randomBytes = crypto.randomBytes(length);
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
    }
    return password;
}

/**
 * Make authenticated request to Supabase Management API
 */
async function supabaseApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    if (!SUPABASE_SERVICE_TOKEN) {
        throw new Error("SUPABASE_SERVICE_TOKEN is not configured");
    }

    const url = `${SUPABASE_API_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_TOKEN}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Supabase API error: ${response.status} ${errorText}`);
        throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
    }

    // Some endpoints return empty body
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text);
}

// =============================================================================
// PROJECT MANAGEMENT
// =============================================================================

/**
 * Create a new Supabase project under Craft's organization
 * 
 * @param options Project creation options
 * @returns Created project with credentials
 */
export async function createSupabaseProject(
    options: CreateProjectOptions
): Promise<{ project: SupabaseProject; dbPassword: string }> {
    if (!SUPABASE_ORG_SLUG) {
        throw new Error("SUPABASE_ORG_SLUG is not configured");
    }

    const dbPassword = options.dbPassword || generateSecurePassword();

    console.log(`🗄️ Creating Supabase project: ${options.name}`);

    // Build request body - don't include instance_size for free plan orgs
    const requestBody: Record<string, unknown> = {
        name: options.name,
        organization_slug: SUPABASE_ORG_SLUG,
        db_pass: dbPassword,
        region_selection: {
            type: "smartGroup",
            code: options.region || SUPABASE_DEFAULT_REGION,
        },
    };

    // Only add instance size if explicitly provided (paid plans only)
    // Free plan organizations cannot specify instance size
    if (options.instanceSize && SUPABASE_DEFAULT_INSTANCE_SIZE !== "free") {
        requestBody.desired_instance_size = options.instanceSize;
    }

    const project = await supabaseApi<SupabaseProject>("/projects", {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    console.log(`✅ Supabase project created: ${project.ref}`);

    return { project, dbPassword };
}

/**
 * Get project details by reference ID
 */
export async function getSupabaseProject(projectRef: string): Promise<SupabaseProject> {
    return supabaseApi<SupabaseProject>(`/projects/${projectRef}`);
}

/**
 * Get project health status
 * Use this to check if services are ready after creation
 * 
 * @param projectRef Project reference ID
 * @param services Services to check health for (default: all critical services)
 */
export async function getProjectHealth(
    projectRef: string,
    services: string[] = ["auth", "rest", "db", "realtime", "storage"]
): Promise<SupabaseProjectHealth[]> {
    // The health endpoint requires services query parameter
    const servicesParam = services.join(",");
    return supabaseApi<SupabaseProjectHealth[]>(
        `/projects/${projectRef}/health?services=${servicesParam}`
    );
}

/**
 * Wait for project to be healthy (all services active)
 * 
 * @param projectRef Project reference ID
 * @param maxWaitMs Maximum time to wait (default 5 minutes)
 * @param pollIntervalMs Poll interval (default 5 seconds)
 */
export async function waitForProjectHealth(
    projectRef: string,
    maxWaitMs = 300000,
    pollIntervalMs = 5000
): Promise<boolean> {
    const startTime = Date.now();
    const criticalServices = ["auth", "rest", "db", "storage"];

    while (Date.now() - startTime < maxWaitMs) {
        try {
            const health = await getProjectHealth(projectRef, criticalServices);

            // Check if all critical services are healthy
            const allHealthy = health.every(service =>
                service.status === "ACTIVE_HEALTHY" || service.status === "COMING_UP"
            );

            const allActive = health.every(service =>
                service.status === "ACTIVE_HEALTHY"
            );

            if (allActive) {
                console.log(`✅ Supabase project ${projectRef} is healthy`);
                return true;
            }

            if (allHealthy) {
                console.log(`⏳ Project ${projectRef} is starting up...`);
            } else {
                console.log(`⏳ Waiting for project ${projectRef} to be healthy...`);
            }
        } catch (error) {
            console.log(`⏳ Project ${projectRef} not ready yet...`);
        }

        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    console.error(`❌ Project ${projectRef} did not become healthy within ${maxWaitMs}ms`);
    return false;
}

/**
 * Get API keys for a project
 * 
 * @param projectRef Project reference ID
 * @param reveal Whether to reveal the actual key values
 */
export async function getProjectApiKeys(
    projectRef: string,
    reveal = true
): Promise<SupabaseApiKey[]> {
    const endpoint = reveal
        ? `/projects/${projectRef}/api-keys?reveal=true`
        : `/projects/${projectRef}/api-keys`;

    return supabaseApi<SupabaseApiKey[]>(endpoint);
}

/**
 * Get full credentials for a project
 * Combines project info, API keys, and database connection details
 */
export async function getProjectCredentials(
    projectRef: string,
    dbPassword: string
): Promise<SupabaseCredentials> {
    const [project, apiKeys] = await Promise.all([
        getSupabaseProject(projectRef),
        getProjectApiKeys(projectRef, true),
    ]);

    // Find the keys
    const anonKey = apiKeys.find(k => k.type === "anon" || k.type === "publishable")?.api_key;
    const serviceRoleKey = apiKeys.find(k => k.type === "service_role" || k.type === "secret")?.api_key;

    if (!anonKey || !serviceRoleKey) {
        throw new Error("Could not retrieve API keys for project");
    }

    // Build connection details
    const dbHost = project.database?.host || `db.${projectRef}.supabase.co`;
    const dbPort = project.database?.port || 5432;
    const dbName = project.database?.name || "postgres";
    const dbUser = project.database?.user || "postgres";

    const apiUrl = `https://${projectRef}.supabase.co`;
    const databaseUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

    return {
        projectRef,
        apiUrl,
        anonKey,
        serviceRoleKey,
        databaseUrl,
        dbHost,
        dbPort,
        dbName,
        dbUser,
        dbPassword,
    };
}

/**
 * Delete a Supabase project
 * 
 * ⚠️ This permanently deletes all data in the project!
 */
export async function deleteSupabaseProject(projectRef: string): Promise<void> {
    console.log(`🗑️ Deleting Supabase project: ${projectRef}`);

    await supabaseApi(`/projects/${projectRef}`, {
        method: "DELETE",
    });

    console.log(`✅ Supabase project deleted: ${projectRef}`);
}

/**
 * Pause a Supabase project (stops compute charges)
 */
export async function pauseProject(projectRef: string): Promise<void> {
    console.log(`⏸️ Pausing Supabase project: ${projectRef}`);

    await supabaseApi(`/projects/${projectRef}/pause`, {
        method: "POST",
    });

    console.log(`✅ Supabase project paused: ${projectRef}`);
}

/**
 * Resume a paused Supabase project
 */
export async function resumeProject(projectRef: string): Promise<void> {
    console.log(`▶️ Resuming Supabase project: ${projectRef}`);

    await supabaseApi(`/projects/${projectRef}/restore`, {
        method: "POST",
    });

    console.log(`✅ Supabase project resumed: ${projectRef}`);
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Run a SQL migration on a project
 * 
 * Note: This endpoint may require special access from Supabase
 */
export async function runMigration(
    projectRef: string,
    query: string,
    name: string
): Promise<void> {
    console.log(`📦 Running migration on ${projectRef}: ${name}`);

    await supabaseApi(`/projects/${projectRef}/database/migrations`, {
        method: "POST",
        body: JSON.stringify({
            query,
            name,
        }),
    });

    console.log(`✅ Migration completed: ${name}`);
}

/**
 * Execute a SQL query on a project
 */
export async function executeQuery(
    projectRef: string,
    query: string
): Promise<unknown> {
    return supabaseApi(`/projects/${projectRef}/database/query`, {
        method: "POST",
        body: JSON.stringify({ query }),
    });
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Update Auth configuration for a project
 */
export async function updateAuthConfig(
    projectRef: string,
    config: Record<string, unknown>
): Promise<void> {
    await supabaseApi(`/projects/${projectRef}/config/auth`, {
        method: "PATCH",
        body: JSON.stringify(config),
    });
}

/**
 * Update Storage configuration for a project
 */
export async function updateStorageConfig(
    projectRef: string,
    config: Record<string, unknown>
): Promise<void> {
    await supabaseApi(`/projects/${projectRef}/config/storage`, {
        method: "PATCH",
        body: JSON.stringify(config),
    });
}

// =============================================================================
// USAGE & BILLING
// =============================================================================

/**
 * Get available regions for project creation
 */
export async function getAvailableRegions(): Promise<Array<{
    region: string;
    display_name: string;
    smart_region_code: string;
}>> {
    return supabaseApi("/projects/available-regions");
}

/**
 * Change compute instance size
 */
export async function changeComputeSize(
    projectRef: string,
    size: "micro" | "small" | "medium" | "large" | "xlarge" | "2xlarge" | "4xlarge" | "pico"
): Promise<void> {
    const sizeMap: Record<string, string> = {
        pico: "ci_pico",
        micro: "ci_micro",
        small: "ci_small",
        medium: "ci_medium",
        large: "ci_large",
        xlarge: "ci_xlarge",
        "2xlarge": "ci_2xlarge",
        "4xlarge": "ci_4xlarge",
    };

    await supabaseApi(`/projects/${projectRef}/billing/addons`, {
        method: "PATCH",
        body: JSON.stringify({
            addon_type: "compute_instance",
            addon_variant: sizeMap[size],
        }),
    });

    console.log(`✅ Changed compute size to ${size} for ${projectRef}`);
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check if Supabase for Platforms is properly configured
 */
export function isSupabaseConfigured(): boolean {
    return !!(SUPABASE_SERVICE_TOKEN && SUPABASE_ORG_SLUG);
}

/**
 * Validate Supabase configuration and test API access
 */
export async function validateConfiguration(): Promise<{
    configured: boolean;
    connected: boolean;
    error?: string;
}> {
    if (!isSupabaseConfigured()) {
        return {
            configured: false,
            connected: false,
            error: "SUPABASE_SERVICE_TOKEN or SUPABASE_ORG_SLUG not configured",
        };
    }

    try {
        // Try to get available regions as a simple API test
        await getAvailableRegions();
        return { configured: true, connected: true };
    } catch (error) {
        return {
            configured: true,
            connected: false,
            error: error instanceof Error ? error.message : "Failed to connect to Supabase API",
        };
    }
}
