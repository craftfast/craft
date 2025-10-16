import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getNeonAPI, getNeonOrgIdForPlan, parseConnectionUri } from "@/lib/neon-api";

/**
 * POST /api/projects/[projectId]/database
 * Automatically provision a Neon database for a project
 * Uses plan-based org selection (Free tier vs Pro tier)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        // Verify project ownership and get user's team/plan
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
            include: {
                neonDatabase: true, // Check if database already exists
                user: {
                    include: {
                        ownedTeams: {
                            include: {
                                subscription: {
                                    include: {
                                        plan: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // If database already exists, return it
        if (project.neonDatabase) {
            return NextResponse.json({
                database: project.neonDatabase,
                message: "Database already provisioned",
            });
        }

        // Get optional parameters from request
        const body = await request.json().catch(() => ({}));
        const {
            region = "aws-us-east-2",
            createTransferRequest = true,
            transferTtlDays = 7,
        } = body;

        // Determine user's plan (default to HOBBY if no subscription)
        const userTeam = project.user.ownedTeams[0]; // Get user's personal team
        const planName = userTeam?.subscription?.plan?.name || "HOBBY";

        console.log(`📊 User plan: ${planName}`);

        // Get appropriate Neon org ID based on plan
        const neonOrgId = getNeonOrgIdForPlan(planName);
        console.log(`🏢 Using Neon org: ${neonOrgId}`);

        // Initialize Neon API with plan-specific org
        const neonApi = getNeonAPI(neonOrgId);

        console.log(`🚀 Provisioning Neon database for project: ${project.name}`);

        // Step 1: Create Neon project
        const neonProject = await neonApi.createProject(
            `${project.name} - Database`,
            region
        );

        console.log(`✅ Neon project created: ${neonProject.project.id}`);

        // Step 2: Extract connection details
        const connectionUri = neonProject.connection_uris[0].connection_uri;
        const connDetails = parseConnectionUri(connectionUri);

        console.log(`📦 Connection details extracted:`, {
            host: connDetails.host,
            database: connDetails.database,
            user: connDetails.user,
        });

        // Step 3: Create transfer request if enabled (for claimable databases)
        let transferRequest = null;
        let claimUrl = null;
        let transferExpiresAt = null;

        if (createTransferRequest) {
            try {
                transferRequest = await neonApi.createTransferRequest(
                    neonProject.project.id,
                    transferTtlDays * 24 * 60 * 60 // Convert days to seconds
                );

                // Generate claim URL with redirect back to Craft
                const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/database/claimed`;
                claimUrl = neonApi.generateClaimUrl(
                    neonProject.project.id,
                    transferRequest.id,
                    redirectUrl
                );

                transferExpiresAt = new Date(transferRequest.expires_at);

                console.log(`🔗 Transfer request created, expires: ${transferExpiresAt}`);
            } catch (error) {
                console.warn(
                    "⚠️ Failed to create transfer request (may not be enabled):",
                    error
                );
                // Continue without transfer request - not all plans support it
            }
        }

        // Step 4: Save database to our database
        const neonDatabase = await prisma.neonDatabase.create({
            data: {
                projectId: project.id,
                neonProjectId: neonProject.project.id,
                neonBranchId: neonProject.branch.id,
                connectionUri,
                host: connDetails.host,
                database: connDetails.database,
                user: connDetails.user,
                password: connDetails.password,
                region,
                pgVersion: neonProject.project.pg_version,
                status: "active",
                transferRequestId: transferRequest?.id,
                claimUrl,
                transferExpiresAt,
                isClaimable: !!transferRequest,
                // Auto-delete unclaimed databases after 30 days (optional)
                autoDeleteAt: transferExpiresAt
                    ? new Date(transferExpiresAt.getTime() + 23 * 24 * 60 * 60 * 1000)
                    : null,
                metadata: {
                    neonOrg: neonProject.project.org_id,
                    endpoint: neonProject.endpoints[0],
                },
            },
        });

        console.log(`✅ Database record saved to Craft database`);

        return NextResponse.json({
            database: {
                id: neonDatabase.id,
                projectId: neonDatabase.projectId,
                neonProjectId: neonDatabase.neonProjectId,
                connectionUri: neonDatabase.connectionUri,
                host: neonDatabase.host,
                database: neonDatabase.database,
                user: neonDatabase.user,
                region: neonDatabase.region,
                pgVersion: neonDatabase.pgVersion,
                status: neonDatabase.status,
                claimUrl: neonDatabase.claimUrl,
                transferExpiresAt: neonDatabase.transferExpiresAt,
                isClaimable: neonDatabase.isClaimable,
                createdAt: neonDatabase.createdAt,
            },
            message: "Database provisioned successfully",
        });
    } catch (error) {
        console.error("Error provisioning database:", error);
        return NextResponse.json(
            {
                error: "Failed to provision database",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/projects/[projectId]/database
 * Get database details for a project
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
            include: {
                neonDatabase: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (!project.neonDatabase) {
            return NextResponse.json(
                { error: "Database not provisioned" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            database: {
                id: project.neonDatabase.id,
                projectId: project.neonDatabase.projectId,
                neonProjectId: project.neonDatabase.neonProjectId,
                connectionUri: project.neonDatabase.connectionUri,
                host: project.neonDatabase.host,
                database: project.neonDatabase.database,
                user: project.neonDatabase.user,
                region: project.neonDatabase.region,
                pgVersion: project.neonDatabase.pgVersion,
                status: project.neonDatabase.status,
                claimUrl: project.neonDatabase.claimUrl,
                transferExpiresAt: project.neonDatabase.transferExpiresAt,
                isClaimable: project.neonDatabase.isClaimable,
                claimedAt: project.neonDatabase.claimedAt,
                claimedByEmail: project.neonDatabase.claimedByEmail,
                createdAt: project.neonDatabase.createdAt,
            },
        });
    } catch (error) {
        console.error("Error fetching database:", error);
        return NextResponse.json(
            { error: "Failed to fetch database" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/projects/[projectId]/database
 * Delete a project's database (cleanup)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user: {
                    email: session.user.email,
                },
            },
            include: {
                neonDatabase: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (!project.neonDatabase) {
            return NextResponse.json(
                { error: "Database not found" },
                { status: 404 }
            );
        }

        // Don't delete if already claimed by user
        if (project.neonDatabase.claimedAt) {
            return NextResponse.json(
                {
                    error: "Cannot delete claimed database",
                    message:
                        "This database has been claimed and is now owned by the user",
                },
                { status: 400 }
            );
        }

        const neonApi = getNeonAPI();

        // Delete from Neon
        try {
            await neonApi.deleteProject(project.neonDatabase.neonProjectId);
            console.log(
                `🗑️ Deleted Neon project: ${project.neonDatabase.neonProjectId}`
            );
        } catch (error) {
            console.warn("Failed to delete from Neon:", error);
            // Continue to delete from our database anyway
        }

        // Delete from our database
        await prisma.neonDatabase.delete({
            where: {
                id: project.neonDatabase.id,
            },
        });

        console.log(`✅ Database deleted from Craft database`);

        return NextResponse.json({
            message: "Database deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting database:", error);
        return NextResponse.json(
            { error: "Failed to delete database" },
            { status: 500 }
        );
    }
}
