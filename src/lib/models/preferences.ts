/**
 * User Model Preferences Service
 * Manages user preferences for AI model selection and availability
 */

import { prisma } from "@/lib/db";
import {
    canUserAccessModel,
    filterModelsByPlan,
    getAllModelIds,
    getDefaultModelForPlan,
    getModelsForPlan,
    type ModelConfig,
    type PlanName,
} from "./config";
import { getUserPlan } from "@/lib/subscription";

export interface UserModelPreferences {
    preferredModel: string;
    enabledModels: string[];
    availableModels: ModelConfig[];
    userPlan: PlanName;
}

/**
 * Get user's model preferences
 */
export async function getUserModelPreferences(
    userId: string
): Promise<UserModelPreferences> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            preferredModel: true,
            enabledModels: true,
            subscription: {
                include: {
                    plan: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Get user's plan
    const userPlan = await getUserPlan(userId);

    // Get all models available for user's plan
    const availableModels = getModelsForPlan(userPlan);

    // Filter user's enabled models to only include accessible ones
    const enabledModels = filterModelsByPlan(user.enabledModels, userPlan);

    // Validate preferred model is accessible
    let preferredModel = user.preferredModel;
    if (!canUserAccessModel(preferredModel, userPlan)) {
        // Fall back to default if preferred model is not accessible
        preferredModel = getDefaultModelForPlan(userPlan);
    }

    return {
        preferredModel,
        enabledModels,
        availableModels,
        userPlan,
    };
}

/**
 * Update user's preferred model
 */
export async function updatePreferredModel(
    userId: string,
    modelId: string
): Promise<void> {
    // Verify user can access this model
    const userPlan = await getUserPlan(userId);

    if (!canUserAccessModel(modelId, userPlan)) {
        throw new Error(
            `Model ${modelId} requires ${userPlan === "HOBBY" ? "Pro" : "higher"} plan`
        );
    }

    await prisma.user.update({
        where: { id: userId },
        data: { preferredModel: modelId },
    });
}

/**
 * Enable or disable a model for the user
 */
export async function toggleModelEnabled(
    userId: string,
    modelId: string,
    enabled: boolean
): Promise<void> {
    // Verify user can access this model
    const userPlan = await getUserPlan(userId);

    if (!canUserAccessModel(modelId, userPlan)) {
        throw new Error(
            `Model ${modelId} requires ${userPlan === "HOBBY" ? "Pro" : "higher"} plan`
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { enabledModels: true },
    });

    if (!user) {
        throw new Error("User not found");
    }

    let enabledModels = [...user.enabledModels];

    if (enabled) {
        // Add model if not already enabled
        if (!enabledModels.includes(modelId)) {
            enabledModels.push(modelId);
        }
    } else {
        // Remove model
        enabledModels = enabledModels.filter((id) => id !== modelId);

        // Ensure at least one model is enabled
        if (enabledModels.length === 0) {
            throw new Error("At least one model must be enabled");
        }
    }

    await prisma.user.update({
        where: { id: userId },
        data: { enabledModels },
    });
}

/**
 * Update all enabled models at once
 */
export async function updateEnabledModels(
    userId: string,
    modelIds: string[]
): Promise<void> {
    if (modelIds.length === 0) {
        throw new Error("At least one model must be enabled");
    }

    // Verify user can access all requested models
    const userPlan = await getUserPlan(userId);

    const inaccessibleModels = modelIds.filter(
        (id) => !canUserAccessModel(id, userPlan)
    );

    if (inaccessibleModels.length > 0) {
        throw new Error(
            `Cannot enable models that require higher plan: ${inaccessibleModels.join(", ")}`
        );
    }

    await prisma.user.update({
        where: { id: userId },
        data: { enabledModels: modelIds },
    });
}

/**
 * Reset user's model preferences to defaults
 */
export async function resetModelPreferences(userId: string): Promise<void> {
    const userPlan = await getUserPlan(userId);
    const defaultModel = getDefaultModelForPlan(userPlan);
    const availableModels = getModelsForPlan(userPlan);
    const enabledModels = availableModels.map((m) => m.id);

    await prisma.user.update({
        where: { id: userId },
        data: {
            preferredModel: defaultModel,
            enabledModels,
        },
    });
}

/**
 * Get user's preferred model for a new project
 * Falls back to default if preferred model is not accessible
 */
export async function getUserPreferredModel(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferredModel: true },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const userPlan = await getUserPlan(userId);

    // Validate model is accessible
    if (canUserAccessModel(user.preferredModel, userPlan)) {
        return user.preferredModel;
    }

    // Fall back to default
    return getDefaultModelForPlan(userPlan);
}

/**
 * Check if a user has a specific model enabled
 */
export async function isModelEnabled(
    userId: string,
    modelId: string
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { enabledModels: true },
    });

    if (!user) {
        return false;
    }

    return user.enabledModels.includes(modelId);
}
