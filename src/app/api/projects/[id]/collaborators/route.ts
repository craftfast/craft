import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get collaborators (this would be from a ProjectCollaborators table in a real implementation)
        const collaborators: any[] = [];

        return NextResponse.json(collaborators);
    } catch (error) {
        console.error("Error fetching collaborators:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projectId = params.id;

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const body = await req.json();
        const { email, role } = body;

        // Here you would add the collaborator to the database
        // For now, we'll return a mock response
        const newCollaborator = {
            id: `collab_${Date.now()}`,
            email,
            role,
            addedAt: new Date().toISOString(),
        };

        return NextResponse.json(newCollaborator);
    } catch (error) {
        console.error("Error adding collaborator:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
