import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/projects/[id]/integrations
 * Get all integrations for a specific project
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
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get project integrations (placeholder - in production, fetch from database)
        // You would typically store this in a ProjectIntegration table or in project metadata
        const integrations = {
            supabase: { enabled: false },
            supabaseStorage: { enabled: false },
            polar: { enabled: false },
            openpanel: { enabled: false },
            resend: { enabled: false },
            tawkto: { enabled: false },
            openrouter: { enabled: false },
            upstash: { enabled: false },
        };

        return NextResponse.json({
            integrations,
        });
    } catch (error) {
        console.error("Failed to fetch project integrations:", error);
        return NextResponse.json(
            { error: "Failed to fetch integrations" },
            { status: 500 }
        );
    }
}
