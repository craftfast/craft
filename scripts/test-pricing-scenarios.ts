/**
 * Real-world Pricing Scenario Tests
 * 
 * Tests common usage scenarios to verify pricing calculations
 */

import { calculateAICost } from "@/lib/pricing-constants";
import { AVAILABLE_MODELS } from "@/lib/models/config";

interface Scenario {
    name: string;
    modelId: string;
    description: string;
    inputTokens: number;
    outputTokens: number;
}

const SCENARIOS: Scenario[] = [
    // ========================================================================
    // SMALL CODE EDITS
    // ========================================================================
    {
        name: "Small code edit - Haiku",
        modelId: "anthropic/claude-haiku-4.5",
        description: "Quick bug fix or small component edit",
        inputTokens: 5_000,
        outputTokens: 1_000,
    },
    {
        name: "Small code edit - Sonnet",
        modelId: "anthropic/claude-sonnet-4.5",
        description: "Quick bug fix with default model",
        inputTokens: 5_000,
        outputTokens: 1_000,
    },
    {
        name: "Small code edit - GPT-5 Mini",
        modelId: "openai/gpt-5-mini",
        description: "Quick edit with OpenAI",
        inputTokens: 5_000,
        outputTokens: 1_000,
    },

    // ========================================================================
    // MEDIUM FEATURE DEVELOPMENT
    // ========================================================================
    {
        name: "Medium feature - Haiku",
        modelId: "anthropic/claude-haiku-4.5",
        description: "New component with tests",
        inputTokens: 50_000,
        outputTokens: 15_000,
    },
    {
        name: "Medium feature - Sonnet",
        modelId: "anthropic/claude-sonnet-4.5",
        description: "Complex component with default model",
        inputTokens: 50_000,
        outputTokens: 15_000,
    },
    {
        name: "Medium feature - Gemini Flash",
        modelId: "google/gemini-2.5-flash",
        description: "Feature with large context",
        inputTokens: 50_000,
        outputTokens: 15_000,
    },

    // ========================================================================
    // LARGE REFACTORING
    // ========================================================================
    {
        name: "Large refactor - Sonnet",
        modelId: "anthropic/claude-sonnet-4.5",
        description: "Major codebase restructure",
        inputTokens: 150_000,
        outputTokens: 50_000,
    },
    {
        name: "Large refactor - Gemini 3 Pro",
        modelId: "google/gemini-3-pro-preview",
        description: "Complex refactor with premium model",
        inputTokens: 150_000,
        outputTokens: 50_000,
    },
    {
        name: "Large refactor - GPT-5.1",
        modelId: "openai/gpt-5.1",
        description: "Multifile refactor",
        inputTokens: 150_000,
        outputTokens: 50_000,
    },

    // ========================================================================
    // FULL PROJECT GENERATION
    // ========================================================================
    {
        name: "Full project - Haiku (Budget)",
        modelId: "anthropic/claude-haiku-4.5",
        description: "Generate complete Next.js app (budget)",
        inputTokens: 100_000,
        outputTokens: 80_000,
    },
    {
        name: "Full project - Sonnet (Default)",
        modelId: "anthropic/claude-sonnet-4.5",
        description: "Generate complete Next.js app (default)",
        inputTokens: 100_000,
        outputTokens: 80_000,
    },
    {
        name: "Full project - Grok Code Fast",
        modelId: "x-ai/grok-code-fast-1",
        description: "Fast project generation",
        inputTokens: 100_000,
        outputTokens: 80_000,
    },

    // ========================================================================
    // LONG CONTEXT USAGE
    // ========================================================================
    {
        name: "Long context - Sonnet",
        modelId: "anthropic/claude-sonnet-4.5",
        description: "Large codebase analysis (>200K context)",
        inputTokens: 250_000, // Over long context threshold
        outputTokens: 50_000,
    },
    {
        name: "Long context - Gemini 3 Pro",
        modelId: "google/gemini-3-pro-preview",
        description: "Enterprise codebase review (>200K context)",
        inputTokens: 250_000,
        outputTokens: 50_000,
    },

    // ========================================================================
    // SYSTEM OPERATIONS
    // ========================================================================
    {
        name: "Project naming - Grok",
        modelId: "x-ai/grok-4-1-fast",
        description: "Generate project name",
        inputTokens: 500,
        outputTokens: 50,
    },
    {
        name: "Memory update - Grok",
        modelId: "x-ai/grok-4-1-fast",
        description: "Update project context",
        inputTokens: 10_000,
        outputTokens: 2_000,
    },
];

function formatCost(cost: number): string {
    if (cost < 0.001) {
        return `$${(cost * 1000).toFixed(4)}¢`;
    }
    return `$${cost.toFixed(4)}`;
}

function main() {
    console.log("💰 REAL-WORLD PRICING SCENARIOS\n");
    console.log("=".repeat(100));

    // Group scenarios by type
    const groups = {
        "Small Code Edits": SCENARIOS.filter(s => s.name.includes("Small")),
        "Medium Features": SCENARIOS.filter(s => s.name.includes("Medium")),
        "Large Refactoring": SCENARIOS.filter(s => s.name.includes("Large refactor")),
        "Full Project Generation": SCENARIOS.filter(s => s.name.includes("Full project")),
        "Long Context Usage": SCENARIOS.filter(s => s.name.includes("Long context")),
        "System Operations": SCENARIOS.filter(s => s.name.includes("Project naming") || s.name.includes("Memory")),
    };

    Object.entries(groups).forEach(([groupName, scenarios]) => {
        console.log(`\n\n🎯 ${groupName.toUpperCase()}\n`);
        console.log("-".repeat(100));

        scenarios.forEach((scenario) => {
            const cost = calculateAICost(
                scenario.modelId,
                scenario.inputTokens,
                scenario.outputTokens
            );

            const model = AVAILABLE_MODELS[scenario.modelId];
            const modelName = model?.displayName || scenario.modelId;

            console.log(`\n${scenario.name}`);
            console.log(`  Model: ${modelName}`);
            console.log(`  Description: ${scenario.description}`);
            console.log(`  Tokens: ${scenario.inputTokens.toLocaleString()} input + ${scenario.outputTokens.toLocaleString()} output`);
            console.log(`  💵 Cost: ${formatCost(cost)}`);
        });
    });

    // ========================================================================
    // COST COMPARISON TABLE
    // ========================================================================
    console.log("\n\n" + "=".repeat(100));
    console.log("\n📊 COST COMPARISON FOR COMMON TASKS\n");

    const comparisonTasks = [
        {
            name: "Small Edit (5K input, 1K output)",
            inputTokens: 5_000,
            outputTokens: 1_000,
        },
        {
            name: "Medium Feature (50K input, 15K output)",
            inputTokens: 50_000,
            outputTokens: 15_000,
        },
        {
            name: "Full Project (100K input, 80K output)",
            inputTokens: 100_000,
            outputTokens: 80_000,
        },
    ];

    const codingModels = Object.values(AVAILABLE_MODELS).filter(m => m.useCase === "coding");

    comparisonTasks.forEach((task) => {
        console.log(`\n${task.name}:`);
        console.log("-".repeat(100));

        const costs = codingModels.map((model) => ({
            name: model.displayName,
            cost: calculateAICost(model.id, task.inputTokens, task.outputTokens),
        })).sort((a, b) => a.cost - b.cost);

        costs.forEach((item, index) => {
            const indicator = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
            console.log(`  ${indicator} ${item.name.padEnd(30)} ${formatCost(item.cost).padStart(12)}`);
        });

        const cheapest = costs[0];
        const mostExpensive = costs[costs.length - 1];
        const savings = ((mostExpensive.cost - cheapest.cost) / mostExpensive.cost * 100).toFixed(1);

        console.log(`\n  💡 Savings: ${savings}% cheaper with ${cheapest.name} vs ${mostExpensive.name}`);
    });

    // ========================================================================
    // MONTHLY USAGE ESTIMATES
    // ========================================================================
    console.log("\n\n" + "=".repeat(100));
    console.log("\n📅 MONTHLY USAGE ESTIMATES\n");

    const usageProfiles = [
        {
            name: "Light User (Hobbyist)",
            description: "5 small edits + 2 medium features per week",
            weekly: [
                { inputTokens: 5_000, outputTokens: 1_000, count: 5 },
                { inputTokens: 50_000, outputTokens: 15_000, count: 2 },
            ],
        },
        {
            name: "Regular User (Freelancer)",
            description: "3 medium features + 1 large refactor + 1 full project per week",
            weekly: [
                { inputTokens: 50_000, outputTokens: 15_000, count: 3 },
                { inputTokens: 150_000, outputTokens: 50_000, count: 1 },
                { inputTokens: 100_000, outputTokens: 80_000, count: 1 },
            ],
        },
        {
            name: "Heavy User (Professional Dev)",
            description: "10 medium features + 3 large refactors + 2 full projects per week",
            weekly: [
                { inputTokens: 50_000, outputTokens: 15_000, count: 10 },
                { inputTokens: 150_000, outputTokens: 50_000, count: 3 },
                { inputTokens: 100_000, outputTokens: 80_000, count: 2 },
            ],
        },
    ];

    const testModels = [
        "anthropic/claude-haiku-4.5",
        "anthropic/claude-sonnet-4.5",
        "openai/gpt-5-mini",
        "google/gemini-2.5-flash",
        "x-ai/grok-code-fast-1",
    ];

    usageProfiles.forEach((profile) => {
        console.log(`\n${profile.name}`);
        console.log(`${profile.description}`);
        console.log("-".repeat(100));

        testModels.forEach((modelId) => {
            const model = AVAILABLE_MODELS[modelId];

            let weeklyCost = 0;
            profile.weekly.forEach((usage) => {
                const singleCost = calculateAICost(modelId, usage.inputTokens, usage.outputTokens);
                weeklyCost += singleCost * usage.count;
            });

            const monthlyCost = weeklyCost * 4.33; // Average weeks per month

            console.log(`  ${model?.displayName.padEnd(30)} ~$${monthlyCost.toFixed(2)}/month`);
        });
    });

    console.log("\n\n" + "=".repeat(100));
    console.log("\n✅ All pricing scenarios calculated successfully!\n");
}

main();
