import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decryptValue } from "@/lib/crypto";
import {
    getProjectHealth,
    getProjectCredentials,
    isSupabaseConfigured,
} from "@/lib/services/supabase-platforms";

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

        // Get environment variables (public key only)
        const envVars = (project.environmentVariables as Record<string, string>) || {};

        return NextResponse.json({
            provisioned: true,
            status: isHealthy ? "active" : project.supabaseStatus,
            projectRef: project.supabaseProjectRef,
            apiUrl: project.supabaseApiUrl,
            provisionedAt: project.supabaseProvisionedAt,
            health,
            // Only return public info
            credentials: {
                url: envVars.NEXT_PUBLIC_SUPABASE_URL || project.supabaseApiUrl,
                anonKey: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
