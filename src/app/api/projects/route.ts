import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { generateProjectName } from "@/lib/ai/agent";

// GET /api/projects - Fetch all projects for the authenticated user
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();

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

        // Fetch projects with file counts
        const projects = await prisma.project.findMany({
            where: whereClause,
            orderBy,
            take: limit ? parseInt(limit) : undefined,
            include: {
                _count: {
                    select: {
                        fileRecords: true,
                        chatMessages: true,
                    },
                },
            },
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
        const session = await getSession();

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
        const { name, description, selectedModel } = body;

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
                    userId: user.id,
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

        // Create project with EMPTY state
        // AI will initialize with Next.js template when user sends first message
        // This approach:
        // 1. Saves database space (no unused template files)
        // 2. Gives AI full control over project structure
        // 3. Enables flexible framework choices (Next.js, Vite, Remix, etc.)
        console.log("📦 Creating empty project (AI will initialize on first message)...");

        // Create the project with empty codeFiles
        const project = await prisma.project.create({
            data: {
                name: projectName,
                description: description?.trim() || null,
                userId: user.id,
                codeFiles: {}, // Start empty - AI initializes with create-next-app
                version: 0,
                generationStatus: "empty", // Status: empty (needs AI initialization)
            },
        });

        console.log(`🎉 Project created with ID: ${project.id}`);
        console.log(`📦 Starting state: EMPTY (0 files)`);
        console.log(`🤖 AI will initialize Next.js project on first message...`);

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }
}
