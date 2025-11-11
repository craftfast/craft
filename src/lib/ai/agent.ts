/**
 * Centralized AI Agent Service
 * 
 * This is the single source of truth for all AI operations in Craft.
 * 
 * AUTOMATIC MODEL SELECTION:
 * - Coding: minimax-m2 (optimized for agentic workflows with tool use support)
 * - Reasoning: kimi-k2-thinking (deep reasoning for complex tasks)
 * - Naming: gpt-oss-20b (fast & cheap for creative names)
 * - Memory: grok-4-fast (large context window for context generation)
 * - Chat: claude-haiku-4-5 (balanced for conversations)
 * 
 * All models are automatically selected - no user configuration needed.
 * Model Configuration is managed in src/lib/models/config.ts
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, streamText } from "ai";
import {
    getModelConfig,
    getDefaultModelForUseCase,
    type PlanName
} from "@/lib/models/config";
import { getUserPlan } from "@/lib/subscription";

// Create Anthropic client for Claude models
const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Create OpenRouter client for most models (Grok, MiniMax, etc.)
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================
// All model configurations are managed in src/lib/models/config.ts
// Models are automatically selected based on use case - no user configuration

// ============================================================================
// CODING AGENT (Automatic Model Selection)
// ============================================================================
// System automatically uses MiniMax M2 for coding tasks
// Optimized for agentic workflows with tool use support

interface CodingStreamOptions {
    messages: unknown[]; // Pre-formatted messages from the API
    systemPrompt: string;
    projectFiles?: Record<string, string>;
    conversationHistory?: Array<{ role: string; content: string }>;
    userId: string; // User ID to determine plan and model access
    onFinish?: (params: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    }) => void | Promise<void>;
}

/**
 * Get the appropriate AI provider and model name for a given model ID
 * Dynamically uses model configuration from config.ts (single source of truth)
 */
function getModelProvider(modelId: string): { provider: ReturnType<typeof createAnthropic> | ReturnType<typeof createOpenRouter>; modelPath: string; displayName: string; providerType: "anthropic" | "openrouter" } {
    // Get model config from single source of truth
    const modelConfig = getModelConfig(modelId);

    if (!modelConfig) {
        console.warn(`⚠️ Unknown model: ${modelId}, defaulting to minimax-m2`);

        // Ultimate fallback
        return {
            provider: openrouter,
            modelPath: "minimax/minimax-m2",
            displayName: "MiniMax M2",
            providerType: "openrouter"
        };
    }

    // Return the appropriate provider based on model config
    // Anthropic models use Anthropic SDK, everything else uses OpenRouter (including x-ai/grok)
    const provider = modelConfig.provider === "anthropic" ? anthropic : openrouter;
    const providerType = modelConfig.provider === "anthropic" ? "anthropic" : "openrouter";

    return {
        provider,
        modelPath: modelConfig.id,
        displayName: modelConfig.displayName,
        providerType
    };
}

/**
 * Stream coding responses using automatic model selection
 * Uses the coding-specific model (minimax-m2) optimized for agentic workflows
 */
export async function streamCodingResponse(options: CodingStreamOptions) {
    const { messages, systemPrompt, projectFiles = {}, userId, onFinish } = options;

    // Get user's plan to determine model access
    const userPlan = await getUserPlan(userId);

    // Get the coding-specific model based on user's plan
    const codingModel = getDefaultModelForUseCase("coding", userPlan);
    if (!codingModel) {
        throw new Error(`No coding model available for plan: ${userPlan}`);
    }

    const { provider, modelPath, displayName, providerType } = getModelProvider(codingModel);

    console.log(`⚡ AI Agent: Using ${displayName} (${codingModel}) for coding`);

    if (Object.keys(projectFiles).length > 0) {
        console.log(`📁 Context: ${Object.keys(projectFiles).length} existing project files`);
    }

    // Different providers use different call patterns
    // Anthropic: anthropic(modelPath)
    // OpenRouter: openrouter.chat(modelPath)
    const modelInstance = providerType === "anthropic"
        ? provider(modelPath)
        : (provider as ReturnType<typeof createOpenRouter>).chat(modelPath);

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
// System automatically uses GPT-OSS-20B for cost-effective project naming
// Optimized for fast, creative name generation

interface NamingOptions {
    description: string;
    userId: string; // User ID to determine plan and model access
    maxWords?: number;
    temperature?: number;
}

/**
 * Generate a creative project name using the naming model
 * System automatically uses GPT-OSS-20B for quick, cost-effective naming tasks
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

    // Generate project name using the naming model (GPT-OSS-20B)
    try {
        // Get user's plan to determine model access
        const userPlan = await getUserPlan(userId);

        const namingModelId = getDefaultModelForUseCase("naming", userPlan);
        if (!namingModelId) {
            console.warn(`⚠️ No naming model available for plan: ${userPlan}`);
            throw new Error(`No naming model available for plan: ${userPlan}`);
        }

        const { provider, modelPath, displayName, providerType } = getModelProvider(namingModelId);
        console.log(`🤖 AI Agent: Generating project name with ${displayName} (${namingModelId})`);

        // Different providers use different call patterns
        const modelInstance = providerType === "anthropic"
            ? provider(modelPath)
            : (provider as ReturnType<typeof createOpenRouter>).chat(modelPath);

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
