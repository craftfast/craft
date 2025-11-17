import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";

// GET /api/projects/[id]/collaborators - Get all collaborators
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

        // Verify project ownership or collaboration
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                collaborators: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Check if user is owner or collaborator
        const isOwner = project.userId === session.user.id;
        const isCollaborator = project.collaborators.some(
            (c) => c.userId === session.user.id
        );

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Add owner to the list
        const owner = await prisma.user.findUnique({
            where: { id: project.userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        const collaborators = [
            {
                id: project.userId,
                email: owner?.email || "",
                name: owner?.name,
                image: owner?.image,
                role: "owner",
                addedAt: project.createdAt.toISOString(),
            },
            ...project.collaborators.map((c) => ({
                id: c.id,
                email: c.user.email,
                name: c.user.name,
                image: c.user.image,
                role: c.role,
                addedAt: c.addedAt.toISOString(),
            })),
        ];

        return NextResponse.json(collaborators);
    } catch (error) {
        console.error("Error fetching collaborators:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/collaborators - Add a collaborator
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

        // Verify project ownership (only owner can add collaborators)
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { email, role = "viewer" } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Validate role
        if (!["editor", "viewer"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Find user by email
        const userToAdd = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        if (!userToAdd) {
            return NextResponse.json(
                { error: "User not found. They need to sign up first." },
                { status: 404 }
            );
        }

        // Check if user is the owner
        if (userToAdd.id === session.user.id) {
            return NextResponse.json(
                { error: "Cannot add yourself as a collaborator" },
                { status: 400 }
            );
        }

        // Check if already a collaborator
        const existingCollaborator = await prisma.projectCollaborator.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: userToAdd.id,
                },
            },
        });

        if (existingCollaborator) {
            return NextResponse.json(
                { error: "User is already a collaborator" },
                { status: 400 }
            );
        }

        // Add collaborator
        const collaborator = await prisma.projectCollaborator.create({
            data: {
                projectId,
                userId: userToAdd.id,
                role,
                addedBy: session.user.id,
            },
        });

        return NextResponse.json({
            id: collaborator.id,
            email: userToAdd.email,
            name: userToAdd.name,
            image: userToAdd.image,
            role: collaborator.role,
            addedAt: collaborator.addedAt.toISOString(),
        });
    } catch (error) {
        console.error("Error adding collaborator:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
