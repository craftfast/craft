import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { streamCodingResponse } from "@/lib/ai/agent";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { checkUserCreditAvailability, processAIUsage } from "@/lib/ai-usage";
import { getDefaultSelectedModel } from "@/lib/models/config";

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
        const session = await getSession();
        if (!session?.user?.email) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get user from database with personalization settings
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                email: true,
                name: true,
                responseTone: true,
                customInstructions: true,
                occupation: true,
                techStack: true,
                enableMemory: true,
                referenceChatHistory: true,
                enableWebSearch: true,
                enableImageGeneration: true,
            },
        });

        if (!user) {
            return new Response(
                JSON.stringify({ error: "User not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const { messages, taskType, projectFiles, projectId, tier } = await req.json();

        // Validate projectId
        if (!projectId) {
            return new Response(
                JSON.stringify({ error: "Project ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Validate and sanitize tier (only allow "fast" or "expert")
        const validTier: "fast" | "expert" = tier === "expert" ? "expert" : "fast";

        // Check if user has available credits before processing
        const creditAvailability = await checkUserCreditAvailability(user.id);

        if (!creditAvailability.allowed) {
            console.warn(`🚫 Monthly credit limit reached for user ${user.id}`);
            return new Response(
                JSON.stringify({
                    error: "Credit limit reached",
                    message: creditAvailability.reason || "Monthly credit limit reached. Credits refresh at the start of your next billing period.",
                    monthlyCreditsUsed: creditAvailability.monthlyCreditsUsed,
                    monthlyCreditsLimit: creditAvailability.monthlyCreditsLimit,
                    creditsRemaining: creditAvailability.creditsRemaining,
                }),
                { status: 429, headers: { "Content-Type": "application/json" } }
            );
        }

        // Log credit availability
        console.log(`💰 Credit Availability - Used: ${creditAvailability.monthlyCreditsUsed}/${creditAvailability.monthlyCreditsLimit || 'unlimited'}, Remaining: ${creditAvailability.creditsRemaining}`);

        // Get relevant user memories for context (if enabled)
        let userMemoryContext = '';
        if (user.enableMemory) {
            try {
                const { getRelevantMemories, formatMemoriesForPrompt } = await import('@/lib/memory/service');
                const memories = await getRelevantMemories({
                    userId: user.id,
                    projectId,
                    limit: 10,
                });
                if (memories.length > 0) {
                    userMemoryContext = formatMemoriesForPrompt(memories);
                    console.log(`🧠 Including ${memories.length} user memories in context`);
                }
            } catch (error) {
                console.warn('⚠️ Could not load user memories:', error);
            }
        }

        // Prepare personalization settings
        const personalization = {
            responseTone: user.responseTone,
            customInstructions: user.customInstructions,
            occupation: user.occupation,
            techStack: user.techStack,
            enableMemory: user.enableMemory,
            referenceChatHistory: user.referenceChatHistory,
            enableWebSearch: user.enableWebSearch,
            enableImageGeneration: user.enableImageGeneration,
        };

        // Get environment-aware system prompt with projectId, memory, and personalization
        const systemPrompt = getSystemPrompt(
            taskType || 'coding',
            projectFiles,
            projectId,
            userMemoryContext,
            personalization
        );

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

        // Get last user message for memory capture
        const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
        const userMessageText = typeof lastUserMessage?.content === 'string'
            ? lastUserMessage.content
            : Array.isArray(lastUserMessage?.content)
                ? lastUserMessage.content.find((c: { type: string }) => c.type === 'text')?.text || ''
                : '';

        // Use the centralized AI agent for smart routing and streaming
        const result = await streamCodingResponse({
            messages: formattedMessages,
            systemPrompt,
            projectFiles: projectFiles || {},
            conversationHistory: messages.slice(0, -1),
            userId: user.id, // Pass user ID to determine plan and model access
            tier: validTier, // Pass user's tier preference (fast/expert)
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

                // Capture memories from conversation (async, non-blocking) - only if enabled
                if (userMessageText && user.enableMemory) {
                    try {
                        const { captureMemoriesFromConversation } = await import('@/lib/memory/service');
                        captureMemoriesFromConversation({
                            userId: user.id,
                            userMessage: userMessageText,
                            projectId,
                        }).then((count) => {
                            if (count > 0) {
                                console.log(`🧠 Captured ${count} new memories from conversation`);
                            }
                        }).catch((err) => {
                            console.warn('⚠️ Memory capture failed:', err);
                        });
                    } catch (importError) {
                        console.warn('⚠️ Could not import memory service:', importError);
                    }
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
