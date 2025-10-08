import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/projects - Fetch all projects for the authenticated user
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the user from the database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get query parameters for sorting
        const { searchParams } = new URL(req.url);
        const sortBy = searchParams.get("sortBy") || "recent";
        const search = searchParams.get("search") || "";
        const limit = searchParams.get("limit");

        // Build the query
        const whereClause: {
            userId: string;
            OR?: Array<{ name?: { contains: string; mode: "insensitive" }; description?: { contains: string; mode: "insensitive" } }>;
        } = {
            userId: user.id,
        };

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        // Determine ordering
        let orderBy: { createdAt?: "desc" | "asc"; name?: "asc" } = {};
        switch (sortBy) {
            case "name":
                orderBy = { name: "asc" };
                break;
            case "oldest":
                orderBy = { createdAt: "asc" };
                break;
            case "recent":
            default:
                orderBy = { createdAt: "desc" };
                break;
        }

        // Fetch projects
        const projects = await prisma.project.findMany({
            where: whereClause,
            orderBy,
            take: limit ? parseInt(limit) : undefined,
        });

        return NextResponse.json({ projects }, { status: 200 });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        );
    }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the user from the database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { name, description } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json(
                { error: "Project name is required" },
                { status: 400 }
            );
        }

        // Create the project
        const project = await prisma.project.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                userId: user.id,
            },
        });

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }
}
