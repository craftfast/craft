/**
 * Smart Model Router
 * Intelligently routes between Claude Sonnet 4.5 (complex) and Claude Haiku 4.5 (simple)
 * to optimize performance and cost
 */

interface MessageAnalysis {
    complexity: 'simple' | 'moderate' | 'complex';
    useHaiku: boolean;
    reasoning: string;
}

/**
 * Analyze message complexity to determine which model to use
 */
export function analyzeMessageComplexity(
    message: string,
    projectFiles: Record<string, string> = {},
    conversationHistory: Array<{ role: string; content: string }> = []
): MessageAnalysis {
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

    // Check for complex indicators
    const hasComplexIndicator = complexIndicators.some(pattern =>
        pattern.test(lowerMessage)
    );

    // Check for simple indicators
    const hasSimpleIndicator = simpleIndicators.some(pattern =>
        pattern.test(lowerMessage)
    );

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

/**
 * Get the appropriate model based on message analysis
 */
export function getSmartModel(
    message: string,
    projectFiles: Record<string, string> = {},
    conversationHistory: Array<{ role: string; content: string }> = []
): { model: string; modelName: string; analysis: MessageAnalysis } {
    const analysis = analyzeMessageComplexity(message, projectFiles, conversationHistory);

    const model = analysis.useHaiku
        ? 'anthropic/claude-haiku-4.5'
        : 'anthropic/claude-sonnet-4.5';

    const modelName = analysis.useHaiku
        ? 'Claude Haiku 4.5'
        : 'Claude Sonnet 4.5';

    return { model, modelName, analysis };
}

/**
 * Log model selection decision
 */
export function logModelSelection(
    modelName: string,
    analysis: MessageAnalysis,
    messagePreview: string
): void {
    const emoji = analysis.useHaiku ? '⚡' : '🧠';
    console.log(`${emoji} Smart Router: Using ${modelName}`);
    console.log(`   Complexity: ${analysis.complexity}`);
    console.log(`   Reason: ${analysis.reasoning}`);
    console.log(`   Message: "${messagePreview.substring(0, 60)}..."`);
}
