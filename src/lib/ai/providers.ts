/**
 * Unified AI Provider Registry
 * 
 * Centralized provider configuration for all AI models.
 * Simplifies provider management by using a registry pattern
 * instead of manual provider switching logic.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type ProviderType = "anthropic" | "openrouter" | "openai" | "google" | "x-ai";

type ProviderClient =
    | ReturnType<typeof createAnthropic>
    | ReturnType<typeof createOpenRouter>
    | ReturnType<typeof createOpenAI>
    | ReturnType<typeof createGoogleGenerativeAI>
    | ReturnType<typeof createXai>;

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

class AIProviderRegistry {
    private providers: Map<ProviderType, ProviderClient> = new Map();
    private initialized = false;

    /**
     * Initialize all provider clients
     * Called once on first use
     */
    private initialize() {
        if (this.initialized) return;

        // Initialize all providers with their API keys
        this.providers.set("anthropic", createAnthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || "",
        }));

        this.providers.set("openai", createOpenAI({
            apiKey: process.env.OPENAI_API_KEY || "",
        }));

        this.providers.set("google", createGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
        }));

        this.providers.set("x-ai", createXai({
            apiKey: process.env.XAI_API_KEY || "",
        }));

        this.providers.set("openrouter", createOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY || "",
        }));

        this.initialized = true;
    }

    /**
     * Get a provider client by type
     */
    getProvider(providerType: ProviderType): ProviderClient {
        this.initialize();

        const provider = this.providers.get(providerType);
        if (!provider) {
            throw new Error(`Provider ${providerType} not found in registry`);
        }

        return provider;
    }

    /**
     * Get a model instance from a provider
     * 
     * @param providerType - The provider type (anthropic, openai, etc.)
     * @param modelPath - The model path/ID for that provider
     * @returns Language model instance ready to use
     */
    getModel(providerType: ProviderType, modelPath: string): LanguageModel {
        const provider = this.getProvider(providerType);
        return provider(modelPath) as LanguageModel;
    }

    /**
     * Check if a provider has an API key configured
     */
    isProviderConfigured(providerType: ProviderType): boolean {
        const envVars: Record<ProviderType, string | undefined> = {
            "anthropic": process.env.ANTHROPIC_API_KEY,
            "openai": process.env.OPENAI_API_KEY,
            "google": process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            "x-ai": process.env.XAI_API_KEY,
            "openrouter": process.env.OPENROUTER_API_KEY,
        };

        return !!envVars[providerType];
    }

    /**
     * Get all configured provider types
     */
    getConfiguredProviders(): ProviderType[] {
        return (["anthropic", "openai", "google", "x-ai", "openrouter"] as ProviderType[])
            .filter(type => this.isProviderConfigured(type));
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Global provider registry singleton
 * Use this to access all AI providers
 */
export const providerRegistry = new AIProviderRegistry();
