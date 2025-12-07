/**
 * AI Model Constants
 */

import type { ModelUseCase, ModelProvider, ModelTier } from "./types";

// ============================================================================
// USE CASE DEFINITIONS
// ============================================================================

export const MODEL_USE_CASES: Record<ModelUseCase, {
    displayName: string;
    description: string;
    isUserSelectable: boolean;
    icon: string;
}> = {
    coding: {
        displayName: "Coding",
        description: "Code generation, debugging, and software development tasks",
        isUserSelectable: true,
        icon: "Code",
    },
    "image-generation": {
        displayName: "Image Generation",
        description: "Generate images from text descriptions",
        isUserSelectable: true,
        icon: "Image",
    },
    "video-generation": {
        displayName: "Video Generation",
        description: "Generate videos from text descriptions",
        isUserSelectable: true,
        icon: "Video",
    },
    orchestrator: {
        displayName: "Orchestrator",
        description: "Project naming, task planning, and coordination (system)",
        isUserSelectable: false,
        icon: "Brain",
    },
    memory: {
        displayName: "Memory",
        description: "Context management and memory (system)",
        isUserSelectable: false,
        icon: "Database",
    },
};

// ============================================================================
// PROVIDER DEFINITIONS
// ============================================================================

export const MODEL_PROVIDERS: Record<ModelProvider, {
    displayName: string;
    description: string;
    website: string;
}> = {
    anthropic: {
        displayName: "Anthropic",
        description: "Claude models - excellent for coding and reasoning",
        website: "https://anthropic.com",
    },
    openai: {
        displayName: "OpenAI",
        description: "GPT models - versatile and widely used",
        website: "https://openai.com",
    },
    google: {
        displayName: "Google",
        description: "Gemini models - strong multimodal capabilities",
        website: "https://deepmind.google",
    },
    "x-ai": {
        displayName: "xAI",
        description: "Grok models - fast and cost-effective",
        website: "https://x.ai",
    },
    openrouter: {
        displayName: "OpenRouter",
        description: "Multi-provider gateway - fallback option",
        website: "https://openrouter.ai",
    },
};

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

export const MODEL_TIERS: Record<ModelTier, {
    displayName: string;
    description: string;
}> = {
    fast: {
        displayName: "Fast",
        description: "Optimized for speed and cost efficiency",
    },
    expert: {
        displayName: "Expert",
        description: "Best quality for complex tasks",
    },
};

// ============================================================================
// DEFAULT MODEL IDS
// ============================================================================

export const DEFAULT_MODEL_IDS: Record<ModelUseCase, string> = {
    coding: "anthropic/claude-sonnet-4.5",
    "image-generation": "google/gemini-2.5-flash-image",
    "video-generation": "google/veo-3.1-generate-preview",
    orchestrator: "x-ai/grok-4-1-fast",
    memory: "x-ai/grok-4-1-fast",
};

// ============================================================================
// CACHE SETTINGS
// ============================================================================

export const MODEL_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
