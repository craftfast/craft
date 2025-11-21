import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get project settings (stored in metadata or separate table if needed)
        const settings = {
            integrations: {
                supabase: { enabled: false },
                supabaseStorage: { enabled: false },
                polar: { enabled: false },
                openpanel: { enabled: false },
                resend: { enabled: false },
                tawkto: { enabled: false },
                openrouter: { enabled: false },
                upstash: { enabled: false },
            },
            collaborators: [],
            versions: [],
            knowledgeFiles: [],
            environmentVariables: Array.isArray(project.environmentVariables)
                ? project.environmentVariables
                : [],
            customViews: Array.isArray(project.customViews)
                ? project.customViews
                : [],
            deployments: {
                vercel: false,
                github: false,
            },
        };

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching project settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
