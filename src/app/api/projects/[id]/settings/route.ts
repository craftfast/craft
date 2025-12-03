import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { maskSecretValue } from "@/lib/crypto";

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

        // Verify project ownership or collaboration access
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { userId: session.user.id },
                    { collaborators: { some: { userId: session.user.id } } },
                ],
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Fetch environment variables from the dedicated table (not the legacy JSON field)
        const envVars = await prisma.projectEnvironmentVariable.findMany({
            where: {
                projectId,
                deletedAt: null,
            },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                key: true,
                value: true,
                isSecret: true,
                type: true,
                description: true,
                createdAt: true,
            },
        });

        // Mask secret values - sensitive values are never exposed
        const maskedEnvVars = envVars.map((v) => ({
            ...v,
            value: v.isSecret ? maskSecretValue(v.value, 0) : v.value,
        }));

        // Get project settings (stored in metadata or separate table if needed)
        const settings = {
            integrations: {
                supabase: { enabled: false },
                supabaseStorage: { enabled: false },
                razorpay: { enabled: false },
                openpanel: { enabled: false },
                resend: { enabled: false },
                tawkto: { enabled: false },
                openrouter: { enabled: false },
                upstash: { enabled: false },
            },
            collaborators: [],
            versions: [],
            knowledgeFiles: [],
            environmentVariables: maskedEnvVars,
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
