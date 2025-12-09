/**
 * Client-safe Model Types
 * 
 * These types can be safely imported in client components without
 * pulling in Prisma or other server-only dependencies.
 * 
 * For server components, use "@/lib/models" instead.
 */

// Re-export types from the main types file
// These are pure TypeScript types with no runtime dependencies
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

// Re-export constants (these are safe for client components)
export { MODEL_USE_CASES, MODEL_PROVIDERS, MODEL_TIERS, DEFAULT_MODEL_IDS } from "./constants";
