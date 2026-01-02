import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    getProjectHealth,
    isSupabaseConfigured,
} from "@/lib/services/supabase-platforms";

/**
 * Migrate Supabase env vars from JSON field to ProjectEnvironmentVariable table
 * This handles projects provisioned before we switched to the proper table
 */
async function migrateEnvVarsIfNeeded(
    projectId: string,
    userId: string,
    jsonEnvVars: Record<string, string>
) {
    // Check if env vars exist in the table
    const existingVars = await prisma.projectEnvironmentVariable.findMany({
        where: { projectId, key: { in: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] } },
    });

    // If already migrated, skip
    if (existingVars.length >= 2) {
        return;
    }

    // Check if we have env vars in JSON field to migrate
    const supabaseUrl = jsonEnvVars.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = jsonEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = jsonEnvVars.SUPABASE_SERVICE_ROLE_KEY;
    const databaseUrl = jsonEnvVars.DATABASE_URL;

    if (!supabaseUrl || !anonKey) {
        return; // Nothing to migrate
    }

    console.log(`🔄 Migrating Supabase env vars for project ${projectId}...`);

    const envVarsToMigrate = [
        {
            key: "NEXT_PUBLIC_SUPABASE_URL",
            value: supabaseUrl,
            isSecret: false,
            description: "Supabase project URL (auto-provisioned by Craft)",
        },
        {
            key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            value: anonKey,
            isSecret: false,
            description: "Supabase anonymous key for client-side access (auto-provisioned by Craft)",
        },
    ];

    // Service role key and database URL are already encrypted in JSON
    if (serviceRoleKey) {
        envVarsToMigrate.push({
            key: "SUPABASE_SERVICE_ROLE_KEY",
            value: serviceRoleKey, // Already encrypted
            isSecret: true,
            description: "Supabase service role key for server-side admin operations (auto-provisioned by Craft)",
        });
    }

    if (databaseUrl) {
        envVarsToMigrate.push({
            key: "DATABASE_URL",
            value: databaseUrl, // Already encrypted
            isSecret: true,
            description: "PostgreSQL connection string for Drizzle ORM (auto-provisioned by Craft)",
        });
    }

    for (const envVar of envVarsToMigrate) {
        // For non-secret values, we need to check if they need encryption
        // Values from JSON were already encrypted if secret, so just store as-is
        await prisma.projectEnvironmentVariable.upsert({
            where: {
                projectId_key: {
                    projectId,
                    key: envVar.key,
                },
            },
            create: {
                projectId,
                key: envVar.key,
                value: envVar.value,
                isSecret: envVar.isSecret,
                description: envVar.description,
                createdBy: userId,
            },
            update: {
                value: envVar.value,
                isSecret: envVar.isSecret,
                description: envVar.description,
                updatedBy: userId,
                deletedAt: null,
            },
        });
    }

    console.log(`✅ Migrated ${envVarsToMigrate.length} Supabase env vars for project ${projectId}`);
}

/**
 * GET /api/projects/[id]/supabase/status
 * Get Supabase provisioning status for this project
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
            select: {
                id: true,
                supabaseProjectId: true,
                supabaseProjectRef: true,
                supabaseApiUrl: true,
                supabaseDbPassword: true,
                supabaseStatus: true,
                supabaseProvisionedAt: true,
                environmentVariables: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // If not provisioned yet
        if (!project.supabaseProjectRef) {
            return NextResponse.json({
                enabled: false,
                provisioned: false,
                configured: isSupabaseConfigured(),
            });
        }

        // Get health status from Supabase API
        let health: Array<{ name: string; status: string }> = [];
        let isHealthy = false;

        try {
            health = await getProjectHealth(project.supabaseProjectRef);
            isHealthy = health.every(h => h.status === "ACTIVE_HEALTHY");

            // Update status if it was pending and now healthy
            if (project.supabaseStatus === "pending" && isHealthy) {
                await prisma.project.update({
                    where: { id: projectId },
                    data: { supabaseStatus: "active" },
                });
            }
        } catch (error) {
            console.error("Failed to get Supabase health:", error);
        }

        // Get environment variables from JSON (for migration/backward compat)
        const jsonEnvVars = (project.environmentVariables as Record<string, string>) || {};

        // Migrate env vars from JSON field to table if needed (runs once per project)
        await migrateEnvVarsIfNeeded(projectId, session.user.id, jsonEnvVars);

        // Read env vars from the proper table (this is what sandbox uses)
        const tableEnvVars = await prisma.projectEnvironmentVariable.findMany({
            where: {
                projectId,
                key: { in: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] },
                deletedAt: null,
            },
            select: { key: true, value: true },
        });

        const envVarsMap: Record<string, string> = {};
        for (const v of tableEnvVars) {
            envVarsMap[v.key] = v.value;
        }

        return NextResponse.json({
            enabled: true,
            provisioned: true,
            status: isHealthy ? "active" : project.supabaseStatus,
            projectRef: project.supabaseProjectRef,
            apiUrl: project.supabaseApiUrl,
            provisionedAt: project.supabaseProvisionedAt,
            health,
            // Only return public info
            credentials: {
                supabaseUrl: envVarsMap.NEXT_PUBLIC_SUPABASE_URL || project.supabaseApiUrl,
                anonKey: envVarsMap.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                // Don't return service role key or database URL for security
            },
        });
    } catch (error) {
        console.error("Failed to get Supabase status:", error);
        return NextResponse.json(
            { error: "Failed to get Supabase status" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/projects/[id]/supabase/status
 * Delete/deprovision Supabase for this project
 * 
 * Note: This is a dangerous operation - it permanently deletes the Supabase project
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
            select: {
                id: true,
                supabaseProjectRef: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (!project.supabaseProjectRef) {
            return NextResponse.json(
                { error: "Supabase is not provisioned for this project" },
                { status: 400 }
            );
        }

        // Import delete function
        const { deleteSupabaseProject } = await import("@/lib/services/supabase-platforms");

        // Delete the Supabase project
        await deleteSupabaseProject(project.supabaseProjectRef);

        // Clear Supabase fields from project
        await prisma.project.update({
            where: { id: projectId },
            data: {
                supabaseProjectId: null,
                supabaseProjectRef: null,
                supabaseApiUrl: null,
                supabaseDbPassword: null,
                supabaseStatus: null,
                supabaseProvisionedAt: null,
            },
        });

        // Remove Supabase env vars
        const envVars = (project as any).environmentVariables as Record<string, string> || {};
        const {
            NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY,
            DATABASE_URL,
            ...remainingEnvVars
        } = envVars;

        await prisma.project.update({
            where: { id: projectId },
            data: { environmentVariables: remainingEnvVars },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete Supabase project:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete Supabase" },
            { status: 500 }
        );
    }
}
