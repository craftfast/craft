import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { AI_MODELS } from "@/lib/ai-models";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canUseModel } from "@/lib/ai-usage";
import { prisma } from "@/lib/db";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Create OpenRouter client
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

export async function POST(req: Request) {
    try {
        const { messages, taskType, projectFiles, selectedModel, teamId } = await req.json();

        // Get user session for plan verification
        const session = await getServerSession(authOptions);

        // Determine which model to use
        let modelName: string;

        if (selectedModel) {
            // User explicitly selected a model - verify they have access
            if (teamId && session?.user?.email) {
                const user = await prisma.user.findUnique({
                    where: { email: session.user.email },
                });

                if (user) {
                    // Check if user can access this model
                    const hasAccess = await canUseModel(teamId, selectedModel);

                    if (!hasAccess) {
                        return new Response(
                            JSON.stringify({
                                error: "Model not available",
                                message: "Upgrade your plan to access this model",
                            }),
                            {
                                status: 403,
                                headers: { "Content-Type": "application/json" },
                            }
                        );
                    }
                }
            }

            // Use the selected model
            const modelInfo = AI_MODELS[selectedModel];
            modelName = modelInfo?.id || selectedModel;
        } else {
            // Fallback: Use legacy task-based model selection
            modelName =
                taskType === "naming" || taskType === "general"
                    ? process.env.GROK_MODEL || "x-ai/grok-4-fast"
                    : process.env.CLAUDE_MODEL || "anthropic/claude-sonnet-4.5";
        }

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
