import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { getSystemPrompt } from "@/lib/ai/system-prompts";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Create OpenRouter client
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

export async function POST(req: Request) {
    try {
        const { messages, taskType, projectFiles } = await req.json();

        // Determine which model to use based on task type
        // taskType can be: 'coding', 'naming', 'general'
        const modelName =
            taskType === "naming" || taskType === "general"
                ? process.env.GROK_MODEL || "x-ai/grok-4-fast"
                : process.env.CLAUDE_MODEL || "anthropic/claude-sonnet-4.5";

        // Get environment-aware system prompt
        const systemPrompt = getSystemPrompt(taskType || 'coding', projectFiles);

        console.log(`🤖 AI Chat Request - Model: ${modelName}, Task: ${taskType || 'coding'}`);
        if (projectFiles && Object.keys(projectFiles).length > 0) {
            console.log(`📁 Context: ${Object.keys(projectFiles).length} existing project files`);
        }

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
