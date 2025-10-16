import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateProjectName } from "@/lib/ai/agent";
import { getNextJsTemplate } from "@/lib/templates/nextjs";

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

        // Check project limit based on user's plan
        const subscription = await prisma.userSubscription.findUnique({
            where: { userId: user.id },
            include: { plan: true },
        });

        // Get user's current project count
        const projectCount = await prisma.project.count({
            where: { userId: user.id },
        });

        // Determine max projects based on plan (default to Hobby: 3 projects)
        const maxProjects = subscription?.plan?.maxProjects ?? 3;

        // Check if user has reached their project limit
        if (maxProjects !== null && maxProjects < 1000 && projectCount >= maxProjects) {
            return NextResponse.json(
                {
                    error: `Project limit reached. You can create up to ${maxProjects} projects on your current plan. Upgrade to Pro for unlimited projects.`,
                    code: "PROJECT_LIMIT_REACHED",
                    maxProjects,
                    currentCount: projectCount,
                },
                { status: 403 }
            );
        }

        let projectName = name.trim();

        // If name is "New Project" and we have a description, generate a better name synchronously
        if (name.trim() === "New Project" && description?.trim()) {
            try {
                const generatedName = await generateProjectName({
                    description: description.trim(),
                    maxWords: 4,
                    temperature: 0.7,
                });
                if (generatedName && generatedName !== "New Project") {
                    projectName = generatedName;
                    console.log(`✅ Generated project name: ${projectName}`);
                }
            } catch (error) {
                console.error("Error generating project name:", error);
                // Keep the default "New Project" name if generation fails
            }
        }

        // Create the project with minimal Next.js template
        // This provides the full Next.js template with TypeScript, Tailwind CSS, ESLint
        // AI will modify/extend these files based on user requirements
        console.log("📦 Creating project with Next.js template...");

        const baseTemplate = getNextJsTemplate();
        console.log(`✅ Generated ${Object.keys(baseTemplate).length} template files`);

        // Create the project with template files stored in the codeFiles JSON field
        // This allows the files API and sandbox to access them directly
        const project = await prisma.project.create({
            data: {
                name: projectName,
                description: description?.trim() || null,
                userId: user.id,
                codeFiles: baseTemplate, // Store template files directly in JSON field
                version: 0, // New project starts at version 0
                generationStatus: "template", // Status: template (not AI-generated yet)
            },
        });

        console.log(`🎉 Project created with ID: ${project.id}`);
        console.log(`📁 Base template saved - AI will customize based on description...`);

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }
}
