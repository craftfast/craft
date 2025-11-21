/**
 * AI Model Configuration System
 * User-selectable models with preferences
 * 
 * CODING MODELS (User-selectable):
 * - Claude Haiku 4.5 (Fast, affordable)
 * - Claude Sonnet 4.5 (Default, balanced)
 * - GPT-5 Mini (Fast OpenAI)
 * - GPT-5.1 (Premium OpenAI)
 * - Gemini 2.5 Flash (Fast Google)
 * - Gemini 3 Pro Preview (Premium Google)
 * - Grok Code Fast 1 (Fast XAI coding model)
 * 
 * SYSTEM MODELS (Fixed, non-changeable):
 * - Grok 4.1 Fast: Project naming, memory/context
 * 
 * IMAGE GENERATION:
 * - Gemini 2.5 Flash Image: Fast image generation
 * 
 * FALLBACK:
 * - OpenRouter used as fallback when primary providers fail
 */

export type ModelTier = "fast" | "expert";

/**
 * App-specific use cases for different model capabilities
 */
export type ModelUseCase =
    | "orchestrator"        // Project naming (Grok 4.1 Fast - fixed)
    | "memory"              // Memory management (Grok 4.1 Fast - fixed)
    | "coding"              // Code generation, editing, debugging (User-selectable)
    | "image-generation"    // Creating images from text/prompts (Gemini)
    | "video-generation";   // Creating videos from text/prompts (Veo, Sora)

/**
 * Input types that models can accept
 */
export type ModelInputType = "text" | "image" | "audio" | "video" | "pdf" | "document";

/**
 * Output types that models can generate
 */
export type ModelOutputType = "text" | "code" | "image" | "audio" | "video" | "structured-data";

export interface ModelCapabilities {
    supportedInputs: ModelInputType[]; // What types of input this model accepts
    supportedOutputs: ModelOutputType[]; // What types of output this model can generate
    maxContextLength?: number; // Maximum context window in tokens
    supportsStreaming: boolean; // Whether model supports streaming responses
    supportsSystemPrompts: boolean; // Whether model supports system prompts
    supportsWebSearch: boolean; // Whether model supports web search/grounding
    supportsFunctionCalling: boolean; // Whether model supports function/tool calling
    supportsJsonMode: boolean; // Whether model has native JSON mode for structured output
}

export interface ModelPricing {
    // ============================================================================
    // PRICING STANDARD:
    // - Tokens: USD per 1 million (implied)
    // - Images: USD per 1 thousand (implied) 
    // - Tool calls: USD per 1 thousand requests (implied)
    // ============================================================================

    // STANDARD TOKEN PRICING (Required)
    inputTokens: number;              // USD per 1M input tokens
    outputTokens: number;             // USD per 1M output tokens

    // LONG CONTEXT PRICING (Optional - Higher rates for >200K context)
    longContextThreshold?: number;    // Context size threshold (e.g., 200000)
    inputTokensLongContext?: number;  // USD per 1M input tokens above threshold
    outputTokensLongContext?: number; // USD per 1M output tokens above threshold

    // PROMPT CACHING (Optional - Anthropic, OpenAI, Google)
    cacheCreation?: number;           // USD per 1M cache creation tokens
    cacheRead?: number;               // USD per 1M cache read tokens (90% discount)
    cacheCreationLongContext?: number; // USD per 1M cache creation (long context)
    cacheReadLongContext?: number;    // USD per 1M cache read (long context)
    cacheDuration?: string;           // e.g., "5-min", "1-hour"

    // MULTIMODAL INPUTS (Optional - Different rates per modality)
    imageInputTokens?: number;        // USD per 1M image input tokens
    audioInputTokens?: number;        // USD per 1M audio input tokens
    videoInputTokens?: number;        // USD per 1M video input tokens

    // MULTIMODAL OUTPUTS (Optional - Different rates per modality)
    audioOutputTokens?: number;       // USD per 1M audio output tokens

    // GENERATED CONTENT OUTPUT (Optional - Per-item pricing)
    images?: number;                  // USD per 1K images generated
    videoSeconds?: number;            // USD per second of video generated

    // TOOL/FEATURE CHARGES (Optional - Per-use fees)
    webSearchFreePerDay?: number;     // Free requests per day
    webSearch?: number;               // USD per 1K search requests
    mapsGroundingFreePerDay?: number; // Free requests per day
    mapsGrounding?: number;           // USD per 1K grounding requests
}

export interface ModelConfig {
    id: string; // OpenRouter format: "provider/model-name" (e.g., "anthropic/claude-sonnet-4.5")
    name: string; // Direct provider API name (e.g., "claude-sonnet-4-5" for Anthropic, "gpt-5-mini" for OpenAI)
    displayName: string;
    provider: "anthropic" | "openrouter" | "openai" | "google" | "x-ai";
    tier: ModelTier;
    description: string;
    useCase: ModelUseCase; // Primary use case categorization for this model
    capabilities: ModelCapabilities; // What this model can do
    pricing?: ModelPricing;
}/**
 * All available AI models in the system
 * 
 * SYSTEM MODELS (Fixed):
 * - Grok 4.1 Fast: Project naming, memory (non-changeable)
 * 
 * CODING MODELS (User-selectable):
 * - Claude Haiku 4.5, Claude Sonnet 4.5 (Default)
 * - GPT-5 Mini, GPT-5.1
 * - Gemini 2.5 Flash, Gemini 3 Pro Preview
 * - Grok Code Fast 1
 * 
 * IMAGE GENERATION:
 * - Gemini 2.5 Flash Image
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
    // ========================================================================
    // SYSTEM MODELS (Fixed, non-changeable)
    // ========================================================================
    "x-ai/grok-4-1-fast": {
        id: "x-ai/grok-4-1-fast",
        name: "grok-4-1-fast-non-reasoning",
        displayName: "Grok 4.1 Fast",
        provider: "x-ai",
        tier: "fast",
        description: "System: Project naming and memory (2M context)",
        useCase: "orchestrator",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 2000000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,  // Web search is via server-side tools with per-use charges
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: {
            inputTokens: 0.20,  // $0.20 per 1M tokens (text/image)
            outputTokens: 0.50,  // $0.50 per 1M tokens
            cacheRead: 0.05,  // $0.05 per 1M tokens (cached input tokens, 75% discount)
            // Note: Image inputs use same pricing as text (no separate charge)
            // Note: Server-side tools (per 1,000 calls):
            //   - Web Search: $5, X Search: $5, Code Execution: $5
            //   - Document Search: $5, Collections Search: $2.50
            //   - Live Search: $25 per 1,000 sources
            //   - View Image/Video, Remote MCP: Token-based only
            // Note: XAI doesn't support: audio/video inputs, image generation
        },
    },

    // ========================================================================
    // CODING MODELS (User-selectable)
    // ========================================================================

    // Anthropic Claude Models (Direct Provider)
    "anthropic/claude-haiku-4.5": {
        id: "anthropic/claude-haiku-4.5",
        name: "claude-haiku-4-5",
        displayName: "Claude Haiku 4.5",
        provider: "anthropic",
        tier: "fast",
        description: "Fast and affordable coding assistant",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "pdf", "document"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 200000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,  // Web search available via server-side tool
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: {
            inputTokens: 1.00,  // $1.00 per 1M tokens (base input)
            outputTokens: 5.00,  // $5.00 per 1M tokens
            cacheCreation: 1.25,  // $1.25 per 1M tokens (5-min cache: 1.25x base)
            cacheRead: 0.10,  // $0.10 per 1M tokens (0.1x base, 90% discount)
            cacheDuration: "5-min",
            webSearch: 10,  // $10 per 1K searches
            // Note: 1-hour cache writes: $2.00 per 1M tokens (2x base)
            // Note: Batch API: 50% discount ($0.50 input, $2.50 output)
            // Note: Tool use system prompt: 346 tokens (auto/none) or 313 tokens (any/tool)
            // Note: Server-side tools:
            //   - Web Fetch: Free (token costs only)
            //   - Code Execution: 50 free hours/day, then $0.05/hour/container
            //   - Bash tool: +245 input tokens
            //   - Text Editor tool: +700 input tokens
            //   - Computer Use tool: +735 input tokens, +466-499 system prompt tokens
        },
    },
    "anthropic/claude-sonnet-4.5": {
        id: "anthropic/claude-sonnet-4.5",
        name: "claude-sonnet-4-5",
        displayName: "Claude Sonnet 4.5",
        provider: "anthropic",
        tier: "expert",
        description: "Balanced performance and quality (Default)",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "pdf", "document"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 1000000,  // 1M context (beta), 200K standard
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,  // Web search available via server-side tool
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: {
            inputTokens: 3.00,  // $3.00 per 1M tokens (<=200K tokens)
            outputTokens: 15.00,  // $15.00 per 1M tokens (<=200K tokens)
            longContextThreshold: 200000,  // >200K tokens
            inputTokensLongContext: 6.00,  // $6.00 per 1M tokens for long context
            outputTokensLongContext: 22.50,  // $22.50 per 1M tokens for long context
            cacheCreation: 3.75,  // $3.75 per 1M tokens (5-min cache: 1.25x base)
            cacheRead: 0.30,  // $0.30 per 1M tokens (0.1x base, 90% discount)
            cacheCreationLongContext: 7.50,  // $7.50 per 1M tokens (5-min cache for long context)
            cacheReadLongContext: 0.60,  // $0.60 per 1M tokens for long context cache reads
            cacheDuration: "5-min",
            webSearch: 10,  // $10 per 1K searches
            // Note: 1-hour cache writes: $6.00 per 1M tokens (2x base)
            // Note: Long context 1-hour cache: $12.00 per 1M tokens
            // Note: Batch API with long context: $3.00 input, $11.25 output
            // Note: Standard 1-hour cache writes: $6.00 per 1M tokens (2x base)
            // Note: Standard Batch API: 50% discount ($1.50 input, $7.50 output)
            // Note: Tool use system prompt: 346 tokens (auto/none) or 313 tokens (any/tool)
            // Note: Server-side tools:
            //   - Web Fetch: Free (token costs only)
            //   - Code Execution: 50 free hours/day, then $0.05/hour/container
            //   - Bash tool: +245 input tokens
            //   - Text Editor tool: +700 input tokens
            //   - Computer Use tool: +735 input tokens, +466-499 system prompt tokens
        },
    },

    // OpenAI GPT Models (Direct Provider)
    "openai/gpt-5-mini": {
        id: "openai/gpt-5-mini",
        name: "gpt-5-mini",
        displayName: "GPT-5 Mini",
        provider: "openai",
        tier: "fast",
        description: "Fast OpenAI model for coding",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 400000,  // 400K context window
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,  // Web search available via built-in tool
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: {
            inputTokens: 0.25,  // $0.25 per 1M tokens (Standard tier)
            outputTokens: 2.00,  // $2.00 per 1M tokens (Standard tier)
            cacheRead: 0.025,  // $0.025 per 1M tokens (10% of base, 90% discount)
            webSearch: 10,  // $10 per 1K web search calls (all models)
            // Note: OpenAI Pricing Tiers (per 1M tokens):
            //   Standard: $0.25 input / $0.025 cached / $2.00 output
            //   Batch: $0.125 input / $0.0125 cached / $1.00 output (50% off)
            //   Flex: $0.125 input / $0.0125 cached / $1.00 output (50% off, slower)
            //   Priority: $0.45 input / $0.045 cached / $3.60 output (faster)
            // Note: gpt-5-nano available at lower price: Standard $0.05/$0.40, Batch $0.025/$0.20
            // Note: Built-in tools (shared across models):
            //   - Code Interpreter: $0.03 per container
            //   - File search storage: $0.10/GB per day (1GB free)
            //   - File search tool call: $2.50 per 1,000 calls (Responses API only)
            //   - Web search: $10 per 1,000 calls + search content tokens at model rates
            // Note: For gpt-4o-mini with non-preview web search: Fixed 8K input tokens per call
            // Note: No long context pricing tiers - flat rate regardless of context size
        },
    },
    "openai/gpt-5.1": {
        id: "openai/gpt-5.1",
        name: "gpt-5.1",
        displayName: "GPT-5.1",
        provider: "openai",
        tier: "expert",
        description: "Premium OpenAI model for complex tasks",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 400000,  // 400K context window
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,  // Web search available via built-in tool
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: {
            inputTokens: 1.25,  // $1.25 per 1M tokens (Standard tier)
            outputTokens: 10.00,  // $10.00 per 1M tokens (Standard tier)
            cacheRead: 0.125,  // $0.125 per 1M tokens (10% of base, 90% discount)
            webSearch: 10,  // $10 per 1K web search calls (all models)
            // Note: OpenAI Pricing Tiers (per 1M tokens):
            //   Standard: $1.25 input / $0.125 cached / $10.00 output
            //   Batch: $0.625 input / $0.0625 cached / $5.00 output (50% off)
            //   Flex: $0.625 input / $0.0625 cached / $5.00 output (50% off, slower)
            //   Priority: $2.50 input / $0.25 cached / $20.00 output (faster)
            // Note: Alternative naming: gpt-5, gpt-5.1-chat-latest, gpt-5.1-codex (same pricing)
            // Note: gpt-5-pro available: Standard $15/$120, Batch $7.50/$60 (no caching)
            // Note: Built-in tools (shared across models):
            //   - Code Interpreter: $0.03 per container
            //   - File search storage: $0.10/GB per day (1GB free)
            //   - File search tool call: $2.50 per 1,000 calls (Responses API only)
            //   - Web search: $10 per 1,000 calls + search content tokens at model rates
            // Note: Reasoning tokens not visible via API but occupy context and billed as output
            // Note: No long context pricing tiers - flat rate regardless of context size
        },
    },

    // Google Gemini Models (Direct Provider)
    "google/gemini-2.5-flash": {
        id: "google/gemini-2.5-flash",
        name: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        provider: "google",
        tier: "fast",
        description: "Fast Google model with large context",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "video", "audio"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 1048576,  // 1M token context window
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: {
            inputTokens: 0.30,  // $0.30 per 1M tokens (text/image/video)
            outputTokens: 2.50,  // $2.50 per 1M tokens (includes thinking tokens)
            audioInputTokens: 1.00,  // $1.00 per 1M tokens (audio separate)
            audioOutputTokens: 0.10,  // $0.10 per 1M tokens (audio cached)
            cacheRead: 0.03,  // $0.03 per 1M tokens (text/image/video cached)
            webSearchFreePerDay: 1500,  // Shared with Flash-Lite
            webSearch: 35,  // $35 per 1K grounded prompts
            mapsGroundingFreePerDay: 1500,
            mapsGrounding: 25,  // $25 per 1K grounding prompts
            // Note: Context cache storage: $1.00 per 1M tokens per hour
            // Note: Video tokenization: 263 tokens/second
            // Note: Audio tokenization: 32 tokens/second  
            // Note: Batch API: 50% discount available
            // Note: Free tier: Free input/output (500 RPD for Search, 500 RPD for Maps)
            // Note: No long context pricing tiers - flat rate regardless of context size
        },
    },
    "google/gemini-3-pro-preview": {
        id: "google/gemini-3-pro-preview",
        name: "gemini-3-pro-preview",
        displayName: "Gemini 3 Pro (Preview)",
        provider: "google",
        tier: "expert",
        description: "Best model for multimodal understanding and agentic coding",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text", "image", "video", "audio"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 1048576,  // 1M token context window
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: true,
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: {
            inputTokens: 2.00,  // $2.00 per 1M tokens (prompts <=200K tokens)
            outputTokens: 12.00,  // $12.00 per 1M tokens (prompts <=200K, includes thinking)
            longContextThreshold: 200000,  // >200K tokens
            inputTokensLongContext: 4.00,  // $4.00 per 1M tokens for large prompts
            outputTokensLongContext: 18.00,  // $18.00 per 1M tokens for large prompts
            cacheRead: 0.20,  // $0.20 per 1M tokens (prompts <=200K)
            cacheReadLongContext: 0.40,  // $0.40 per 1M tokens for large prompts cache reads
            webSearchFreePerDay: 1500,
            webSearch: 14,  // $14 per 1K search queries (coming soon)
            // Note: Context cache storage: $4.50 per 1M tokens per hour
            // Note: Batch API: 50% discount available
            // Note: Free tier not available (paid only)
            // Note: Google Maps grounding not available
        },
    },

    // xAI Grok Models (Direct Provider)
    "x-ai/grok-code-fast-1": {
        id: "x-ai/grok-code-fast-1",
        name: "grok-code-fast-1",
        displayName: "Grok Code Fast 1",
        provider: "x-ai",
        tier: "fast",
        description: "Lightning fast reasoning model for agentic coding",
        useCase: "coding",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["text", "code", "structured-data"],
            maxContextLength: 256000,
            supportsStreaming: true,
            supportsSystemPrompts: true,
            supportsWebSearch: false,  // Web search via server-side tools with per-use charges
            supportsFunctionCalling: true,
            supportsJsonMode: true,
        },
        pricing: {
            inputTokens: 0.20,  // $0.20 per 1M tokens
            outputTokens: 1.50,  // $1.50 per 1M tokens
            cacheRead: 0.02,  // $0.02 per 1M tokens (90% discount, automatic)
            // Note: Server-side tools: Web Search $5/1K, Code Execution $5/1K
        },
    },

    // ========================================================================
    // IMAGE GENERATION
    // ========================================================================
    "google/gemini-2.5-flash-image": {
        id: "google/gemini-2.5-flash-image",
        name: "gemini-2.5-flash-image",
        displayName: "Gemini 2.5 Flash Image 🍌",
        provider: "google",
        tier: "fast",
        description: "Native image generation optimized for speed and flexibility",
        useCase: "image-generation",
        capabilities: {
            supportedInputs: ["text", "image"],
            supportedOutputs: ["image"],
            maxContextLength: 32768,  // 32K context window
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: {
            inputTokens: 0.30,  // $0.30 per 1M tokens (text/image input)
            outputTokens: 0.30,  // $0.30 per 1M tokens (text output)
            images: 39,  // $39 per 1K images (up to 1024x1024px, was $0.039/image)
            // Note: Image output = $30 per 1M tokens (1290 tokens per image = $0.039)
            // Note: Text input/output priced same as Gemini 2.5 Flash
            // Note: Batch API: 50% discount available
            // Note: Paid tier only (not available on free tier)
            // Note: Preview model - may change before becoming stable
        },
    },

    // ========================================================================
    // VIDEO GENERATION
    // ========================================================================
    "google/veo-3.1-generate-preview": {
        id: "google/veo-3.1-generate-preview",
        name: "veo-3.1-generate-preview",
        displayName: "Veo 3.1 Standard (Preview)",
        provider: "google",
        tier: "expert",
        description: "Latest video generation model with audio (Preview)",
        useCase: "video-generation",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["video"],
            maxContextLength: 32768,  // Assumed similar to image gen
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: {
            inputTokens: 0.30,  // Assumed similar to Gemini pricing
            outputTokens: 0.30,
            videoSeconds: 0.40,  // $0.40 per second of video with audio (default)
            // Note: Paid tier only (not available on free tier)
            // Note: Preview model - may change before becoming stable
            // Note: More restrictive rate limits
            // Note: Output used to improve Google products
        },
    },
    "google/veo-3.1-fast-generate-preview": {
        id: "google/veo-3.1-fast-generate-preview",
        name: "veo-3.1-fast-generate-preview",
        displayName: "Veo 3.1 Fast (Preview)",
        provider: "google",
        tier: "fast",
        description: "Fast video generation model with audio (Preview)",
        useCase: "video-generation",
        capabilities: {
            supportedInputs: ["text"],
            supportedOutputs: ["video"],
            maxContextLength: 32768,  // Assumed similar to image gen
            supportsStreaming: false,
            supportsSystemPrompts: false,
            supportsWebSearch: false,
            supportsFunctionCalling: false,
            supportsJsonMode: false,
        },
        pricing: {
            inputTokens: 0.30,  // Assumed similar to Gemini pricing
            outputTokens: 0.30,
            videoSeconds: 0.15,  // $0.15 per second of video with audio (default)
            // Note: Paid tier only (not available on free tier)
            // Note: Preview model - may change before becoming stable
            // Note: More restrictive rate limits
            // Note: Output used to improve Google products
        },
    },
};

// ============================================================================
// CORE UTILITY FUNCTIONS
// ============================================================================

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | null {
    return AVAILABLE_MODELS[modelId] || null;
}

/**
 * Get all available model IDs
 */
export function getAllModelIds(): string[] {
    return Object.keys(AVAILABLE_MODELS);
}

// Plan-based access restrictions removed - all models available to all users

// ============================================================================
// SYSTEM MODEL FUNCTIONS (Fixed, non-changeable)
// ============================================================================

/**
 * Get the naming model for project name generation
 * FIXED: Users cannot change this model
 */
export function getNamingModel(): string {
    return "x-ai/grok-4-1-fast";
}

/**
 * Get the memory model for context and memory management
 * FIXED: Users cannot change this model
 */
export function getMemoryModel(): string {
    return "x-ai/grok-4-1-fast";
}

/**
 * Get the orchestrator model (legacy, same as naming/memory)
 */
export function getOrchestratorModel(): string {
    return "x-ai/grok-4-1-fast";
}

/**
 * Get the image generation model
 */
export function getImageGenerationModel(): string {
    return "google/gemini-2.5-flash-image";
}

// ============================================================================
// CODING MODEL FUNCTIONS (User-selectable)
// ============================================================================

/**
 * Get all available coding models
 */
export function getAvailableCodingModels(): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS).filter(
        (model) => model.useCase === "coding"
    );
}

/**
 * Get the default coding model (Claude Sonnet 4.5)
 */
export function getDefaultCodingModel(): string {
    return "anthropic/claude-sonnet-4.5";
}

/**
 * Get coding model by user preference
 * Falls back to default if preference is invalid or model is disabled
 */
export function getCodingModel(
    userPreference?: string | null,
    enabledModels?: string[]
): string {
    // If no preference, return default
    if (!userPreference) {
        return getDefaultCodingModel();
    }

    // Check if model exists and is a coding model
    const model = AVAILABLE_MODELS[userPreference];
    if (!model || model.useCase !== "coding") {
        return getDefaultCodingModel();
    }

    // Check if model is enabled (if enabledModels is provided)
    if (enabledModels && !enabledModels.includes(userPreference)) {
        return getDefaultCodingModel();
    }

    return userPreference;
}

/**
 * Legacy function for backward compatibility
 * Maps "fast"/"expert" tier to a default model
 */
export function getCodingModelByTier(tier: ModelTier): string {
    return tier === "fast"
        ? "anthropic/claude-haiku-4.5"
        : "anthropic/claude-sonnet-4.5";
}

/**
 * Legacy functions for backward compatibility
 */
export function getFastCodingModel(): string {
    return "anthropic/claude-haiku-4.5";
}

export function getExpertCodingModel(): string {
    return "anthropic/claude-sonnet-4.5";
}


