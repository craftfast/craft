import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

// Create OpenRouter client
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

// POST /api/projects/generate-name - Generate a project name using Grok AI
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

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

        // Use Grok to generate a creative project name
        // Try Grok first, fallback to Claude if it fails
        let modelName = process.env.GROK_MODEL || "x-ai/grok-2-1212";

        console.log(`Generating project name with model: ${modelName}`);

        try {
            const result = await generateText({
                model: openrouter.chat(modelName),
                system: `You are a creative assistant that generates concise, memorable project names. 
Generate a single project name (1-4 words max) that captures the essence of the project description.
The name should be:
- Short and memorable
- Descriptive but creative
- Professional yet approachable
- Easy to remember and type

Return ONLY the project name, nothing else. No quotes, no explanation, just the name.`,
                prompt: `Generate a creative project name for this project: ${description}`,
                temperature: 0.8,
            });

            console.log(`Generated name: ${result.text}`);
            const generatedName = result.text.trim().replace(/['"]/g, "");

            return NextResponse.json({ name: generatedName }, { status: 200 });
        } catch (grokError) {
            console.warn(`Grok model failed, trying Claude fallback:`, grokError);

            // Fallback to Claude
            modelName = process.env.CLAUDE_MODEL || "anthropic/claude-3.5-sonnet";
            console.log(`Falling back to model: ${modelName}`);

            const result = await generateText({
                model: openrouter.chat(modelName),
                system: `You are a creative assistant that generates concise, memorable project names. 
Generate a single project name (1-4 words max) that captures the essence of the project description.
The name should be:
- Short and memorable
- Descriptive but creative
- Professional yet approachable
- Easy to remember and type

Return ONLY the project name, nothing else. No quotes, no explanation, just the name.`,
                prompt: `Generate a creative project name for this project: ${description}`,
                temperature: 0.8,
            });

            console.log(`Generated name with fallback: ${result.text}`);
            const generatedName = result.text.trim().replace(/['"]/g, "");

            return NextResponse.json({ name: generatedName }, { status: 200 });
        }
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
