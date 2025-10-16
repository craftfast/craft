/**
 * Centralized AI Agent Service
 * 
 * This is the single source of truth for all AI operations in Craft.
 * 
 * Intelligent Model Routing:
 * - Grok 4 Fast analyzes each request to determine complexity
 * - Claude Haiku 4.5: Used for 90%+ of tasks (fast, cost-efficient)
 * - Claude Sonnet 4.5: Reserved for complex planning & architecture only
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
    // Primary coding models (auto-routed based on complexity)
    HAIKU: "anthropic/claude-haiku-4.5",      // Fast, efficient for general tasks
    SONNET: "anthropic/claude-sonnet-4.5",    // Complex planning & architecture

    // Specialized models
    NAMING: "x-ai/grok-4-fast",                // Project naming & creative text
} as const;

// ============================================================================
// INTELLIGENT MODEL SELECTION (Using Grok 4 Fast)
// ============================================================================

interface ModelSelection {
    useHaiku: boolean;
    reasoning: string;
}

/**
 * Use Grok 4 Fast to intelligently determine which model to use
 * Optimized for 90%+ Haiku usage, only Sonnet for complex planning
 */
async function selectModelWithGrok(
    message: string,
    projectFiles: Record<string, string> = {},
    conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ModelSelection> {
    const fileCount = Object.keys(projectFiles).length;
    const conversationLength = conversationHistory.length;

    const systemPrompt = `You are a model selection assistant. Your job is to determine if a user's coding request requires Claude Sonnet 4.5 (complex planning) or Claude Haiku 4.5 (all other tasks).

CRITICAL RULES:
1. Default to "haiku" for 90%+ of tasks
2. Only use "sonnet" for truly complex planning, architecture, or system design
3. Your response MUST be EXACTLY one word: "haiku" or "sonnet"
4. NO explanations, NO markdown, NO extra text

USE HAIKU FOR:
- All UI changes (styling, colors, layouts, components)
- Bug fixes and code corrections
- Adding features to existing code
- Refactoring existing functions
- Simple questions and explanations
- API integrations
- Database queries
- Form handling
- Most coding tasks

USE SONNET ONLY FOR:
- Designing entire system architectures from scratch
- Multi-service distributed system planning
- Complex algorithm design requiring deep analysis
- Security architecture planning
- Performance optimization strategies for large systems

Context:
- Project has ${fileCount} files
- Conversation has ${conversationLength} messages

User's request: "${message}"

Respond with ONLY: haiku or sonnet`;

    try {
        const result = await generateText({
            model: openrouter.chat(MODELS.NAMING), // Grok 4 Fast
            system: systemPrompt,
            prompt: message,
            temperature: 0.3, // Low temperature for consistent decisions
        });

        const decision = result.text.trim().toLowerCase();

        if (decision === 'sonnet') {
            return {
                useHaiku: false,
                reasoning: 'Grok determined: Complex planning/architecture task',
            };
        } else {
            // Default to Haiku for any non-sonnet response
            return {
                useHaiku: true,
                reasoning: 'Grok determined: General coding task',
            };
        }
    } catch (error) {
        console.error('⚠️ Grok model selection failed, defaulting to Haiku:', error);
        // Fallback: Always use Haiku if Grok fails
        return {
            useHaiku: true,
            reasoning: 'Fallback to Haiku (Grok unavailable)',
        };
    }
}

// ============================================================================
// ============================================================================
// CODING AGENT (Smart Routing: Haiku for general, Sonnet for complex)
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
 * Stream coding responses with Grok-powered intelligent model routing
 * Uses Grok 4 Fast to decide between Haiku (90%+) and Sonnet (complex planning only)
 */
export async function streamCodingResponse(options: CodingStreamOptions) {
    const { messages, systemPrompt, projectFiles = {}, conversationHistory = [], onFinish } = options;

    // Get the last user message for analysis
    const lastUserMessage = messages
        .filter((m): m is { role: string; content: unknown } =>
            typeof m === 'object' && m !== null && 'role' in m && (m as { role: string }).role === 'user'
        )
        .pop();

    const userMessageText = typeof lastUserMessage?.content === 'string'
        ? lastUserMessage.content
        : Array.isArray(lastUserMessage?.content)
            ? (lastUserMessage.content.find((c: { type: string }) => c.type === 'text') as { text?: string })?.text || ''
            : '';

    // Use Grok to intelligently select model
    const selection = await selectModelWithGrok(userMessageText, projectFiles, conversationHistory);
    const model = selection.useHaiku ? MODELS.HAIKU : MODELS.SONNET;
    const modelName = selection.useHaiku ? 'Claude Haiku 4.5' : 'Claude Sonnet 4.5';

    // Log the routing decision
    const emoji = selection.useHaiku ? '⚡' : '🧠';
    console.log(`${emoji} AI Agent: Using ${modelName}`);
    console.log(`   Decision: ${selection.reasoning}`);
    console.log(`   Message: "${userMessageText.substring(0, 60)}..."`);

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

        // Fallback to Claude Sonnet
        console.log(`🔄 AI Agent: Falling back to Claude Sonnet 4.5 for naming`);

        try {
            const result = await generateText({
                model: openrouter.chat(MODELS.SONNET),
                system: systemPrompt,
                prompt: userPrompt,
                temperature,
                maxRetries: 2,
            });

            let rawName = result.text.trim();

            // Clean and validate
            rawName = rawName
                .replace(/```[\s\S]*?```/g, '')
                .replace(/`[^`]*`/g, '')
                .replace(/['"]/g, '')
                .replace(/^\*+|\*+$/g, '')
                .replace(/^#+\s*/g, '')
                .trim();

            rawName = rawName.split('\n')[0].trim();

            // Validate
            if (rawName.includes('{') || rawName.includes('}') ||
                rawName.includes('(') || rawName.includes(')') ||
                rawName.includes(';') || rawName.includes('=') ||
                rawName.includes('function') || rawName.includes('const') ||
                rawName.includes('let') || rawName.includes('var') ||
                rawName.length > 50) {
                console.warn(`⚠️ Generated name looks like code, using fallback`);
                return "New Project";
            }

            console.log(`✨ Generated name with fallback: ${rawName}`);
            return rawName;

        } catch (claudeError) {
            console.error(`❌ Claude fallback also failed:`, claudeError instanceof Error ? claudeError.message : 'Unknown error');
            return "New Project";
        }
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
