/**
 * Centralized AI Agent Service
 * 
 * This is the single source of truth for all AI operations in Craft.
 * 
 * MODEL SELECTION:
 * - User's preferred model for each use case is stored in their preferences
 * - Models are loaded from database via modelService
 * - System models (orchestrator, memory) are fixed and not user-selectable
 * 
 * Model Configuration is managed via:
 * - Database: AIModel, AIModelCapabilities, AIModelPricing tables
 * - Service: src/lib/models/service.ts (modelService singleton)
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { generateText, streamText, stepCountIs } from "ai";
import { modelService, DEFAULT_MODEL_IDS, type ModelProvider } from "@/lib/models";
import { tools } from "@/lib/ai/tools";
import { SSEStreamWriter } from "@/lib/ai/sse-events";
import { createAgentLoop, type AgentLoopCoordinator } from "@/lib/ai/agent-loop-coordinator";
import { setToolContext, clearToolContext } from "@/lib/ai/tool-context";
import { prisma } from "@/lib/db";
import { calculateUsageCost, formatCostBreakdown, type AIUsage } from "@/lib/ai/usage-cost-calculator";

// Create AI provider clients
// Provider selection is handled dynamically based on model configuration
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

const xai = createXai({
    apiKey: process.env.XAI_API_KEY || "",
});

// ============================================================================
// CODING AGENT
// ============================================================================
// Uses user's preferred coding model from their settings

interface CodingStreamOptions {
    messages: unknown[]; // Pre-formatted messages from the API
    systemPrompt: string;
    projectFiles?: Record<string, string>;
    conversationHistory?: Array<{ role: string; content: string }>;
    userId: string; // User ID to get their preferred model
    sseWriter?: SSEStreamWriter; // Optional: SSE writer for real-time tool events
    projectId?: string; // Optional: project ID for agent loop state management
    sessionId?: string; // Optional: session ID for agent loop coordination
    enableAgentLoop?: boolean; // Optional: enable Think→Act→Observe→Reflect pattern (Phase 2)
    onFinish?: (params: {
        model: string; // OpenRouter model ID (e.g., "anthropic/claude-sonnet-4.5")
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        providerCostUsd?: number; // Actual cost from OpenRouter (if available)
    }) => void | Promise<void>;
}

/**
 * Detect requirements from message content using Grok 4 Fast (Orchestrator)
 * Uses AI to intelligently analyze if web search or other capabilities are needed
 */
async function detectRequirements(messages: unknown[], systemPrompt: string): Promise<{
    hasImages: boolean;
    hasWebSearchRequest: boolean;
    needsFunctionCalling: boolean;
}> {
    let hasImages = false;
    let hasWebSearchRequest = false;
    const needsFunctionCalling = true; // Always enable function calling for coding tasks

    // Check if messages contain image content
    // AI SDK format: { role: 'user', content: [{ type: 'image', ... }] }
    const messagesArray = Array.isArray(messages) ? messages : [];
    for (const msg of messagesArray) {
        if (msg && typeof msg === 'object' && 'content' in msg) {
            const content = (msg as { content?: unknown }).content;
            if (Array.isArray(content)) {
                hasImages = content.some((part: unknown) =>
                    part && typeof part === 'object' && 'type' in part && part.type === 'image'
                );
                if (hasImages) break;
            }
        }
    }

    // Use orchestrator model to intelligently detect if web search is needed
    try {
        const lastMessage = messagesArray[messagesArray.length - 1];
        const userPrompt = lastMessage && typeof lastMessage === 'object' && 'content' in lastMessage
            ? JSON.stringify((lastMessage as { content?: unknown }).content)
            : '';

        const analysisPrompt = `Analyze this coding request and determine if it requires real-time web search:

User request: ${userPrompt}

Does this request need web search? Answer with JSON:
{
  "needsWebSearch": boolean,
  "reason": "brief explanation"
}

Requirements for web search:
- Asking about current events, news, or "what's happening"
- Requesting information about recent updates or releases
- Explicitly asking to "search" or "look up" information
- Questions about real-time data or latest versions

NOT requiring web search:
- Standard coding tasks
- Creating components or features
- Debugging code
- General programming questions
- URLs in context (just references, not search requests)`;

        // Use orchestrator model from modelService (system-only model)
        const orchestratorModelId = await modelService.getOrchestratorModel();

        let provider, modelPath, providerType;
        let modelInstance;
        let useOpenRouterFallback = false;

        try {
            ({ provider, modelPath, providerType } = await getModelProvider(orchestratorModelId, useOpenRouterFallback));

            switch (providerType) {
                case "x-ai":
                    modelInstance = (provider as ReturnType<typeof createXai>)(modelPath);
                    break;
                case "openrouter":
                    modelInstance = (provider as ReturnType<typeof createOpenRouter>).chat(modelPath);
                    break;
                default:
                    throw new Error(`Unsupported provider type for orchestrator: ${providerType}`);
            }
        } catch (directProviderError) {
            console.warn(`⚠️ Direct provider failed for requirement detection, falling back to OpenRouter:`, directProviderError);
            useOpenRouterFallback = true;
            ({ provider, modelPath } = await getModelProvider(orchestratorModelId, useOpenRouterFallback));
            modelInstance = (provider as ReturnType<typeof createOpenRouter>).chat(modelPath);
        }

        const result = await generateText({
            model: modelInstance,
            prompt: analysisPrompt,
            maxOutputTokens: 200,
        });

        const analysis = JSON.parse(result.text);
        hasWebSearchRequest = analysis.needsWebSearch === true;

        if (hasWebSearchRequest) {
            console.log(`🔍 Web search detected: ${analysis.reason}`);
        }
    } catch (error) {
        console.warn('⚠️ Could not analyze web search requirement, using fallback detection');
        // Fallback to simple keyword detection
        const textToCheck = systemPrompt + JSON.stringify(messagesArray.slice(-2));
        const webSearchKeywords = ['search the web', 'look up online', 'latest news', 'what is happening'];
        hasWebSearchRequest = webSearchKeywords.some(keyword =>
            textToCheck.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    return { hasImages, hasWebSearchRequest, needsFunctionCalling };
}

/**
 * Provider info return type for getModelProvider
 */
export interface ModelProviderInfo {
    provider: ReturnType<typeof createAnthropic> | ReturnType<typeof createOpenRouter> | ReturnType<typeof createOpenAI> | ReturnType<typeof createGoogleGenerativeAI> | ReturnType<typeof createXai>;
    modelPath: string;
    displayName: string;
    providerType: "anthropic" | "openrouter" | "openai" | "google" | "x-ai";
    isFallback: boolean;
}

/**
 * Get the appropriate AI provider and model name for a given model ID
 * Uses modelService as single source of truth (database-first with JSON fallback)
 * 
 * FALLBACK STRATEGY:
 * - Primary: Use direct provider (Anthropic, OpenAI, Google, XAI)
 * - Fallback: Use OpenRouter if direct provider fails (5% commission but reliability)
 */
async function getModelProvider(modelId: string, useOpenRouterFallback = false): Promise<ModelProviderInfo> {
    // Get model config from modelService (database-first, then JSON fallback)
    const modelConfig = await modelService.getModel(modelId);

    if (!modelConfig) {
        console.warn(`⚠️ Unknown model: ${modelId}, falling back to default coding model`);

        // Ultimate fallback - use the default coding model
        const fallbackModelId = DEFAULT_MODEL_IDS.coding;
        const fallbackConfig = await modelService.getModel(fallbackModelId);

        if (!fallbackConfig) {
            throw new Error("Configuration error: Default coding model not found");
        }

        // Recursively call with the fallback model
        return getModelProvider(fallbackModelId, useOpenRouterFallback);
    }

    // If OpenRouter fallback is requested, use OpenRouter regardless of original provider
    if (useOpenRouterFallback && modelConfig.provider !== "openrouter") {
        console.log(`🔄 Using OpenRouter as fallback for ${modelConfig.displayName}`);
        return {
            provider: openrouter,
            modelPath: modelId, // Use the model ID which includes provider prefix (e.g., "anthropic/claude-sonnet-4.5")
            displayName: `${modelConfig.displayName} (via OpenRouter)`,
            providerType: "openrouter",
            isFallback: true,
        };
    }

    // Return the appropriate provider based on model config
    let provider;
    let providerType: "anthropic" | "openrouter" | "openai" | "google" | "x-ai";

    switch (modelConfig.provider) {
        case "anthropic":
            provider = anthropic;
            providerType = "anthropic";
            break;
        case "openai":
            provider = openai;
            providerType = "openai";
            break;
        case "google":
            provider = google;
            providerType = "google";
            break;
        case "x-ai":
            provider = xai;
            providerType = "x-ai";
            break;
        case "openrouter":
        default:
            provider = openrouter;
            providerType = "openrouter";
            break;
    }

    // IMPORTANT: OpenRouter requires model ID format (e.g., "anthropic/claude-sonnet-4.5")
    // Direct providers use model alias/name (e.g., "claude-sonnet-4-5" for Anthropic)
    const modelPath = modelConfig.provider === "openrouter"
        ? modelId  // OpenRouter format: provider/model-name
        : modelConfig.modelPath; // Direct provider format: specific model version

    return {
        provider,
        modelPath,
        displayName: modelConfig.displayName,
        providerType,
        isFallback: false,
    };
}

/**
 * Stream coding responses using intelligent model selection
 * Uses user's preferred coding model from settings
 * 
 * Phase 2: Supports agent loop coordination for multi-step reasoning
 */
export async function streamCodingResponse(options: CodingStreamOptions) {
    const {
        messages,
        systemPrompt,
        projectFiles = {},
        conversationHistory = [],
        userId,
        sseWriter,
        projectId,
        sessionId,
        enableAgentLoop = false,
        onFinish
    } = options;

    // Note: E2B auto-pause handles sandbox lifecycle automatically
    // No manual locking needed - sandbox stays alive during active usage

    // ⚡ Phase 2: Initialize agent loop if enabled
    let agentLoop: AgentLoopCoordinator | undefined;
    // TEMPORARILY DISABLED: Agent loop causing empty message issues with Claude
    // Will re-enable after fixing message formatting
    if (enableAgentLoop && projectId && sessionId) {
        console.log('🔄 Agent Loop enabled - Think→Act→Observe→Reflect');

        // Get last user message for analysis
        const lastMessage = messages[messages.length - 1];
        const userMessage = typeof lastMessage === 'object' && lastMessage !== null && 'content' in lastMessage
            ? String((lastMessage as { content: unknown }).content)
            : '';

        agentLoop = createAgentLoop({
            sessionId,
            projectId,
            userId,
            userMessage,
            projectFiles,
            conversationHistory,
            sseWriter,
        });

        // Execute THINK phase before streaming
        try {
            await agentLoop.executeTurn(userMessage);
        } catch (error) {
            console.error('❌ Agent loop initialization failed:', error);
            // Continue without agent loop if it fails
            agentLoop = undefined;
        }
    }

    // Detect requirements from messages
    const { hasImages, hasWebSearchRequest, needsFunctionCalling } = await detectRequirements(messages, systemPrompt);

    // Get the coding model from user's settings (single model per use case)
    const codingModel = await modelService.getCodingModel(userId);

    // Try direct provider first, with OpenRouter as fallback
    let provider, modelPath, displayName, providerType, isFallback;
    let modelInstance;
    let useOpenRouterFallback = false;

    try {
        ({ provider, modelPath, displayName, providerType, isFallback } = await getModelProvider(codingModel, useOpenRouterFallback));

        console.log(`⚡ AI Agent: Using ${displayName} (${codingModel}) for coding with TOOL USE enabled`);
        if (isFallback) {
            console.log(`🔄 Using OpenRouter fallback (5% commission)`);
        }
        console.log(`🛠️ Available tools: ${Object.keys(tools).join(', ')}`);

        if (Object.keys(projectFiles).length > 0) {
            console.log(`📁 Context: ${Object.keys(projectFiles).length} existing project files`);
        }

        // Different providers use different call patterns
        // Anthropic: anthropic(modelPath)
        // OpenRouter: openrouter.chat(modelPath)
        // OpenAI: openai(modelPath) or openai.chat(modelPath)
        // Google: google(modelPath)
        // xAI: xai(modelPath)
        switch (providerType) {
            case "anthropic":
                modelInstance = (provider as ReturnType<typeof createAnthropic>)(modelPath);
                break;
            case "openai":
                // OpenAI models can use both formats, prefer direct call
                modelInstance = (provider as ReturnType<typeof createOpenAI>)(modelPath);
                break;
            case "google":
                modelInstance = (provider as ReturnType<typeof createGoogleGenerativeAI>)(modelPath);
                break;
            case "x-ai":
                modelInstance = (provider as ReturnType<typeof createXai>)(modelPath);
                break;
            case "openrouter":
            default:
                modelInstance = (provider as ReturnType<typeof createOpenRouter>).chat(modelPath);
                break;
        }
    } catch (directProviderError) {
        // If direct provider fails, retry with OpenRouter fallback
        console.warn(`⚠️ Direct provider failed, falling back to OpenRouter:`, directProviderError);
        useOpenRouterFallback = true;

        ({ provider, modelPath, displayName, providerType, isFallback } = await getModelProvider(codingModel, useOpenRouterFallback));

        console.log(`🔄 Retrying with OpenRouter fallback: ${displayName}`);
        modelInstance = (provider as ReturnType<typeof createOpenRouter>).chat(modelPath);
    }

    // Track tool execution timing for SSE events
    const toolStartTimes = new Map<string, number>();

    // Get sandbox ID if project has one (Phase 3)
    let sandboxId: string | undefined;
    if (projectId) {
        try {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { sandboxId: true },
            });
            sandboxId = project?.sandboxId || undefined;
        } catch (error) {
            console.warn('⚠️ Could not fetch sandbox ID:', error);
        }
    }

    // Set tool context so tools can access SSE writer, project info, and sandbox
    setToolContext({
        sseWriter,
        projectId,
        userId,
        sessionId,
        sandboxId, // Phase 3: Sandbox ID for tools that need it
        onStatusUpdate: (message: string, toolCallId?: string) => {
            if (sseWriter) {
                sseWriter.writeStatusUpdate(message, toolCallId);
            }
        },
    });

    // Stream the response with TOOLS ENABLED and usage tracking
    // ⚡ CRITICAL FIX: Use stopWhen to allow multiple tool execution rounds
    // This ensures the agent continues calling tools until the task is complete
    const result = streamText({
        model: modelInstance,
        system: systemPrompt,
        messages: messages as never, // AI SDK will handle the validation
        tools, // ⚡ PHASE 1: ENABLE ALL TOOLS
        stopWhen: stepCountIs(10), // ⚡ CRITICAL: Allow up to 10 steps (tool execution rounds) to complete the task
        // ⚡ SSE: Emit tool events in real-time as they execute
        onStepFinish: ({ toolCalls, toolResults }) => {
            // Track tool calls that just started
            if (toolCalls && toolCalls.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                toolCalls.forEach((tc: any) => {
                    const startTime = Date.now();
                    const toolCallId = tc.toolCallId || tc.id || String(Date.now());
                    const toolName = tc.toolName || tc.name || 'unknown';
                    const args = tc.args || tc.arguments || {};

                    toolStartTimes.set(toolCallId, startTime);

                    console.log(`🔧 Tool started: ${toolName} (${toolCallId})`);

                    // ⚡ Phase 2: Track in agent loop
                    if (agentLoop) {
                        agentLoop.trackToolExecution(toolCallId, toolName, args as Record<string, unknown>);
                    }

                    // Emit SSE event: tool-call-start
                    if (sseWriter) {
                        sseWriter.writeToolCallStart(toolCallId, toolName, args as Record<string, unknown>);
                    }
                });
            }

            // Track tool results that just completed
            if (toolResults && toolResults.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                toolResults.forEach((tr: any) => {
                    const toolCallId = tr.toolCallId || tr.id || String(Date.now());
                    const toolName = tr.toolName || tr.name || 'unknown';
                    const result = tr.result || tr.output;
                    const error = tr.error;
                    const startTime = toolStartTimes.get(toolCallId) || Date.now();

                    console.log(`✅ Tool completed: ${toolName} (${toolCallId})`);

                    // ⚡ Phase 2: Update agent loop state
                    if (agentLoop) {
                        agentLoop.updateToolExecution(toolCallId, result, error);
                    }

                    // Emit SSE event: tool-call-complete
                    if (sseWriter) {
                        sseWriter.writeToolCallComplete(toolCallId, toolName, error ? 'error' : 'success', {
                            result,
                            error,
                            startedAt: startTime,
                        });

                        // ⚡ SPECIAL: If triggerPreview tool completed successfully, emit preview-ready event
                        if (toolName === 'triggerPreview' && !error && result && projectId) {
                            const previewResult = result as { success?: boolean; filesGenerated?: number };
                            if (previewResult.success) {
                                console.log('🎬 Emitting preview-ready event to frontend');
                                sseWriter.writePreviewReady(
                                    projectId,
                                    previewResult.filesGenerated || 0,
                                    'Files ready for preview'
                                );
                            }
                        }
                    }
                });
            }
        },
        onFinish: async ({ usage, toolCalls, toolResults }) => {
            // Note: E2B auto-pause handles sandbox lifecycle automatically

            // Clean up tool context
            clearToolContext();

            console.log('🔍 Stream finished');
            console.log(`🔧 Tool calls made: ${toolCalls?.length || 0}`);
            console.log(`📝 Tool results: ${toolResults?.length || 0}`);

            // Log which tools were used
            if (toolCalls && toolCalls.length > 0) {
                const toolNames = toolCalls.map((tc: { toolName: string }) => tc.toolName).join(', ');
                console.log(`🛠️ Tools used: ${toolNames}`);
            }

            if (usage) {
                // AI SDK v5 with Anthropic/OpenRouter - uses promptTokens/completionTokens
                const usageData = usage as Record<string, number | undefined>;
                const inputTokens =
                    usageData.promptTokens ||       // ✅ AI SDK v5 primary format
                    usageData.inputTokens ||        // Fallback
                    usageData.input_tokens ||       // Fallback
                    usageData.prompt_tokens || 0;   // Snake case fallback

                const outputTokens =
                    usageData.completionTokens ||    // ✅ AI SDK v5 primary format
                    usageData.outputTokens ||        // Fallback
                    usageData.output_tokens ||       // Fallback
                    usageData.completion_tokens || 0;// Snake case fallback

                const totalTokens =
                    usageData.totalTokens ||
                    (inputTokens + outputTokens);

                // ============================================================================
                // COST CALCULATION USING COMPREHENSIVE CALCULATOR
                // ============================================================================
                // Uses usage-cost-calculator.ts for accurate, provider-specific cost calculation
                // Automatically handles:
                // - Standard input/output tokens
                // - Prompt caching (creation & reads)
                // - Reasoning tokens (OpenAI, XAI)
                // - Multimodal tokens (audio, video, images)
                // - Image generation costs
                // - Tool usage costs (web search, code execution)
                // - Long context premium pricing
                // - Batch API discounts
                // ============================================================================

                // OpenRouter provides cost directly in usageData.cost
                // Direct providers (Anthropic, OpenAI, Google, xAI) require manual calculation
                let providerCostUsd = usageData.cost as number | undefined;

                if (!providerCostUsd) {
                    // Direct provider - calculate cost manually
                    const modelConfig = await modelService.getModel(codingModel);
                    console.log(`💳 Calculating cost for direct provider: ${modelConfig?.provider || 'unknown'}`);
                    try {
                        // Debug: Log raw usage data structure for troubleshooting
                        console.log('🔍 Raw usage data keys:', Object.keys(usageData).join(', '));

                        // Convert usage data to AIUsage format for calculator
                        // Each provider has its own format, but we normalize to a common structure
                        const aiUsage: AIUsage = {
                            // Standard tokens (all providers) - Always populated
                            promptTokens: inputTokens,
                            completionTokens: outputTokens,
                            totalTokens,

                            // Anthropic format - CRITICAL: Always populate these fields for Anthropic models
                            // AI SDK returns promptTokens/completionTokens, but calculator needs input_tokens/output_tokens
                            input_tokens: usageData.input_tokens || inputTokens,  // ✅ Fallback to promptTokens
                            output_tokens: usageData.output_tokens || outputTokens,  // ✅ Fallback to completionTokens
                            cache_creation_input_tokens: usageData.cache_creation_input_tokens || usageData.cacheCreationInputTokens,
                            cache_read_input_tokens: usageData.cache_read_input_tokens || usageData.cacheReadInputTokens,

                            // OpenAI format - Extract from nested objects
                            cached_tokens: (usageData.prompt_tokens_details as Record<string, number> | undefined)?.cached_tokens,
                            reasoning_tokens: (usageData.completion_tokens_details as Record<string, number> | undefined)?.reasoning_tokens || usageData.reasoning_tokens,
                            audio_tokens: (usageData.prompt_tokens_details as Record<string, number> | undefined)?.audio_tokens,

                            // Google format - Direct mapping if available
                            prompt_token_count: usageData.prompt_token_count || inputTokens,  // ✅ Fallback to promptTokens
                            candidates_token_count: usageData.candidates_token_count || outputTokens,  // ✅ Fallback to completionTokens
                            cached_content_token_count: usageData.cachedContentTokenCount,

                            // Image generation
                            images_generated: (usageData as Record<string, unknown>).images_generated as number | undefined ||
                                (usageData as Record<string, unknown>).image_tokens as number | undefined,

                            // Tool usage (if tracked - must match expected type)
                            server_tool_use: typeof usageData.server_tool_use === 'object' ? usageData.server_tool_use : undefined,
                        };

                        // Calculate cost using comprehensive calculator
                        const breakdown = calculateUsageCost(codingModel, aiUsage);
                        providerCostUsd = breakdown.totalCost;

                        // Enhanced logging for direct provider cost calculation
                        console.log(`📊 Token Usage - Input: ${inputTokens.toLocaleString()}, Output: ${outputTokens.toLocaleString()}, Total: ${totalTokens.toLocaleString()}`);
                        console.log(`💰 Cost Breakdown (Direct Provider): ${formatCostBreakdown(breakdown)}`);
                        console.log(`💵 Total Cost (Calculated): $${providerCostUsd.toFixed(6)}`);
                    } catch (error) {
                        console.error('❌ Cost calculation error:', error);
                        console.error('Error details:', error instanceof Error ? error.message : String(error));
                        // Fallback to simple calculation using modelService
                        const fallbackConfig = await modelService.getModel(codingModel);
                        if (fallbackConfig?.pricing) {
                            providerCostUsd =
                                ((inputTokens / 1_000_000) * fallbackConfig.pricing.inputTokens) +
                                ((outputTokens / 1_000_000) * fallbackConfig.pricing.outputTokens);
                            console.log(`⚠️ Using fallback calculation (basic input/output only): $${providerCostUsd.toFixed(6)}`);
                        } else {
                            console.warn(`⚠️ No pricing config found for model: ${codingModel}`);
                            providerCostUsd = 0; // Ensure we have a value
                        }
                    }
                } else {
                    // OpenRouter provided cost directly - no calculation needed
                    console.log(`📊 Token Usage - Input: ${inputTokens.toLocaleString()}, Output: ${outputTokens.toLocaleString()}, Total: ${totalTokens.toLocaleString()}`);
                    console.log(`💰 OpenRouter Cost (from API response): $${providerCostUsd.toFixed(6)}`);
                }

                if (onFinish) {
                    try {
                        await onFinish({
                            model: codingModel, // Model ID (e.g., "anthropic/claude-sonnet-4.5")
                            inputTokens,
                            outputTokens,
                            totalTokens,
                            providerCostUsd, // Calculated or actual cost
                        });
                    } catch (error) {
                        console.error('❌ Failed to track usage:', error);
                    }
                }
            } else {
                console.warn('⚠️ No usage data available from API');
            }
        },
    });

    return result;
}

// ============================================================================
// NAMING AGENT (Automatic Model Selection)
// ============================================================================
// System automatically selects the most cost-effective naming model
// Optimized for fast, creative name generation

interface NamingOptions {
    description: string;
    userId: string; // User ID to determine plan and model access
    maxWords?: number;
    temperature?: number;
}

/**
 * Generate a creative project name using the naming model
 * System automatically selects the most cost-effective model for quick naming tasks
 */
export async function generateProjectName(options: NamingOptions): Promise<string> {
    const { description, userId, maxWords = 4, temperature = 0.7 } = options;

    const systemPrompt = `You are a naming assistant. You ONLY generate short project names.

CRITICAL RULES:
1. Output MUST be 1-${maxWords} words ONLY
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
- Descriptions or explanations`;

    const userPrompt = `User's project idea: ${description}

Project name (1-${maxWords} words only, no code):`;

    // Generate project name using intelligent model selection
    try {
        // Use naming model from modelService (system-only model, optimized for fast naming)
        const namingModelId = await modelService.getNamingModel();

        let provider, modelPath, displayName, providerType;
        let modelInstance;
        let useOpenRouterFallback = false;

        try {
            ({ provider, modelPath, displayName, providerType } = await getModelProvider(namingModelId, useOpenRouterFallback));
            console.log(`🤖 AI Agent: Generating project name with ${displayName} (${namingModelId})`);

            // Different providers use different call patterns
            switch (providerType) {
                case "anthropic":
                    modelInstance = (provider as ReturnType<typeof createAnthropic>)(modelPath);
                    break;
                case "openai":
                    modelInstance = (provider as ReturnType<typeof createOpenAI>)(modelPath);
                    break;
                case "google":
                    modelInstance = (provider as ReturnType<typeof createGoogleGenerativeAI>)(modelPath);
                    break;
                case "x-ai":
                    modelInstance = (provider as ReturnType<typeof createXai>)(modelPath);
                    break;
                case "openrouter":
                default:
                    modelInstance = (provider as ReturnType<typeof createOpenRouter>).chat(modelPath);
                    break;
            }
        } catch (directProviderError) {
            // If direct provider fails, retry with OpenRouter fallback
            console.warn(`⚠️ Direct provider failed for naming, falling back to OpenRouter:`, directProviderError);
            useOpenRouterFallback = true;

            ({ provider, modelPath, displayName, providerType } = await getModelProvider(namingModelId, useOpenRouterFallback));
            console.log(`🔄 Retrying with OpenRouter fallback: ${displayName}`);
            modelInstance = (provider as ReturnType<typeof createOpenRouter>).chat(modelPath);
        }

        const result = await generateText({
            model: modelInstance as never,
            system: systemPrompt,
            prompt: userPrompt,
            temperature,
            maxRetries: 2,
        });

        let rawName = result.text.trim();

        // Clean and validate the generated name
        rawName = rawName
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`[^`]*`/g, '') // Remove inline code
            .replace(/['"]/g, '') // Remove quotes
            .replace(/^\*+|\*+$/g, '') // Remove asterisks
            .replace(/^#+\s*/g, '') // Remove markdown headers
            .trim();

        // Take only the first line if multiple lines
        rawName = rawName.split('\n')[0].trim();

        // Validate: reject if it looks like code
        if (rawName.includes('{') || rawName.includes('}') ||
            rawName.includes('(') || rawName.includes(')') ||
            rawName.includes(';') || rawName.includes('=') ||
            rawName.includes('function') || rawName.includes('const') ||
            rawName.includes('let') || rawName.includes('var') ||
            rawName.length > 50) {
            console.warn(`⚠️ Generated name looks like code, rejecting: ${rawName}`);
            throw new Error('Generated name contains code-like content');
        }

        console.log(`✨ Generated name: ${rawName}`);
        return rawName;

    } catch (namingError) {
        console.error(`❌ Naming model failed:`, namingError instanceof Error ? namingError.message : 'Unknown error');
        return "New Project";
    }
}

// ============================================================================
// FUTURE EXPANSION
// ============================================================================

/**
 * Future agents to add:
 * 
 * - Code Review Agent: Analyzes code quality, suggests improvements
 * - Testing Agent: Generates unit tests and integration tests
 * - Documentation Agent: Generates README, JSDoc, API docs
 * - Debugging Agent: Analyzes errors and suggests fixes
 * - Optimization Agent: Suggests performance improvements
 * - Security Agent: Checks for vulnerabilities
 * - Image Generation Agent: DALL-E/Stable Diffusion integration
 * - Translation Agent: i18n content generation
 * 
 * Example future function:
 * export async function generateCodeReview(code: string): Promise<Review> { ... }
 */
