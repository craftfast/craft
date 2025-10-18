/**
 * Centralized AI Agent Service
 * 
 * This is the single source of truth for all AI operations in Craft.
 * 
 * Model Configuration:
 * - Claude Haiku 4.5: All coding tasks (fast, cost-efficient)
 * - Grok 4 Fast: Project naming and creative text generation
 * 
 * The system is optimized to minimize costs while maintaining quality.
 * Future expansion: Add more specialized agents here (image generation, code review, etc.)
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, streamText } from "ai";

// Create OpenRouter client
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

const MODELS = {
    // Primary coding model
    CODING: "anthropic/claude-haiku-4.5",      // Fast, efficient for all coding tasks

    // Specialized models
    NAMING: "x-ai/grok-4-fast",                // Project naming & creative text
} as const;

// ============================================================================
// CODING AGENT (Claude Haiku 4.5)
// ============================================================================

interface CodingStreamOptions {
    messages: unknown[]; // Pre-formatted messages from the API
    systemPrompt: string;
    projectFiles?: Record<string, string>;
    conversationHistory?: Array<{ role: string; content: string }>;
    onFinish?: (params: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    }) => void | Promise<void>;
}

/**
 * Stream coding responses using Claude Haiku 4.5
 * Fast and cost-efficient for all coding tasks
 */
export async function streamCodingResponse(options: CodingStreamOptions) {
    const { messages, systemPrompt, projectFiles = {}, onFinish } = options;

    const model = MODELS.CODING;
    const modelName = 'Claude Haiku 4.5';

    console.log(`⚡ AI Agent: Using ${modelName}`);

    if (Object.keys(projectFiles).length > 0) {
        console.log(`📁 Context: ${Object.keys(projectFiles).length} existing project files`);
    }

    // Stream the response with usage tracking
    const result = streamText({
        model: openrouter.chat(model),
        system: systemPrompt,
        messages: messages as never, // AI SDK will handle the validation
        onFinish: async ({ usage }) => {
            if (usage) {
                // OpenRouter returns inputTokens/outputTokens directly (not promptTokens/completionTokens)
                const inputTokens = usage.inputTokens || 0;
                const outputTokens = usage.outputTokens || 0;
                const totalTokens = usage.totalTokens || inputTokens + outputTokens;

                console.log(`📊 Token Usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);

                if (onFinish) {
                    try {
                        await onFinish({
                            model,
                            inputTokens,
                            outputTokens,
                            totalTokens,
                        });
                    } catch (error) {
                        console.error('❌ Failed to track usage:', error);
                    }
                }
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
