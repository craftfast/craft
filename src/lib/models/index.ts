/**
 * AI Model System - Unified Entry Point
 * 
 * This is the single entry point for all AI model operations.
 * All model data is loaded from the database with fallback to JSON config.
 * 
 * USAGE:
 *   import { modelService } from "@/lib/models";
 *   
 *   // Get user's preferred model for a use case
 *   const codingModel = await modelService.getUserPreferredModel(userId, "coding");
 *   
 *   // Get all available models for a use case
 *   const codingModels = await modelService.getModelsForUseCase("coding");
 *   
 *   // Update user's model preference
 *   await modelService.setUserPreferredModel(userId, "coding", "anthropic/claude-sonnet-4.5");
 */

export { modelService } from "./service";
export type {
    ModelConfig,
    ModelCapabilities,
    ModelPricing,
    ModelProvider,
    ModelTier,
    ModelUseCase,
    ModelInputType,
    ModelOutputType,
    UserModelPreferences,
} from "./types";

// Re-export constants
export { MODEL_USE_CASES, MODEL_PROVIDERS, MODEL_TIERS, DEFAULT_MODEL_IDS } from "./constants";
