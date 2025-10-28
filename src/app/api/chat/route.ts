import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { streamCodingResponse } from "@/lib/ai/agent";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkUserCreditAvailability, processAIUsage } from "@/lib/ai-usage";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

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
        // Get authenticated session
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return new Response(
                JSON.stringify({ error: "User not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const { messages, taskType, projectFiles, projectId } = await req.json();

        // Validate projectId
        if (!projectId) {
            return new Response(
                JSON.stringify({ error: "Project ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if user has available credits before processing
        const creditAvailability = await checkUserCreditAvailability(user.id);

        if (!creditAvailability.allowed) {
            console.warn(`🚫 Daily credit limit reached for user ${user.id}`);
            return new Response(
                JSON.stringify({
                    error: "Credit limit reached",
                    message: creditAvailability.reason || "Daily credit limit reached. Credits refresh daily at midnight UTC.",
                    dailyCreditsUsed: creditAvailability.dailyCreditsUsed,
                    dailyCreditsLimit: creditAvailability.dailyCreditsLimit,
                    creditsRemaining: creditAvailability.creditsRemaining,
                }),
                { status: 429, headers: { "Content-Type": "application/json" } }
            );
        }

        // Log credit availability
        console.log(`💰 Credit Availability - Used: ${creditAvailability.dailyCreditsUsed}/${creditAvailability.dailyCreditsLimit || 'unlimited'}, Remaining: ${creditAvailability.creditsRemaining}`);

        // Get environment-aware system prompt with projectId
        const systemPrompt = getSystemPrompt(taskType || 'coding', projectFiles, projectId);

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

        console.log(`🤖 AI Chat Request - Task: ${taskType || 'coding'}${hasImages ? ' (with images)' : ''}`);
        if (projectFiles && Object.keys(projectFiles).length > 0) {
            console.log(`📁 Context: ${Object.keys(projectFiles).length} existing project files`);
        }

        // Use the centralized AI agent for smart routing and streaming
        const result = await streamCodingResponse({
            messages: formattedMessages,
            systemPrompt,
            projectFiles: projectFiles || {},
            conversationHistory: messages.slice(0, -1),
            // Track usage after stream completes
            onFinish: async (usageData) => {
                try {
                    await processAIUsage({
                        userId: user.id,
                        projectId,
                        model: usageData.model,
                        inputTokens: usageData.inputTokens,
                        outputTokens: usageData.outputTokens,
                        endpoint: '/api/chat',
                        callType: 'chat', // This is a chat interaction
                    });
                    console.log(`✅ Usage tracked - User: ${user.id}, Tokens: ${usageData.totalTokens}`);
                } catch (trackingError) {
                    console.error('❌ Failed to track usage:', trackingError);
                    // Don't fail the request if tracking fails
                }
            },
        });

        // AI SDK v5: Use toTextStreamResponse() for streaming responses
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
