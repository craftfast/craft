/**
 * Centralized AI Agent Service
 * 
 * This is the single source of truth for all AI operations in Craft.
 * 
 * INTELLIGENT MODEL SELECTION:
 * Models are automatically selected based on:
 * - Use case (coding, naming, memory, etc.)
 * - User's plan (HOBBY, PRO, ENTERPRISE)
 * - Required capabilities (multimodal, web search, function calling)
 * - Cost efficiency (selects cheapest model that meets requirements)
 * 
 * Selection Process:
 * - Text-only tasks → Fast tier models (optimized for speed and cost)
 * - Multimodal tasks → Models with image/video support
 * - Web search needed → Models with web search capabilities
 * - Naming tasks → Ultra-cheap, fast models
 * - Memory tasks → Models with large context windows
 * 
 * All models are automatically selected - no user configuration needed.
 * Model Configuration is managed in src/lib/models/config.ts
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { generateText, streamText, stepCountIs } from "ai";
import {
    getModelConfig,
    selectModelForUseCase,
    getDefaultFastModel,
} from "@/lib/models/config";
import { getUserPlan } from "@/lib/subscription";
import { tools } from "@/lib/ai/tools";
import { SSEStreamWriter } from "@/lib/ai/sse-events";
import { createAgentLoop, type AgentLoopCoordinator } from "@/lib/ai/agent-loop-coordinator";
import { setToolContext, clearToolContext } from "@/lib/ai/tool-context";

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
// MODEL CONFIGURATION
// ============================================================================
// All model configurations are managed in src/lib/models/config.ts
// Models are automatically selected based on use case - no user configuration

// ============================================================================
// CODING AGENT (Intelligent Model Selection)
// ============================================================================
// System automatically selects the most efficient model based on requirements
// Considers input types, capabilities needed, and cost efficiency

interface CodingStreamOptions {
    messages: unknown[]; // Pre-formatted messages from the API
    systemPrompt: string;
    projectFiles?: Record<string, string>;
    conversationHistory?: Array<{ role: string; content: string }>;
    userId: string; // User ID to determine plan and model access
    tier?: "fast" | "expert"; // Optional: specify tier (defaults to fast)
    sseWriter?: SSEStreamWriter; // Optional: SSE writer for real-time tool events
    projectId?: string; // Optional: project ID for agent loop state management
    sessionId?: string; // Optional: session ID for agent loop coordination
    enableAgentLoop?: boolean; // Optional: enable Think→Act→Observe→Reflect pattern (Phase 2)
    onFinish?: (params: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    }) => void | Promise<void>;
}

/**
 * Detect requirements from message content using Grok 4 Fast
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

    // Use Grok 4 Fast to intelligently detect if web search is needed
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

        const { provider, modelPath } = getModelProvider("x-ai/grok-4-fast");
        const modelInstance = (provider as ReturnType<typeof createXai>)(modelPath);

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
 * Get the appropriate AI provider and model name for a given model ID
 * Dynamically uses model configuration from config.ts (single source of truth)
 */
function getModelProvider(modelId: string): {
    provider: ReturnType<typeof createAnthropic> | ReturnType<typeof createOpenRouter> | ReturnType<typeof createOpenAI> | ReturnType<typeof createGoogleGenerativeAI> | ReturnType<typeof createXai>;
    modelPath: string;
    displayName: string;
    providerType: "anthropic" | "openrouter" | "openai" | "google" | "x-ai"
} {
    // Get model config from single source of truth
    const modelConfig = getModelConfig(modelId);

    if (!modelConfig) {
        console.warn(`⚠️ Unknown model: ${modelId}, falling back to default fast model`);

        // Ultimate fallback - use the default fast model from config
        const fallbackModelId = getDefaultFastModel();
        const fallbackConfig = getModelConfig(fallbackModelId);

        if (!fallbackConfig) {
            throw new Error("Configuration error: Default fast model not found in config");
        }

        // Recursively call with the fallback model
        return getModelProvider(fallbackModelId);
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

    return {
        provider,
        modelPath: modelConfig.name, // Use the actual API model name
        displayName: modelConfig.displayName,
        providerType
    };
}

/**
 * Stream coding responses using intelligent model selection
 * Automatically selects the most efficient model based on requirements
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
        tier = "fast",
        sseWriter,
        projectId,
        sessionId,
        enableAgentLoop = false,
        onFinish
    } = options;

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

    // Get user's plan to determine model access
    const userPlan = await getUserPlan(userId);

    // Detect requirements from messages
    const { hasImages, hasWebSearchRequest, needsFunctionCalling } = await detectRequirements(messages, systemPrompt);

    // Build required inputs based on detected content
    const requiredInputs: Array<"text" | "image"> = ["text"];
    if (hasImages) {
        requiredInputs.push("image");
        console.log("🖼️ Detected image input - selecting multimodal model");
    }

    // Select the most efficient model that meets all requirements
    // PHASE 1: ALWAYS require function calling for coding tasks
    const codingModel = selectModelForUseCase({
        useCase: "coding",
        tier, // Use specified tier (defaults to fast)
        userPlan,
        requiredInputs,
        requiredOutputs: ["code", "text"],
        requiresWebSearch: hasWebSearchRequest || undefined,
        requiresFunctionCalling: true, // ⚡ PHASE 1: FORCE tool-capable models
    });

    if (!codingModel) {
        throw new Error(`No coding model available for plan: ${userPlan} with specified requirements`);
    }

    const { provider, modelPath, displayName, providerType } = getModelProvider(codingModel);

    console.log(`⚡ AI Agent: Using ${displayName} (${codingModel}) for coding with TOOL USE enabled`);
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
    let modelInstance;
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

    // Track tool execution timing for SSE events
    const toolStartTimes = new Map<string, number>();

    // Set tool context so tools can access SSE writer and project info
    setToolContext({
        sseWriter,
        projectId,
        userId,
        sessionId,
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
                // AI SDK v5 with Anthropic - uses promptTokens/completionTokens
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

                console.log(`📊 Token Usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);

                if (onFinish) {
                    try {
                        await onFinish({
                            model: codingModel, // Return the coding model ID
                            inputTokens,
                            outputTokens,
                            totalTokens,
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
        // Get user's plan to determine model access
        const userPlan = await getUserPlan(userId);

        // Select the most efficient naming model
        const namingModelId = selectModelForUseCase({
            useCase: "naming",
            tier: "fast",
            userPlan,
            requiredInputs: ["text"],
            requiredOutputs: ["text"],
        });

        if (!namingModelId) {
            console.warn(`⚠️ No naming model available for plan: ${userPlan}`);
            throw new Error(`No naming model available for plan: ${userPlan}`);
        }

        const { provider, modelPath, displayName, providerType } = getModelProvider(namingModelId);
        console.log(`🤖 AI Agent: Generating project name with ${displayName} (${namingModelId})`);

        // Different providers use different call patterns
        let modelInstance;
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
