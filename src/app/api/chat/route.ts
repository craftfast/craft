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

// Types for message content
interface TextContent {
    type: 'text';
    text: string;
}

interface ImageUrlContent {
    type: 'image_url';
    image_url: { url?: string };
}

type MessageContent = string | (TextContent | ImageUrlContent)[];

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

        // Convert messages to AI SDK format
        const formattedMessages = messages.map((m: { role: string; content: MessageContent }) => {
            // Handle messages with image_url format (from frontend)
            if (Array.isArray(m.content)) {
                const textPart = m.content.find((c): c is TextContent => c.type === 'text');
                const imageParts = m.content.filter((c): c is ImageUrlContent => c.type === 'image_url');

                // If there are images with valid URLs
                if (imageParts.length > 0 && imageParts.some((p) => p.image_url?.url)) {
                    return {
                        role: m.role,
                        content: [
                            { type: 'text' as const, text: textPart?.text || '' },
                            ...imageParts
                                .filter((p) => p.image_url?.url) // Only include images with URLs
                                .map((p) => ({
                                    type: 'image' as const,
                                    image: p.image_url.url as string,
                                })),
                        ],
                    };
                }
                // Fallback to text only if images are missing URLs
                return {
                    role: m.role,
                    content: textPart?.text || (m.content[0] as TextContent)?.text || '',
                };
            }
            // Regular text-only messages
            return {
                role: m.role,
                content: m.content,
            };
        });

        // Check if any messages contain images
        const hasImages = formattedMessages.some((m: { content: unknown }) =>
            Array.isArray(m.content) && m.content.some((c: { type: string }) => c.type === 'image')
        );

        console.log(`🤖 AI Chat Request - Model: ${modelName}, Task: ${taskType || 'coding'}${hasImages ? ' (with images)' : ''}`);
        if (projectFiles && Object.keys(projectFiles).length > 0) {
            console.log(`📁 Context: ${Object.keys(projectFiles).length} existing project files`);
        }

        const result = streamText({
            model: openrouter.chat(modelName),
            system: systemPrompt,
            messages: formattedMessages,
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
