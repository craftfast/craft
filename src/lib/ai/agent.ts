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
import { generateText, streamText } from "ai";
import {
    getModelConfig,
    selectModelForUseCase,
    getDefaultFastModel,
} from "@/lib/models/config";
import { getUserPlan } from "@/lib/subscription";

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
    onFinish?: (params: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    }) => void | Promise<void>;
}

/**
 * Detect requirements from message content
 * Analyzes messages to determine what capabilities are needed
 */
function detectRequirements(messages: unknown[], systemPrompt: string): {
    hasImages: boolean;
    hasWebSearchRequest: boolean;
    needsFunctionCalling: boolean;
} {
    let hasImages = false;
    let hasWebSearchRequest = false;
    let needsFunctionCalling = false;

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

    // Check for web search indicators in system prompt or last message
    const textToCheck = systemPrompt + JSON.stringify(messagesArray.slice(-2));
    const webSearchKeywords = ['http://', 'https://', 'search the web', 'look up', 'find information about'];
    hasWebSearchRequest = webSearchKeywords.some(keyword =>
        textToCheck.toLowerCase().includes(keyword.toLowerCase())
    );

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
        modelPath: modelConfig.id,
        displayName: modelConfig.displayName,
        providerType
    };
}

/**
 * Stream coding responses using intelligent model selection
 * Automatically selects the most efficient model based on requirements
 */
export async function streamCodingResponse(options: CodingStreamOptions) {
    const { messages, systemPrompt, projectFiles = {}, userId, tier = "fast", onFinish } = options;

    // Get user's plan to determine model access
    const userPlan = await getUserPlan(userId);

    // Detect requirements from messages
    const { hasImages, hasWebSearchRequest, needsFunctionCalling } = detectRequirements(messages, systemPrompt);

    // Build required inputs based on detected content
    const requiredInputs: Array<"text" | "image"> = ["text"];
    if (hasImages) {
        requiredInputs.push("image");
        console.log("🖼️ Detected image input - selecting multimodal model");
    }

    // Select the most efficient model that meets all requirements
    const codingModel = selectModelForUseCase({
        useCase: "coding",
        tier, // Use specified tier (defaults to fast)
        userPlan,
        requiredInputs,
        requiredOutputs: ["code", "text"],
        requiresWebSearch: hasWebSearchRequest || undefined,
        requiresFunctionCalling: needsFunctionCalling || undefined,
    });

    if (!codingModel) {
        throw new Error(`No coding model available for plan: ${userPlan} with specified requirements`);
    }

    const { provider, modelPath, displayName, providerType } = getModelProvider(codingModel);

    console.log(`⚡ AI Agent: Using ${displayName} (${codingModel}) for coding`);

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

    // Stream the response with usage tracking
    const result = streamText({
        model: modelInstance,
        system: systemPrompt,
        messages: messages as never, // AI SDK will handle the validation
        onFinish: async ({ usage }) => {
            console.log('🔍 Raw usage object:', JSON.stringify(usage, null, 2));
            console.log('🔍 Available properties:', Object.keys(usage));

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
