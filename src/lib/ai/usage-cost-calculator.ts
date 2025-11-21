/**
 * AI Usage Cost Calculator
 * Comprehensive cost calculation for all AI providers and pricing types
 * 
 * Supports:
 * - Standard token pricing (input/output)
 * - Prompt caching (creation, reads, 5-min/1-hour caches)
 * - Reasoning tokens (OpenAI, XAI)
 * - Multimodal inputs (images, audio, video)
 * - Image generation outputs
 * - Server-side tools (web search, code execution)
 * - Batch API discounts
 * - Long context premium pricing
 */

import { getModelConfig, type ModelConfig } from "@/lib/models/config";

// ============================================================================
// USAGE INTERFACE - Matches API Response Formats
// ============================================================================

/**
 * Generic usage structure that can represent any provider's response
 */
export interface AIUsage {
    // Standard token counts
    promptTokens?: number;          // OpenAI/XAI: Input tokens
    completionTokens?: number;      // OpenAI/XAI: Output tokens
    totalTokens?: number;           // Total (prompt + completion)

    // Anthropic-specific
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;

    // OpenAI-specific (prompt_tokens_details)
    cached_tokens?: number;         // Cached input tokens
    reasoning_tokens?: number;      // Internal reasoning tokens (charged at output rate)
    audio_tokens?: number;          // Audio input tokens

    // Google-specific
    prompt_token_count?: number;
    candidates_token_count?: number;
    cached_content_token_count?: number;

    // Server-side tool usage (per-use charges, not token-based)
    server_tool_use?: {
        web_search_requests?: number;       // Anthropic: $10/1K, XAI: $5/1K, Google: $35/1K
        web_fetch_requests?: number;        // Anthropic: Free
        code_execution_requests?: number;   // XAI: $5/1K
        x_search_requests?: number;         // XAI: $5/1K
        document_search_requests?: number;  // XAI: $5/1K, $2.50/1K for collections
    };

    // Image generation (per-image charges)
    images_generated?: number;      // Number of images created

    // Context window tier (for Google long context pricing)
    is_long_context?: boolean;      // If input tokens > 200K (Gemini 3 Pro)
}

/**
 * Detailed cost breakdown by component
 */
export interface CostBreakdown {
    // Standard token costs
    inputCost: number;              // Regular input tokens
    outputCost: number;             // Regular output tokens

    // Caching costs
    cacheCreationCost: number;      // Writing to cache
    cacheReadCost: number;          // Reading from cache

    // Multimodal costs
    audioInputCost: number;         // Audio input tokens
    videoInputCost: number;         // Video input tokens (usually same as image)
    imageInputCost: number;         // Image input tokens (if separate from text)

    // Output generation costs
    imageOutputCost: number;        // Image generation
    audioOutputCost: number;        // Audio generation

    // Reasoning costs (OpenAI, XAI)
    reasoningCost: number;          // Internal reasoning tokens

    // Tool usage costs (per-use, not token-based)
    webSearchCost: number;          // Web search queries
    codeExecutionCost: number;      // Code execution runs
    otherToolsCost: number;         // Other server-side tools

    // Totals
    totalTokenCost: number;         // All token-based costs
    totalToolCost: number;          // All tool-based costs
    totalCost: number;              // Grand total

    // Metadata
    modelId: string;
    provider: string;
    appliedDiscount?: string;       // e.g., "Batch API 50%", "Long context premium"
}

// ============================================================================
// MAIN COST CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate the cost of an AI request based on usage and model
 * 
 * @param modelId - Model identifier (e.g., "anthropic/claude-sonnet-4.5")
 * @param usage - Usage object from API response
 * @param options - Optional modifiers (batch mode, long context, etc.)
 * @returns Detailed cost breakdown
 */
export function calculateUsageCost(
    modelId: string,
    usage: AIUsage,
    options?: {
        isBatchMode?: boolean;          // Apply 50% discount (Anthropic, Google)
        isLongContext?: boolean;        // Apply premium pricing (Anthropic Sonnet 4.5)
        cacheType?: "5min" | "1hour";   // Anthropic cache duration (default: 5min)
    }
): CostBreakdown {
    const model = getModelConfig(modelId);
    if (!model || !model.pricing) {
        throw new Error(`Model pricing not found: ${modelId}`);
    }

    const breakdown: CostBreakdown = {
        inputCost: 0,
        outputCost: 0,
        cacheCreationCost: 0,
        cacheReadCost: 0,
        audioInputCost: 0,
        videoInputCost: 0,
        imageInputCost: 0,
        imageOutputCost: 0,
        audioOutputCost: 0,
        reasoningCost: 0,
        webSearchCost: 0,
        codeExecutionCost: 0,
        otherToolsCost: 0,
        totalTokenCost: 0,
        totalToolCost: 0,
        totalCost: 0,
        modelId,
        provider: model.provider,
    };

    // Determine pricing rates (with modifiers)
    const pricing = applyPricingModifiers(model.pricing, options);

    // Calculate based on provider format
    switch (model.provider) {
        case "anthropic":
            calculateAnthropicCost(usage, pricing, breakdown);
            break;
        case "openai":
            calculateOpenAICost(usage, pricing, breakdown);
            break;
        case "google":
            calculateGoogleCost(usage, pricing, breakdown, options);
            break;
        case "x-ai":
            calculateXAICost(usage, pricing, breakdown);
            break;
        default:
            throw new Error(`Unsupported provider: ${model.provider}`);
    }

    // Calculate totals
    breakdown.totalTokenCost =
        breakdown.inputCost +
        breakdown.outputCost +
        breakdown.cacheCreationCost +
        breakdown.cacheReadCost +
        breakdown.audioInputCost +
        breakdown.videoInputCost +
        breakdown.imageInputCost +
        breakdown.imageOutputCost +
        breakdown.audioOutputCost +
        breakdown.reasoningCost;

    breakdown.totalToolCost =
        breakdown.webSearchCost +
        breakdown.codeExecutionCost +
        breakdown.otherToolsCost;

    breakdown.totalCost = breakdown.totalTokenCost + breakdown.totalToolCost;

    return breakdown;
}

// ============================================================================
// PRICING MODIFIER APPLICATION
// ============================================================================

interface ModifiedPricing {
    input: number;
    output: number;
    cacheCreation?: number;
    cacheRead?: number;
    audioInput?: number;
    videoInput?: number;
    imageInput?: number;
    imageOutput?: number;
    audioOutput?: number;
}

function applyPricingModifiers(
    basePricing: ModelConfig["pricing"],
    options?: {
        isBatchMode?: boolean;
        isLongContext?: boolean;
        cacheType?: "5min" | "1hour";
    }
): ModifiedPricing {
    if (!basePricing) {
        throw new Error("Model pricing not configured");
    }

    // Extract base costs from the pricing structure
    let pricing: ModifiedPricing = {
        input: basePricing.inputTokens,
        output: basePricing.outputTokens,
        cacheCreation: basePricing.cacheCreation,
        cacheRead: basePricing.cacheRead,
        audioInput: basePricing.audioInputTokens,
        videoInput: basePricing.videoInputTokens,
        imageInput: basePricing.imageInputTokens,
        imageOutput: basePricing.images ? basePricing.images / 1000 : undefined, // Convert per-1K to per-image
        audioOutput: basePricing.audioOutputTokens,
    };

    // Apply long context premium (uses long context pricing if available and context is long)
    if (options?.isLongContext) {
        if (basePricing.inputTokensLongContext) {
            pricing.input = basePricing.inputTokensLongContext;
        }
        if (basePricing.outputTokensLongContext) {
            pricing.output = basePricing.outputTokensLongContext;
        }
        if (basePricing.cacheCreationLongContext) {
            pricing.cacheCreation = basePricing.cacheCreationLongContext;
        }
        if (basePricing.cacheReadLongContext) {
            pricing.cacheRead = basePricing.cacheReadLongContext;
        }
    }

    // Apply Batch API discount (50% off for Anthropic, Google)
    if (options?.isBatchMode) {
        pricing.input *= 0.5;
        pricing.output *= 0.5;
    }

    // Apply 1-hour cache pricing (Anthropic: 2x base instead of 1.25x)
    if (options?.cacheType === "1hour" && pricing.input) {
        // 1-hour cache is 2x base input, not 1.25x
        pricing.cacheCreation = pricing.input * 2;
    }

    return pricing;
}

// ============================================================================
// PROVIDER-SPECIFIC CALCULATIONS
// ============================================================================

/**
 * Anthropic (Claude) cost calculation
 * API Response format:
 * {
 *   input_tokens: 100,
 *   output_tokens: 50,
 *   cache_creation_input_tokens: 1000,
 *   cache_read_input_tokens: 5000,
 *   server_tool_use: { web_search_requests: 2 }
 * }
 */
function calculateAnthropicCost(
    usage: AIUsage,
    pricing: ModifiedPricing,
    breakdown: CostBreakdown
): void {
    // Standard input tokens
    if (usage.input_tokens) {
        breakdown.inputCost = (usage.input_tokens / 1_000_000) * pricing.input;
    }

    // Output tokens
    if (usage.output_tokens) {
        breakdown.outputCost = (usage.output_tokens / 1_000_000) * pricing.output;
    }

    // Cache creation (write to cache)
    if (usage.cache_creation_input_tokens && pricing.cacheCreation) {
        breakdown.cacheCreationCost = (usage.cache_creation_input_tokens / 1_000_000) * pricing.cacheCreation;
    }

    // Cache reads (90% discount)
    if (usage.cache_read_input_tokens && pricing.cacheRead) {
        breakdown.cacheReadCost = (usage.cache_read_input_tokens / 1_000_000) * pricing.cacheRead;
    }

    // Server-side tools
    if (usage.server_tool_use) {
        // Web search: $10 per 1,000 searches
        if (usage.server_tool_use.web_search_requests) {
            breakdown.webSearchCost = (usage.server_tool_use.web_search_requests / 1000) * 10;
        }

        // Web fetch: Free (no additional cost beyond tokens)
        // Code execution, bash, etc.: Included in token costs
    }
}

/**
 * OpenAI (GPT) cost calculation
 * API Response format:
 * {
 *   prompt_tokens: 100,
 *   completion_tokens: 50,
 *   prompt_tokens_details: {
 *     cached_tokens: 5000,
 *     reasoning_tokens: 200,
 *     audio_tokens: 100
 *   }
 * }
 */
function calculateOpenAICost(
    usage: AIUsage,
    pricing: ModifiedPricing,
    breakdown: CostBreakdown
): void {
    // Regular input tokens (excluding cached)
    const regularInputTokens = (usage.promptTokens || 0) - (usage.cached_tokens || 0);
    if (regularInputTokens > 0) {
        breakdown.inputCost = (regularInputTokens / 1_000_000) * pricing.input;
    }

    // Cached input tokens (90% discount)
    if (usage.cached_tokens && pricing.cacheRead) {
        breakdown.cacheReadCost = (usage.cached_tokens / 1_000_000) * pricing.cacheRead;
    }

    // Output tokens
    if (usage.completionTokens) {
        breakdown.outputCost = (usage.completionTokens / 1_000_000) * pricing.output;
    }

    // Reasoning tokens (charged at output rate)
    if (usage.reasoning_tokens) {
        breakdown.reasoningCost = (usage.reasoning_tokens / 1_000_000) * pricing.output;
    }

    // Audio input tokens (if separate pricing)
    if (usage.audio_tokens && pricing.audioInput) {
        breakdown.audioInputCost = (usage.audio_tokens / 1_000_000) * pricing.audioInput;
    } else if (usage.audio_tokens) {
        // If no separate audio pricing, use standard input rate
        breakdown.audioInputCost = (usage.audio_tokens / 1_000_000) * pricing.input;
    }

    // Note: OpenAI web search is $10 per 1,000 searches (if used)
    // This would need to be tracked separately in usage.server_tool_use
}

/**
 * Google (Gemini) cost calculation
 * API Response format:
 * {
 *   prompt_token_count: 100,
 *   candidates_token_count: 50,
 *   cached_content_token_count: 5000
 * }
 */
function calculateGoogleCost(
    usage: AIUsage,
    pricing: ModifiedPricing,
    breakdown: CostBreakdown,
    options?: { isLongContext?: boolean }
): void {
    // Regular input tokens (excluding cached)
    const regularInputTokens = (usage.prompt_token_count || 0) - (usage.cached_content_token_count || 0);
    if (regularInputTokens > 0) {
        breakdown.inputCost = (regularInputTokens / 1_000_000) * pricing.input;
    }

    // Cached input tokens (90% discount)
    if (usage.cached_content_token_count && pricing.cacheRead) {
        breakdown.cacheReadCost = (usage.cached_content_token_count / 1_000_000) * pricing.cacheRead;
    }

    // Output tokens (includes thinking tokens for reasoning models)
    if (usage.candidates_token_count) {
        breakdown.outputCost = (usage.candidates_token_count / 1_000_000) * pricing.output;
    }

    // Note: Google uses different pricing for audio/video/image multimodal inputs
    // These are tokenized and included in prompt_token_count
    // Audio: $1.00/MTok (vs $0.30 for text)
    // Video: Same as text/image ($0.30/MTok), 263 tokens/sec
    // This requires separate tracking in the API response to calculate accurately

    // Long context premium flag
    if (options?.isLongContext) {
        breakdown.appliedDiscount = "Long context premium (>200K tokens)";
    }
}

/**
 * XAI (Grok) cost calculation
 * API Response format:
 * {
 *   prompt_tokens: 100,
 *   completion_tokens: 50,
 *   reasoning_tokens: 200,  // For reasoning models
 *   cached_prompt_tokens: 5000  // Automatic caching
 * }
 */
function calculateXAICost(
    usage: AIUsage,
    pricing: ModifiedPricing,
    breakdown: CostBreakdown
): void {
    // Regular input tokens (excluding cached)
    const regularInputTokens = (usage.promptTokens || 0) - (usage.cached_tokens || 0);
    if (regularInputTokens > 0) {
        breakdown.inputCost = (regularInputTokens / 1_000_000) * pricing.input;
    }

    // Cached tokens (90% discount, automatic)
    if (usage.cached_tokens) {
        // XAI automatic caching: $0.02/MTok for Grok 4.1 Fast (90% off $0.20)
        const cacheReadPrice = pricing.input * 0.1;
        breakdown.cacheReadCost = (usage.cached_tokens / 1_000_000) * cacheReadPrice;
    }

    // Output tokens
    if (usage.completionTokens) {
        breakdown.outputCost = (usage.completionTokens / 1_000_000) * pricing.output;
    }

    // Reasoning tokens (charged at output rate)
    if (usage.reasoning_tokens) {
        breakdown.reasoningCost = (usage.reasoning_tokens / 1_000_000) * pricing.output;
    }

    // Server-side tool usage
    if (usage.server_tool_use) {
        // Web search: $5 per 1,000 searches
        if (usage.server_tool_use.web_search_requests) {
            breakdown.webSearchCost = (usage.server_tool_use.web_search_requests / 1000) * 5;
        }

        // X search: $5 per 1,000 searches
        if (usage.server_tool_use.x_search_requests) {
            breakdown.otherToolsCost += (usage.server_tool_use.x_search_requests / 1000) * 5;
        }

        // Code execution: $5 per 1,000 executions
        if (usage.server_tool_use.code_execution_requests) {
            breakdown.codeExecutionCost = (usage.server_tool_use.code_execution_requests / 1000) * 5;
        }

        // Document search: $5 per 1,000 searches
        if (usage.server_tool_use.document_search_requests) {
            breakdown.otherToolsCost += (usage.server_tool_use.document_search_requests / 1000) * 5;
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format cost breakdown as a human-readable string
 */
export function formatCostBreakdown(breakdown: CostBreakdown): string {
    const parts: string[] = [];

    if (breakdown.inputCost > 0) {
        parts.push(`Input: $${breakdown.inputCost.toFixed(4)}`);
    }
    if (breakdown.cacheReadCost > 0) {
        parts.push(`Cache Read: $${breakdown.cacheReadCost.toFixed(4)}`);
    }
    if (breakdown.cacheCreationCost > 0) {
        parts.push(`Cache Write: $${breakdown.cacheCreationCost.toFixed(4)}`);
    }
    if (breakdown.outputCost > 0) {
        parts.push(`Output: $${breakdown.outputCost.toFixed(4)}`);
    }
    if (breakdown.reasoningCost > 0) {
        parts.push(`Reasoning: $${breakdown.reasoningCost.toFixed(4)}`);
    }
    if (breakdown.audioInputCost > 0) {
        parts.push(`Audio Input: $${breakdown.audioInputCost.toFixed(4)}`);
    }
    if (breakdown.imageOutputCost > 0) {
        parts.push(`Image Gen: $${breakdown.imageOutputCost.toFixed(4)}`);
    }
    if (breakdown.webSearchCost > 0) {
        parts.push(`Web Search: $${breakdown.webSearchCost.toFixed(4)}`);
    }
    if (breakdown.codeExecutionCost > 0) {
        parts.push(`Code Exec: $${breakdown.codeExecutionCost.toFixed(4)}`);
    }
    if (breakdown.otherToolsCost > 0) {
        parts.push(`Other Tools: $${breakdown.otherToolsCost.toFixed(4)}`);
    }

    parts.push(`Total: $${breakdown.totalCost.toFixed(4)}`);

    return parts.join(" | ");
}

/**
 * Estimate cost before making an API call
 */
export function estimateCost(
    modelId: string,
    estimatedTokens: {
        input?: number;
        output?: number;
        cached?: number;
    }
): number {
    const model = getModelConfig(modelId);
    if (!model || !model.pricing) {
        throw new Error(`Model pricing not found: ${modelId}`);
    }

    const { input = 0, output = 0, cached = 0 } = estimatedTokens;
    const pricing = model.pricing;

    let cost = 0;

    // Input tokens
    cost += (input / 1_000_000) * pricing.inputTokens;

    // Output tokens
    cost += (output / 1_000_000) * pricing.outputTokens;

    // Cached tokens (if supported)
    if (cached > 0 && pricing.cacheRead) {
        cost += (cached / 1_000_000) * pricing.cacheRead;
    }

    return cost;
}
