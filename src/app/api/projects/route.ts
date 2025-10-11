import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { getNextJsTemplate } from "@/lib/templates/nextjs";

// Create OpenRouter client for AI name generation
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

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

        let projectName = name.trim();

        // If name is "New Project" and we have a description, generate a better name synchronously
        if (name.trim() === "New Project" && description?.trim()) {
            try {
                const generatedName = await generateProjectName(description.trim());
                if (generatedName) {
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

        const project = await prisma.project.create({
            data: {
                name: projectName,
                description: description?.trim() || null,
                userId: user.id,
                files: baseTemplate as object, // Base template - AI will modify/extend
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

// Helper function to generate project name using AI
async function generateProjectName(description: string): Promise<string | null> {
    try {
        // Try Grok first, fallback to Claude if it fails
        let modelName = process.env.GROK_MODEL || "x-ai/grok-4-fast";
        let generatedName = "";

        console.log(`🤖 Generating project name with model: ${modelName}`);

        try {
            const result = await generateText({
                model: openrouter.chat(modelName),
                system: `You are a naming assistant. You ONLY generate short project names.

CRITICAL RULES:
1. Output MUST be 1-4 words ONLY
2. NO code of any kind
3. NO explanations
4. NO markdown
5. NO special characters except spaces and hyphens
6. NO line breaks
7. Just the name, nothing else

Examples of CORRECT outputs:
- "Task Manager Pro"
- "Weather Dashboard"
- "Chat Bot"
- "Portfolio Site"

Examples of WRONG outputs (DO NOT DO THIS):
- Any code snippets
- "Here's a name: Task Manager"
- Multiple suggestions
- Descriptions or explanations`,
                prompt: `User's project idea: ${description}

Project name (1-4 words only, no code):`,
                temperature: 0.7,
                maxRetries: 2,
            });

            // Clean and validate the generated name
            let rawName = result.text.trim();

            // Remove any markdown, code blocks, or formatting
            rawName = rawName
                .replace(/```[\s\S]*?```/g, '') // Remove code blocks
                .replace(/`[^`]*`/g, '') // Remove inline code
                .replace(/['"]/g, '') // Remove quotes
                .replace(/^\*+|\*+$/g, '') // Remove asterisks
                .replace(/^#+\s*/g, '') // Remove markdown headers
                .trim();

            // Take only the first line if multiple lines
            rawName = rawName.split('\n')[0].trim();

            // If it looks like code (contains common code characters), reject it
            if (rawName.includes('{') || rawName.includes('}') ||
                rawName.includes('(') || rawName.includes(')') ||
                rawName.includes(';') || rawName.includes('=') ||
                rawName.includes('function') || rawName.includes('const') ||
                rawName.includes('let') || rawName.includes('var') ||
                rawName.length > 50) {
                console.warn(`⚠️ Generated name looks like code, rejecting: ${rawName}`);
                throw new Error('Generated name contains code-like content');
            }

            generatedName = rawName;
            console.log(`✨ Generated name from AI: ${generatedName}`);
        } catch (grokError: unknown) {
            const error = grokError as Error;
            console.error(`❌ Grok model failed:`, {
                message: error?.message,
                cause: (error as { cause?: unknown })?.cause,
                stack: error?.stack?.substring(0, 500),
            });

            // Fallback to Claude
            modelName = process.env.CLAUDE_MODEL || "anthropic/claude-sonnet-4.5";
            console.log(`🔄 Falling back to model: ${modelName}`);

            try {
                const result = await generateText({
                    model: openrouter.chat(modelName),
                    system: `You are a naming assistant. You ONLY generate short project names.

CRITICAL RULES:
1. Output MUST be 1-4 words ONLY
2. NO code of any kind
3. NO explanations
4. NO markdown
5. NO special characters except spaces and hyphens
6. NO line breaks
7. Just the name, nothing else

Examples of CORRECT outputs:
- "Task Manager Pro"
- "Weather Dashboard"
- "Chat Bot"
- "Portfolio Site"

Examples of WRONG outputs (DO NOT DO THIS):
- Any code snippets
- "Here's a name: Task Manager"
- Multiple suggestions
- Descriptions or explanations`,
                    prompt: `User's project idea: ${description}

Project name (1-4 words only, no code):`,
                    temperature: 0.7,
                    maxRetries: 2,
                });

                // Clean and validate the generated name
                let rawName = result.text.trim();

                // Remove any markdown, code blocks, or formatting
                rawName = rawName
                    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
                    .replace(/`[^`]*`/g, '') // Remove inline code
                    .replace(/['"]/g, '') // Remove quotes
                    .replace(/^\*+|\*+$/g, '') // Remove asterisks
                    .replace(/^#+\s*/g, '') // Remove markdown headers
                    .trim();

                // Take only the first line if multiple lines
                rawName = rawName.split('\n')[0].trim();

                // If it looks like code (contains common code characters), reject it
                if (rawName.includes('{') || rawName.includes('}') ||
                    rawName.includes('(') || rawName.includes(')') ||
                    rawName.includes(';') || rawName.includes('=') ||
                    rawName.includes('function') || rawName.includes('const') ||
                    rawName.includes('let') || rawName.includes('var') ||
                    rawName.length > 50) {
                    console.warn(`⚠️ Generated name looks like code, rejecting: ${rawName}`);
                    throw new Error('Generated name contains code-like content');
                }

                generatedName = rawName;
                console.log(`✨ Generated name with fallback: ${generatedName}`);
            } catch (claudeError: unknown) {
                const fallbackError = claudeError as Error;
                console.error(`❌ Claude fallback also failed:`, {
                    message: fallbackError?.message,
                    cause: (fallbackError as { cause?: unknown })?.cause,
                });
                // If both models fail, return null
                console.warn(`⚠️ All AI models failed, using default name`);
                return null;
            }
        }

        return generatedName;
    } catch (error) {
        console.error("❌ Error in generateProjectName:", error);
        return null;
    }
}
