import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { encryptValue } from "@/lib/crypto";
import { checkUserBalance } from "@/lib/ai-usage";
import { MINIMUM_BALANCE_THRESHOLD, INFRASTRUCTURE_COSTS } from "@/lib/pricing-constants";
import {
    createSupabaseProject,
    waitForProjectHealth,
    getProjectCredentials,
    isSupabaseConfigured,
} from "@/lib/services/supabase-platforms";

/**
 * POST /api/projects/[id]/supabase/provision
 * Provision a Supabase project for this Craft project
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Check if Supabase for Platforms is configured
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                { error: "Supabase for Platforms is not configured" },
                { status: 503 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Check if already provisioned
        if (project.supabaseProjectRef) {
            return NextResponse.json(
                { error: "Supabase is already provisioned for this project" },
                { status: 400 }
            );
        }

        // Check user balance (estimate first month compute cost)
        const estimatedCost = INFRASTRUCTURE_COSTS.supabase.computePerMonth;
        const balanceCheck = await checkUserBalance(session.user.id, estimatedCost);

        if (!balanceCheck.allowed) {
            return NextResponse.json(
                {
                    error: "Insufficient balance",
                    balance: balanceCheck.balance,
                    required: MINIMUM_BALANCE_THRESHOLD,
                },
                { status: 402 }
            );
        }

        // Mark project as provisioning
        await prisma.project.update({
            where: { id: projectId },
            data: { supabaseStatus: "provisioning" },
        });

        try {
            // Create Supabase project
            const { project: supabaseProject, dbPassword } = await createSupabaseProject({
                name: `craft-${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40)}`,
            });

            // Wait for project to be healthy (up to 5 minutes)
            const isHealthy = await waitForProjectHealth(supabaseProject.ref, 300000, 10000);

            if (!isHealthy) {
                // Update status but don't fail - project may still come up
                await prisma.project.update({
                    where: { id: projectId },
                    data: {
                        supabaseProjectId: supabaseProject.id,
                        supabaseProjectRef: supabaseProject.ref,
                        supabaseApiUrl: `https://${supabaseProject.ref}.supabase.co`,
                        supabaseDbPassword: encryptValue(dbPassword),
                        supabaseStatus: "pending",
                        supabaseProvisionedAt: new Date(),
                    },
                });

                return NextResponse.json({
                    success: true,
                    status: "pending",
                    message: "Supabase project created but still initializing",
                    projectRef: supabaseProject.ref,
                });
            }

            // Get full credentials
            const credentials = await getProjectCredentials(supabaseProject.ref, dbPassword);

            // Update project with Supabase info
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    supabaseProjectId: supabaseProject.id,
                    supabaseProjectRef: supabaseProject.ref,
                    supabaseApiUrl: credentials.apiUrl,
                    supabaseDbPassword: encryptValue(dbPassword),
                    supabaseStatus: "active",
                    supabaseProvisionedAt: new Date(),
                },
            });

            // Auto-inject environment variables
            const existingEnvVars = (project.environmentVariables as Record<string, string>) || {};
            const newEnvVars = {
                ...existingEnvVars,
                NEXT_PUBLIC_SUPABASE_URL: credentials.apiUrl,
                NEXT_PUBLIC_SUPABASE_ANON_KEY: credentials.anonKey,
                SUPABASE_SERVICE_ROLE_KEY: encryptValue(credentials.serviceRoleKey),
                DATABASE_URL: encryptValue(credentials.databaseUrl),
            };

            await prisma.project.update({
                where: { id: projectId },
                data: { environmentVariables: newEnvVars },
            });

            return NextResponse.json({
                success: true,
                status: "active",
                projectRef: supabaseProject.ref,
                apiUrl: credentials.apiUrl,
                // Only return public key, not service role key
                publicKey: credentials.anonKey,
            });
        } catch (error) {
            // Update status to error
            await prisma.project.update({
                where: { id: projectId },
                data: { supabaseStatus: "error" },
            });

            throw error;
        }
    } catch (error) {
        console.error("Failed to provision Supabase:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to provision Supabase" },
            { status: 500 }
        );
    }
}
