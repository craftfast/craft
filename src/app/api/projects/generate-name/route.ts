import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { generateProjectName } from "@/lib/ai/agent";

// POST /api/projects/generate-name - Generate a project name using AI Agent
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { description } = body;

        if (!description || description.trim() === "") {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            );
        }

        // Use the centralized AI agent for naming
        const generatedName = await generateProjectName({
            description: description.trim(),
            maxWords: 4,
            temperature: 0.8,
        });

        return NextResponse.json({ name: generatedName }, { status: 200 });
    } catch (error) {
        console.error("Error generating project name:", error);
        return NextResponse.json(
            {
                error: "Failed to generate project name",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
