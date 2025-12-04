import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { streamCodingResponse } from "@/lib/ai/agent";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";
import { checkUserBalance, trackAIUsage } from "@/lib/ai-usage";
import { SSEStreamWriter } from "@/lib/ai/sse-events";
import { createOrchestrator } from "@/lib/ai/orchestrator/orchestrator-agent";
import { chatRateLimiter, checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getProjectKnowledge, formatKnowledgeForPrompt } from "@/lib/knowledge/service";

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

        // Rate limiting check
        const rateLimitResult = await checkRateLimit(chatRateLimiter, session.user.email);
        if (!rateLimitResult.success) {
            return new Response(
                JSON.stringify({
                    error: "Rate limit exceeded",
                    message: "Too many requests. Please wait a moment before trying again.",
                    retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        ...getRateLimitHeaders(rateLimitResult),
                    },
                }
            );
        }

        // Get user from database with personalization settings and model preferences
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
                enableCodeExecution: true,
                preferredCodingModel: true,
                enabledCodingModels: true,
            },
        });

        if (!user) {
            return new Response(
                JSON.stringify({ error: "User not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const { messages, taskType, projectFiles, projectId, tier, selectedModel, enableAgentLoop = true, useOrchestrator = false } = await req.json();

        // Validate projectId
        if (!projectId) {
            return new Response(
                JSON.stringify({ error: "Project ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Use selectedModel if provided, otherwise fall back to tier-based selection
        const validTier: "fast" | "expert" = tier === "expert" ? "expert" : "fast";

        // Generate session ID for agent loop coordination
        const sessionId = `session-${user.id}-${projectId}-${Date.now()}`;

        // Check if user has sufficient balance for the operation
        // Estimate cost assuming ~10K tokens (will be deducted after actual usage)
        const estimatedCost = 0.10; // Rough estimate for a typical chat request
        const balanceCheck = await checkUserBalance(user.id, estimatedCost);

        if (!balanceCheck.allowed) {
            logger.ai.warn(`Insufficient balance for user ${user.id}`);
            return new Response(
                JSON.stringify({
                    error: "Insufficient balance",
                    message: balanceCheck.reason || "Please add credits to continue.",
                    balance: balanceCheck.balance,
                    estimatedCost: balanceCheck.estimatedCost,
                }),
                { status: 429, headers: { "Content-Type": "application/json" } }
            );
        }

        // Log balance availability
        logger.ai.debug(`Balance Check - Available: $${balanceCheck.balance.toFixed(2)}, Estimated Cost: $${balanceCheck.estimatedCost.toFixed(2)}`);

        // ============================================================================
        // PHASE 3: ORCHESTRATOR MODE (Multi-Agent System)
        // ============================================================================
        // If orchestrator mode is enabled, route through orchestrator agent first
        if (useOrchestrator) {
            logger.ai.info('Using Orchestrator Mode (Phase 3)');

            const sseWriter = new SSEStreamWriter();

            const orchestratorStream = new ReadableStream({
                async start(controller) {
                    sseWriter.setController(controller);

                    try {
                        // Create orchestrator
                        const orchestrator = await createOrchestrator({
                            userId: user.id,
                            projectId,
                            sseWriter,
                        });

                        // Get last user message
                        const lastMessage = messages[messages.length - 1];
                        const userMessage = typeof lastMessage?.content === 'string'
                            ? lastMessage.content
                            : Array.isArray(lastMessage?.content)
                                ? lastMessage.content.find((c: { type: string }) => c.type === 'text')?.text || ''
                                : '';

                        // Process message through orchestrator
                        const textStream = await orchestrator.processMessage(userMessage);

                        // Stream orchestrator's response
                        for await (const chunk of textStream) {
                            sseWriter.writeTextDelta(chunk);
                        }

                        // Get progress and emit final event
                        const progress = await orchestrator.getProgress();
                        if (progress) {
                            sseWriter.writeOrchestratorProgress(
                                progress.totalTasks,
                                progress.completedTasks,
                                progress.failedTasks,
                                progress.percentComplete
                            );
                        }

                        // Save state
                        await orchestrator.saveState();

                        // Emit done
                        sseWriter.writeDone();

                    } catch (error) {
                        console.error('❌ Orchestrator error:', error);
                        controller.error(error);
                    } finally {
                        controller.close();
                    }
                },
            });

            return new Response(orchestratorStream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        // ============================================================================
        // STANDARD MODE (Direct Coding Agent - Phase 1 & 2)
        // ============================================================================

        // Load user memories if enabled (very selective - only important info)
        let userMemoryContext = '';
        if (user.enableMemory) {
            try {
                const { getRelevantMemories, formatMemoriesForPrompt } = await import('@/lib/memory/service');
                const memories = await getRelevantMemories({
                    userId: user.id,
                    projectId,
                    limit: 5, // Reduced limit since memories are now very selective
                });
                if (memories.length > 0) {
                    userMemoryContext = formatMemoriesForPrompt(memories);
                    logger.ai.debug(`🧠 Including ${memories.length} user memories in context`);
                }
            } catch (error) {
                logger.ai.warn('⚠️ Could not load user memories:', error);
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
            enableCodeExecution: user.enableCodeExecution,
        };

        // ============================================================================
        // FEATURE DETECTION & PERMISSION CHECK
        // ============================================================================
        // Detect what features are needed and check if user has them enabled

        // Get the last user message for analysis
        const lastMessage = messages[messages.length - 1];
        const lastMessageContent = typeof lastMessage?.content === 'string'
            ? lastMessage.content
            : Array.isArray(lastMessage?.content)
                ? lastMessage.content.find((c: { type: string }) => c.type === 'text')?.text || ''
                : '';

        // Check if message contains images
        const hasImages = messages.some((m: { content: MessageContent }) => {
            if (Array.isArray(m.content)) {
                return m.content.some((c) => c.type === 'image_url' && (c as ImageUrlContent).image_url?.url);
            }
            return false;
        });

        // Check if message likely needs web search (simple keyword detection)
        const webSearchKeywords = [
            'search the web', 'search online', 'look up', 'find online',
            'latest news', 'current', 'recent updates', 'what is happening',
            'search for', 'google', 'look online', 'find information about'
        ];
        const needsWebSearch = webSearchKeywords.some(keyword =>
            lastMessageContent.toLowerCase().includes(keyword.toLowerCase())
        );

        // Check if message likely needs image generation
        const imageGenKeywords = [
            'generate image', 'create image', 'make an image', 'draw',
            'generate a picture', 'create a picture', 'design an image',
            'generate artwork', 'create artwork', 'make artwork',
            'generate illustration', 'create illustration'
        ];
        const needsImageGeneration = imageGenKeywords.some(keyword =>
            lastMessageContent.toLowerCase().includes(keyword.toLowerCase())
        );

        // Build list of disabled features that are needed
        const disabledFeatures: string[] = [];

        if (needsWebSearch && !user.enableWebSearch) {
            disabledFeatures.push('**Web Search** - Enable this to search the web for current information');
        }

        if (needsImageGeneration && !user.enableImageGeneration) {
            disabledFeatures.push('**Image Generation** - Enable this to generate images and artwork');
        }

        // If required features are disabled, return a helpful message
        if (disabledFeatures.length > 0) {
            const sseWriter = new SSEStreamWriter();

            const suggestionStream = new ReadableStream({
                start(controller) {
                    sseWriter.setController(controller);

                    const message = `I'd love to help with that! However, this request requires features that are currently disabled in your settings.\n\n**Features needed:**\n${disabledFeatures.map(f => `- ${f}`).join('\n')}\n\n**To enable these features:**\n1. Go to **Settings** → **Personalization**\n2. Enable the required features\n3. Try your request again\n\nOnce enabled, I'll be able to fully assist you with this request! 🚀`;

                    sseWriter.writeTextDelta(message);
                    sseWriter.writeDone({ totalTokens: 0, inputTokens: 0, outputTokens: 0 });
                }
            });

            return new Response(suggestionStream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        // Load project knowledge base (PRDs, design docs, etc.)
        let knowledgeContext = '';
        try {
            const knowledge = await getProjectKnowledge(projectId);
            const hasKnowledge = knowledge.textFiles.length > 0 ||
                knowledge.imageFiles.length > 0 ||
                knowledge.documentFiles.length > 0;
            if (hasKnowledge) {
                knowledgeContext = formatKnowledgeForPrompt(knowledge);
                logger.ai.debug(`📚 Including ${knowledge.textFiles.length} text files, ${knowledge.imageFiles.length} images in context`);
            }
        } catch (error) {
            logger.ai.warn('⚠️ Could not load project knowledge:', error);
        }

        // Combine memory and knowledge context
        const additionalContext = [userMemoryContext, knowledgeContext].filter(Boolean).join('\n\n');

        // Get environment-aware system prompt with projectId, memory, knowledge, and personalization
        const systemPrompt = getSystemPrompt(
            taskType || 'coding',
            projectFiles,
            projectId,
            additionalContext,
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
                    const textContent = textPart?.text || 'Please analyze this image.'; // ✅ Never send empty text
                    return {
                        role: m.role,
                        content: [
                            { type: 'text' as const, text: textContent },
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
                const fallbackText = textPart?.text || (m.content[0] as TextContent)?.text || 'Continue.';
                return {
                    role: m.role,
                    content: fallbackText,
                };
            }
            // Regular text-only messages
            return {
                role: m.role,
                content: m.content || 'Continue.', // ✅ Never send empty content
            };
        });

        // Filter out any messages with empty content (safety check)
        const validMessages = formattedMessages.filter((m: { content: unknown }) => {
            if (typeof m.content === 'string') {
                return m.content.trim().length > 0;
            }
            if (Array.isArray(m.content)) {
                return m.content.length > 0;
            }
            return true;
        });

        // Check if any messages contain images
        const hasImages = validMessages.some((m: { content: unknown }) =>
            Array.isArray(m.content) && m.content.some((c: { type: string }) => c.type === 'image')
        );

        logger.ai.info(`Chat Request - Task: ${taskType || 'coding'}${hasImages ? ' (with images)' : ''}`);
        if (projectFiles && Object.keys(projectFiles).length > 0) {
            logger.ai.debug(`Context: ${Object.keys(projectFiles).length} existing project files`);
        }

        // Get last user message for memory capture
        const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
        const _userMessageText = typeof lastUserMessage?.content === 'string'
            ? lastUserMessage.content
            : Array.isArray(lastUserMessage?.content)
                ? lastUserMessage.content.find((c: { type: string }) => c.type === 'text')?.text || ''
                : '';

        // ⚡ SSE: Create custom readable stream for Server-Sent Events
        // This allows us to interleave text deltas and tool execution events
        const sseWriter = new SSEStreamWriter();
        let textStreamReader: ReadableStreamDefaultReader<string> | null = null;

        const sseStream = new ReadableStream({
            async start(controller) {
                sseWriter.setController(controller);

                try {
                    // Start streaming from AI with SSE writer for tool events
                    const result = await streamCodingResponse({
                        messages: validMessages, // ✅ Use validated messages
                        systemPrompt,
                        projectFiles: projectFiles || {},
                        conversationHistory: messages.slice(0, -1),
                        userId: user.id,
                        tier: validTier,
                        preferredModel: selectedModel || user.preferredCodingModel, // Use request model or user's preferred model
                        enabledModels: user.enabledCodingModels, // User's enabled models list
                        sseWriter, // ⚡ Pass SSE writer for real-time tool events
                        projectId, // ⚡ Phase 2: Project ID for agent loop
                        sessionId, // ⚡ Phase 2: Session ID for agent loop
                        enableAgentLoop, // ⚡ Phase 2: Enable Think→Act→Observe→Reflect
                        onFinish: async (usageData) => {
                            try {
                                await trackAIUsage({
                                    userId: user.id,
                                    projectId,
                                    model: usageData.model, // OpenRouter model ID
                                    inputTokens: usageData.inputTokens,
                                    outputTokens: usageData.outputTokens,
                                    providerCostUsd: usageData.providerCostUsd, // Actual cost from OpenRouter
                                    endpoint: '/api/chat',
                                    callType: 'chat',
                                });
                                logger.ai.debug(`Usage tracked - User: ${user.id}, Tokens: ${usageData.totalTokens}`);
                            } catch (trackingError) {
                                logger.ai.error('Failed to track usage:', trackingError);
                            }

                            // Capture memories if enabled (very selective - only important info)
                            if (userMessageText && user.enableMemory) {
                                try {
                                    const { captureMemoriesFromConversation } = await import('@/lib/memory/service');
                                    captureMemoriesFromConversation({
                                        userId: user.id,
                                        userMessage: userMessageText,
                                        projectId,
                                    }).then((count) => {
                                        if (count > 0) {
                                            logger.ai.debug(`🧠 Captured ${count} new memories from conversation`);
                                        }
                                    }).catch((err) => {
                                        logger.ai.warn('⚠️ Memory capture failed:', err);
                                    });
                                } catch (importError) {
                                    logger.ai.warn('⚠️ Could not import memory service:', importError);
                                }
                            }

                            // Emit done event
                            sseWriter.writeDone({
                                totalTokens: usageData.totalTokens,
                                inputTokens: usageData.inputTokens,
                                outputTokens: usageData.outputTokens,
                            });
                        },
                    });

                    // Get text stream from AI SDK result
                    textStreamReader = result.textStream.getReader();

                    // Read and forward text chunks as SSE events
                    while (true) {
                        const { done, value } = await textStreamReader.read();
                        if (done) break;

                        // Emit text-delta event
                        if (value) {
                            sseWriter.writeTextDelta(value);
                        }
                    }
                } catch (error) {
                    logger.ai.error('SSE stream error:', error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            },
            cancel() {
                logger.ai.debug('SSE stream cancelled by client');
                textStreamReader?.cancel();
            },
        });

        // Return SSE stream with proper headers
        return new Response(sseStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        logger.ai.error("Chat Error:", error);

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
