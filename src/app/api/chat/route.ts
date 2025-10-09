import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Create OpenRouter client
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

export async function POST(req: Request) {
    try {
        const { messages, taskType } = await req.json();

        // Determine which model to use based on task type
        // taskType can be: 'coding', 'naming', 'general'
        const modelName =
            taskType === "naming" || taskType === "general"
                ? process.env.GROK_MODEL || "x-ai/grok-4-fast"
                : process.env.CLAUDE_MODEL || "anthropic/claude-sonnet-4.5";

        // System prompts based on task type
        const systemPrompts = {
            coding: `You are an expert Next.js developer assistant. You help build modern web applications using:
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling (using ONLY neutral colors: neutral-*, stone-*, gray-*)
- React 19
- Prisma for database operations

Design System Rules:
- Use ONLY neutral colors (neutral-*, stone-*, gray-*)
- All interactive elements MUST have rounded corners (rounded-full, rounded-lg, rounded-xl, rounded-2xl)
- Support dark mode with dark: variants
- Never use colored variants (blue, red, green, etc.)

Provide clear, concise, and production-ready code. Focus on best practices and modern patterns.`,
            naming: `You are a creative assistant that helps generate concise, memorable project names. 
Keep names short (1-3 words), lowercase, and descriptive. Suggest 3-5 options when asked.`,
            general: `You are a helpful assistant for a Next.js development tool called Craft. 
Provide clear, concise answers to user questions about their project.`,
        };

        const systemPrompt =
            systemPrompts[taskType as keyof typeof systemPrompts] ||
            systemPrompts.general;

        const result = streamText({
            model: openrouter.chat(modelName),
            system: systemPrompt,
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("AI Chat Error:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to process chat request",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
