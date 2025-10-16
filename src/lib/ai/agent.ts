/**
 * Centralized AI Agent Service
 * 
 * This is the single source of truth for all AI operations in Craft.
 * 
 * Models used:
 * - Claude Haiku 4.5: Fast, efficient coding for general tasks
 * - Claude Sonnet 4.5: Complex planning, architecture, and advanced tasks
 * - Grok 4 Fast: Project naming and creative text generation
 * 
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
// MESSAGE COMPLEXITY ANALYSIS
// ============================================================================

interface ComplexityAnalysis {
    complexity: 'simple' | 'moderate' | 'complex';
    useHaiku: boolean;
    reasoning: string;
}

/**
 * Analyze message complexity to determine which coding model to use
 */
export function analyzeComplexity(
    message: string,
    projectFiles: Record<string, string> = {},
    conversationHistory: Array<{ role: string; content: string }> = []
): ComplexityAnalysis {
    const lowerMessage = message.toLowerCase();
    const fileCount = Object.keys(projectFiles).length;
    const hasMultipleFiles = fileCount > 3;

    // Complex indicators (use Sonnet 4.5)
    const complexIndicators = [
        // Architecture and design
        /architect|design pattern|system design|scalab/i,
        /refactor|restructure|reorganize/i,
        /microservice|api design|database schema/i,

        // Advanced features
        /authentication|authorization|security/i,
        /websocket|real-time|streaming/i,
        /state management|redux|context api/i,
        /optimization|performance|caching/i,

        // Complex coding tasks
        /algorithm|complex logic|advanced/i,
        /integration|third-party|external api/i,
        /testing|unit test|e2e test/i,
        /deployment|ci\/cd|docker|kubernetes/i,

        // Multi-file operations
        /create.*components?.*and.*pages?/i,
        /build.*full.*app|complete.*application/i,
        /multiple.*files?/i,
    ];

    // Simple indicators (use Haiku 4.5)
    const simpleIndicators = [
        // Basic changes
        /change.*color|update.*style|modify.*css/i,
        /fix.*typo|correct.*spelling/i,
        /add.*button|create.*link/i,
        /update.*text|change.*wording/i,

        // Simple UI updates
        /make.*bigger|make.*smaller/i,
        /center|align|padding|margin/i,
        /show|hide|toggle|display/i,

        // Basic explanations
        /what.*is|explain.*this|how.*does/i,
        /show.*me|give.*example/i,
    ];

    const hasComplexIndicator = complexIndicators.some(pattern => pattern.test(lowerMessage));
    const hasSimpleIndicator = simpleIndicators.some(pattern => pattern.test(lowerMessage));

    // Analyze message characteristics
    const isLongMessage = message.length > 500;
    const hasCodeSnippets = /```|`.*`/.test(message);
    const hasMultipleRequests = (message.match(/and|also|additionally/gi) || []).length > 2;
    const isQuestion = /^(what|how|why|when|where|can|could|would)/i.test(lowerMessage);

    // Decision logic
    let complexity: 'simple' | 'moderate' | 'complex';
    let useHaiku: boolean;
    let reasoning: string;

    if (hasComplexIndicator) {
        complexity = 'complex';
        useHaiku = false;
        reasoning = 'Complex task detected (architecture, advanced features, or multi-step operations)';
    } else if (hasSimpleIndicator && !hasMultipleFiles) {
        complexity = 'simple';
        useHaiku = true;
        reasoning = 'Simple task detected (styling, basic changes, or questions)';
    } else if (isLongMessage || hasCodeSnippets || hasMultipleRequests) {
        complexity = 'complex';
        useHaiku = false;
        reasoning = 'Complex due to message length, code snippets, or multiple requests';
    } else if (hasMultipleFiles) {
        complexity = 'complex';
        useHaiku = false;
        reasoning = `Complex due to existing project context (${fileCount} files)`;
    } else if (isQuestion && !hasMultipleRequests) {
        complexity = 'simple';
        useHaiku = true;
        reasoning = 'Simple question or clarification';
    } else {
        // Default to moderate - use Haiku for cost efficiency
        complexity = 'moderate';
        useHaiku = true;
        reasoning = 'Moderate complexity - using Haiku for cost efficiency';
    }

    // Override: If conversation history shows complexity, use Sonnet
    if (conversationHistory.length > 5 && !useHaiku) {
        reasoning += ' (multi-turn conversation with complex context)';
    }

    return { complexity, useHaiku, reasoning };
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
 * Stream coding responses with smart model routing
 * Automatically uses Haiku for simple tasks, Sonnet for complex ones
 */
export function streamCodingResponse(options: CodingStreamOptions) {
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

    // Analyze complexity and select model
    const analysis = analyzeComplexity(userMessageText, projectFiles, conversationHistory);
    const model = analysis.useHaiku ? MODELS.HAIKU : MODELS.SONNET;
    const modelName = analysis.useHaiku ? 'Claude Haiku 4.5' : 'Claude Sonnet 4.5';

    // Log the routing decision
    const emoji = analysis.useHaiku ? '⚡' : '🧠';
    console.log(`${emoji} AI Agent: Using ${modelName}`);
    console.log(`   Complexity: ${analysis.complexity}`);
    console.log(`   Reason: ${analysis.reasoning}`);
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
            if (usage && onFinish) {
                // AI SDK v5 uses different property names
                const inputTokens = (usage as { promptTokens?: number }).promptTokens || 0;
                const outputTokens = (usage as { completionTokens?: number }).completionTokens || 0;
                const totalTokens = usage.totalTokens || inputTokens + outputTokens;

                console.log(`📊 Token Usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);
                await onFinish({
                    model,
                    inputTokens,
                    outputTokens,
                    totalTokens,
                });
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
