/**
 * Comprehensive Pricing Configuration Verification
 * 
 * This script verifies:
 * 1. All models have valid pricing configuration
 * 2. Pricing calculations work correctly
 * 3. Model configs match pricing-constants
 * 4. Cost calculation functions work as expected
 */

import { AVAILABLE_MODELS, type ModelConfig } from "@/lib/models/config";
import { getModelPricing, calculateAICost } from "@/lib/pricing-constants";

// Test cases for cost calculation
const TEST_CASES = [
    {
        name: "Claude Haiku 4.5 - 1M input, 1M output",
        modelId: "anthropic/claude-haiku-4.5",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        expectedCost: 6.00, // $1.00 input + $5.00 output
    },
    {
        name: "Claude Sonnet 4.5 - 1M input, 1M output (standard)",
        modelId: "anthropic/claude-sonnet-4.5",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        expectedCost: 18.00, // $3.00 input + $15.00 output
    },
    {
        name: "GPT-5 Mini - 500K input, 500K output",
        modelId: "openai/gpt-5-mini",
        inputTokens: 500_000,
        outputTokens: 500_000,
        expectedCost: 1.125, // ($0.25 * 0.5) + ($2.00 * 0.5)
    },
    {
        name: "GPT-5.1 - 100K input, 100K output",
        modelId: "openai/gpt-5.1",
        inputTokens: 100_000,
        outputTokens: 100_000,
        expectedCost: 1.125, // ($1.25 * 0.1) + ($10.00 * 0.1)
    },
    {
        name: "Gemini 2.5 Flash - 1M input, 1M output",
        modelId: "google/gemini-2.5-flash",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        expectedCost: 2.80, // $0.30 input + $2.50 output
    },
    {
        name: "Gemini 3 Pro - 1M input, 1M output (standard)",
        modelId: "google/gemini-3-pro-preview",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        expectedCost: 14.00, // $2.00 input + $12.00 output
    },
    {
        name: "Grok 4.1 Fast - 1M input, 1M output",
        modelId: "x-ai/grok-4-1-fast",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        expectedCost: 0.70, // $0.20 input + $0.50 output
    },
    {
        name: "Grok Code Fast 1 - 1M input, 1M output",
        modelId: "x-ai/grok-code-fast-1",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        expectedCost: 1.70, // $0.20 input + $1.50 output
    },
];

function main() {
    console.log("🔍 PRICING CONFIGURATION VERIFICATION\n");
    console.log("=".repeat(80));

    let totalErrors = 0;
    let totalWarnings = 0;

    // ========================================================================
    // 1. CHECK ALL MODELS HAVE PRICING
    // ========================================================================
    console.log("\n📋 1. CHECKING MODEL PRICING CONFIGURATION\n");

    const allModels = Object.values(AVAILABLE_MODELS);
    console.log(`Total models configured: ${allModels.length}\n`);

    allModels.forEach((model) => {
        const status = model.pricing ? "✅" : "❌";
        console.log(`${status} ${model.displayName} (${model.id})`);

        if (!model.pricing) {
            console.log(`   ⚠️  WARNING: Missing pricing configuration`);
            totalErrors++;
            return;
        }

        // Check required pricing fields
        if (!model.pricing.inputTokens || !model.pricing.outputTokens) {
            console.log(`   ❌ ERROR: Missing inputTokens or outputTokens`);
            totalErrors++;
        } else {
            console.log(`   📊 Input: $${model.pricing.inputTokens}/1M tokens`);
            console.log(`   📊 Output: $${model.pricing.outputTokens}/1M tokens`);
        }

        // Check optional pricing fields
        if (model.pricing.longContextThreshold) {
            console.log(`   📊 Long Context: >${(model.pricing.longContextThreshold / 1000).toFixed(0)}K tokens`);
            if (model.pricing.inputTokensLongContext && model.pricing.outputTokensLongContext) {
                console.log(`      Input: $${model.pricing.inputTokensLongContext}/1M`);
                console.log(`      Output: $${model.pricing.outputTokensLongContext}/1M`);
            } else {
                console.log(`   ⚠️  WARNING: Long context threshold set but no long context pricing`);
                totalWarnings++;
            }
        }

        if (model.pricing.cacheCreation || model.pricing.cacheRead) {
            console.log(`   💾 Prompt Caching: Available`);
            if (model.pricing.cacheCreation) {
                console.log(`      Creation: $${model.pricing.cacheCreation}/1M`);
            }
            if (model.pricing.cacheRead) {
                console.log(`      Read: $${model.pricing.cacheRead}/1M`);
            }
        }

        if (model.pricing.webSearch) {
            console.log(`   🔍 Web Search: $${model.pricing.webSearch}/1K requests`);
            if (model.pricing.webSearchFreePerDay) {
                console.log(`      Free: ${model.pricing.webSearchFreePerDay}/day`);
            }
        }

        if (model.pricing.images) {
            console.log(`   🖼️  Image Generation: $${model.pricing.images}/1K images`);
        }

        if (model.pricing.videoSeconds) {
            console.log(`   🎥 Video Generation: $${model.pricing.videoSeconds}/second`);
        }

        console.log("");
    });

    // ========================================================================
    // 2. TEST PRICING CALCULATOR FUNCTION
    // ========================================================================
    console.log("\n" + "=".repeat(80));
    console.log("\n💰 2. TESTING COST CALCULATION FUNCTION\n");

    TEST_CASES.forEach((testCase) => {
        console.log(`\n🧪 Test: ${testCase.name}`);
        console.log(`   Model: ${testCase.modelId}`);
        console.log(`   Input Tokens: ${testCase.inputTokens.toLocaleString()}`);
        console.log(`   Output Tokens: ${testCase.outputTokens.toLocaleString()}`);

        const calculatedCost = calculateAICost(
            testCase.modelId,
            testCase.inputTokens,
            testCase.outputTokens
        );

        const expectedCost = testCase.expectedCost;
        const difference = Math.abs(calculatedCost - expectedCost);
        const tolerance = 0.01; // $0.01 tolerance

        if (difference < tolerance) {
            console.log(`   ✅ PASS: $${calculatedCost.toFixed(4)} (expected $${expectedCost.toFixed(4)})`);
        } else {
            console.log(`   ❌ FAIL: $${calculatedCost.toFixed(4)} (expected $${expectedCost.toFixed(4)})`);
            console.log(`   ⚠️  Difference: $${difference.toFixed(4)}`);
            totalErrors++;
        }
    });

    // ========================================================================
    // 3. CHECK getModelPricing FUNCTION
    // ========================================================================
    console.log("\n" + "=".repeat(80));
    console.log("\n🔧 3. TESTING getModelPricing FUNCTION\n");

    const testModels = [
        "anthropic/claude-sonnet-4.5",
        "openai/gpt-5-mini",
        "google/gemini-2.5-flash",
        "x-ai/grok-4-1-fast",
    ];

    testModels.forEach((modelId) => {
        const pricing = getModelPricing(modelId);

        if (!pricing) {
            console.log(`❌ ${modelId}: getModelPricing returned null`);
            totalErrors++;
        } else {
            console.log(`✅ ${modelId}:`);
            console.log(`   Input: $${pricing.inputPrice}/1M`);
            console.log(`   Output: $${pricing.outputPrice}/1M`);

            // Verify against config
            const model = AVAILABLE_MODELS[modelId];
            if (model?.pricing) {
                if (pricing.inputPrice !== model.pricing.inputTokens) {
                    console.log(`   ❌ ERROR: Input price mismatch!`);
                    console.log(`      getModelPricing: $${pricing.inputPrice}`);
                    console.log(`      Config: $${model.pricing.inputTokens}`);
                    totalErrors++;
                }
                if (pricing.outputPrice !== model.pricing.outputTokens) {
                    console.log(`   ❌ ERROR: Output price mismatch!`);
                    console.log(`      getModelPricing: $${pricing.outputPrice}`);
                    console.log(`      Config: $${model.pricing.outputTokens}`);
                    totalErrors++;
                }
            }
        }
        console.log("");
    });

    // ========================================================================
    // 4. VERIFY MODEL USE CASES
    // ========================================================================
    console.log("\n" + "=".repeat(80));
    console.log("\n🎯 4. VERIFYING MODEL USE CASES\n");

    const useCaseGroups: Record<string, string[]> = {
        coding: [],
        orchestrator: [],
        memory: [],
        "image-generation": [],
        "video-generation": [],
    };

    allModels.forEach((model) => {
        if (!useCaseGroups[model.useCase]) {
            useCaseGroups[model.useCase] = [];
        }
        useCaseGroups[model.useCase].push(model.displayName);
    });

    console.log(`📝 Coding Models (${useCaseGroups.coding.length}):`);
    useCaseGroups.coding.forEach((name) => console.log(`   - ${name}`));

    console.log(`\n🎛️  Orchestrator Models (${useCaseGroups.orchestrator.length}):`);
    useCaseGroups.orchestrator.forEach((name) => console.log(`   - ${name}`));

    console.log(`\n🖼️  Image Generation Models (${useCaseGroups["image-generation"].length}):`);
    useCaseGroups["image-generation"].forEach((name) => console.log(`   - ${name}`));

    console.log(`\n🎥 Video Generation Models (${useCaseGroups["video-generation"].length}):`);
    useCaseGroups["video-generation"].forEach((name) => console.log(`   - ${name}`));

    // ========================================================================
    // 5. PRICING COMPARISON TABLE
    // ========================================================================
    console.log("\n" + "=".repeat(80));
    console.log("\n📊 5. PRICING COMPARISON (Cost per 1M tokens)\n");

    const codingModels = allModels.filter((m) => m.useCase === "coding");

    console.log("Model".padEnd(30) + "Input".padEnd(12) + "Output".padEnd(12) + "Total (1M/1M)");
    console.log("-".repeat(80));

    codingModels
        .sort((a, b) => {
            const aTotal = (a.pricing?.inputTokens || 0) + (a.pricing?.outputTokens || 0);
            const bTotal = (b.pricing?.inputTokens || 0) + (b.pricing?.outputTokens || 0);
            return aTotal - bTotal;
        })
        .forEach((model) => {
            if (model.pricing) {
                const input = `$${model.pricing.inputTokens.toFixed(2)}`;
                const output = `$${model.pricing.outputTokens.toFixed(2)}`;
                const total = `$${(model.pricing.inputTokens + model.pricing.outputTokens).toFixed(2)}`;

                console.log(
                    model.displayName.padEnd(30) +
                    input.padEnd(12) +
                    output.padEnd(12) +
                    total
                );
            }
        });

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n" + "=".repeat(80));
    console.log("\n📈 SUMMARY\n");

    console.log(`Total Models: ${allModels.length}`);
    console.log(`Models with Pricing: ${allModels.filter(m => m.pricing).length}`);
    console.log(`Errors: ${totalErrors}`);
    console.log(`Warnings: ${totalWarnings}`);

    if (totalErrors === 0 && totalWarnings === 0) {
        console.log("\n✅ ALL CHECKS PASSED - Pricing configuration is correct!\n");
    } else if (totalErrors === 0) {
        console.log(`\n⚠️  ${totalWarnings} warnings found (non-critical)\n`);
    } else {
        console.log(`\n❌ ${totalErrors} errors found - Please review and fix!\n`);
    }

    process.exit(totalErrors > 0 ? 1 : 0);
}

main();
