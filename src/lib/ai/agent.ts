/**
 * Centralized AI Agent Service
 * 
 * This is the single source of truth for all AI operations in Craft.
 * 
 * Model Configuration:
 * - Claude Haiku 4.5: 1.0x credit multiplier (standard/default) - All plans
 * - Claude Sonnet 4.5: 2.0x credit multiplier (premium) - PRO+ only
 * 
 * The system supports dynamic model selection with credit-based pricing
 * and plan-based restrictions.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, streamText } from "ai";
import { canUserAccessModel } from "@/lib/models/config";
import { getUserPlan } from "@/lib/subscription";

// Create Anthropic client for Claude models
const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Create OpenRouter client for Grok and other models
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

const MODELS = {
    // Coding models (user-selectable)
    CLAUDE_HAIKU: "claude-haiku-4-5",          // Standard tier (1.0x) - Default
    CLAUDE_SONNET: "claude-sonnet-4.5",        // Premium tier (2.0x)

    // Specialized models (via OpenRouter)
    NAMING: "x-ai/grok-4-fast",                // Project naming & creative text
} as const;

// ============================================================================
// CODING AGENT (Dynamic Model Selection)
// ============================================================================

interface CodingStreamOptions {
    messages: unknown[]; // Pre-formatted messages from the API
    systemPrompt: string;
    projectFiles?: Record<string, string>;
    conversationHistory?: Array<{ role: string; content: string }>;
    model?: string; // Allow model selection (defaults to Claude Haiku 4.5)
    userId?: string; // User ID for plan validation
    onFinish?: (params: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    }) => void | Promise<void>;
}

/**
 * Get the appropriate AI provider and model name for a given model ID
 */
function getModelProvider(modelId: string): { provider: ReturnType<typeof createAnthropic> | ReturnType<typeof createOpenRouter>; modelPath: string; displayName: string } {
    switch (modelId) {
        case "claude-haiku-4.5":
        case "claude-haiku-4-5":
            return {
                provider: anthropic,
                modelPath: "claude-haiku-4-5",
                displayName: "Claude Haiku 4.5"
            };
        case "claude-sonnet-4.5":
        case "claude-sonnet-4-5":
            return {
                provider: anthropic,
                modelPath: "claude-sonnet-4-5",
                displayName: "Claude Sonnet 4.5"
            };
        default:
            // Default to Claude Haiku 4.5 (standard tier)
            console.warn(`⚠️ Unknown model: ${modelId}, defaulting to Claude Haiku 4.5`);
            return {
                provider: anthropic,
                modelPath: "claude-haiku-4-5",
                displayName: "Claude Haiku 4.5"
            };
    }
}

/**
 * Stream coding responses with dynamic model selection
 * Supports: Claude Haiku 4.5, Claude Sonnet 4.5
 * Validates plan-based access to premium models
 */
export async function streamCodingResponse(options: CodingStreamOptions) {
    const { messages, systemPrompt, projectFiles = {}, model: requestedModel = "claude-haiku-4-5", userId, onFinish } = options;

    // Validate user can access the requested model
    if (userId && requestedModel) {
        const userPlan = await getUserPlan(userId);
        const hasAccess = canUserAccessModel(requestedModel, userPlan);

        if (!hasAccess) {
            throw new Error(
                `Model ${requestedModel} requires Pro plan. Please upgrade to access premium models.`
            );
        }
    }

    const { provider, modelPath, displayName } = getModelProvider(requestedModel);

    console.log(`⚡ AI Agent: Using ${displayName} (${requestedModel})`);

    if (Object.keys(projectFiles).length > 0) {
        console.log(`📁 Context: ${Object.keys(projectFiles).length} existing project files`);
    }

    // Both Anthropic and OpenAI providers use the same call pattern
    const modelInstance = provider(modelPath);

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
                            model: requestedModel, // Return the requested model ID
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
// NAMING AGENT (Grok 4 Fast for creative naming)
// ============================================================================

interface NamingOptions {
    description: string;
    maxWords?: number;
    temperature?: number;
}

/**
 * Generate a creative project name using Grok 4 Fast
 * Falls back to Claude Sonnet if Grok fails
 */
export async function generateProjectName(options: NamingOptions): Promise<string> {
    const { description, maxWords = 4, temperature = 0.7 } = options;

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

    // Try Grok first
    try {
        console.log(`🤖 AI Agent: Generating project name with Grok 4 Fast`);

        const result = await generateText({
            model: openrouter.chat(MODELS.NAMING),
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

    } catch (grokError) {
        console.error(`❌ Grok naming failed:`, grokError instanceof Error ? grokError.message : 'Unknown error');
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
