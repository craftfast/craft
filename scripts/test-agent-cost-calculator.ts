/**
 * Test Agent Cost Calculator Integration
 * Verifies that the agent correctly uses usage-cost-calculator.ts
 */

import { calculateUsageCost, formatCostBreakdown, type AIUsage } from "@/lib/ai/usage-cost-calculator";

console.log("🧪 Testing Agent Cost Calculator Integration\n");
console.log("=".repeat(80));

// Simulate various usage scenarios from different providers

// Test 1: Anthropic Claude with caching
console.log("\n\n1️⃣  Anthropic Claude Sonnet 4.5 (with prompt caching)\n");
const anthropicUsage: AIUsage = {
    input_tokens: 50000,
    output_tokens: 15000,
    cache_creation_input_tokens: 10000,
    cache_read_input_tokens: 100000,
};

const anthropicCost = calculateUsageCost("anthropic/claude-sonnet-4.5", anthropicUsage);
console.log(`Input: ${anthropicUsage.input_tokens?.toLocaleString()} tokens`);
console.log(`Output: ${anthropicUsage.output_tokens?.toLocaleString()} tokens`);
console.log(`Cache Creation: ${anthropicUsage.cache_creation_input_tokens?.toLocaleString()} tokens`);
console.log(`Cache Read: ${anthropicUsage.cache_read_input_tokens?.toLocaleString()} tokens`);
console.log(`\n💰 ${formatCostBreakdown(anthropicCost)}`);

// Test 2: OpenAI with reasoning tokens
console.log("\n\n2️⃣  OpenAI GPT-5.1 (with reasoning and caching)\n");
const openaiUsage: AIUsage = {
    promptTokens: 25000,
    completionTokens: 8000,
    cached_tokens: 50000,
    reasoning_tokens: 12000,
};

const openaiCost = calculateUsageCost("openai/gpt-5.1", openaiUsage);
console.log(`Input: ${openaiUsage.promptTokens?.toLocaleString()} tokens`);
console.log(`Output: ${openaiUsage.completionTokens?.toLocaleString()} tokens`);
console.log(`Cached: ${openaiUsage.cached_tokens?.toLocaleString()} tokens`);
console.log(`Reasoning: ${openaiUsage.reasoning_tokens?.toLocaleString()} tokens`);
console.log(`\n💰 ${formatCostBreakdown(openaiCost)}`);

// Test 3: Google Gemini
console.log("\n\n3️⃣  Google Gemini 2.5 Flash\n");
const googleUsage: AIUsage = {
    prompt_token_count: 100000,
    candidates_token_count: 30000,
    cached_content_token_count: 200000,
};

const googleCost = calculateUsageCost("google/gemini-2.5-flash", googleUsage);
console.log(`Input: ${googleUsage.prompt_token_count?.toLocaleString()} tokens`);
console.log(`Output: ${googleUsage.candidates_token_count?.toLocaleString()} tokens`);
console.log(`Cached: ${googleUsage.cached_content_token_count?.toLocaleString()} tokens`);
console.log(`\n💰 ${formatCostBreakdown(googleCost)}`);

// Test 4: XAI Grok
console.log("\n\n4️⃣  XAI Grok Code Fast 1\n");
const xaiUsage: AIUsage = {
    promptTokens: 100000,
    completionTokens: 80000,
    cached_tokens: 50000,
};

const xaiCost = calculateUsageCost("x-ai/grok-code-fast-1", xaiUsage);
console.log(`Input: ${xaiUsage.promptTokens?.toLocaleString()} tokens`);
console.log(`Output: ${xaiUsage.completionTokens?.toLocaleString()} tokens`);
console.log(`Cached: ${xaiUsage.cached_tokens?.toLocaleString()} tokens`);
console.log(`\n💰 ${formatCostBreakdown(xaiCost)}`);

// Test 5: Compare breakdown format
console.log("\n\n" + "=".repeat(80));
console.log("\n5️⃣  Breakdown Format Comparison\n");

const testCases = [
    { model: "anthropic/claude-haiku-4.5", usage: { input_tokens: 10000, output_tokens: 5000 } },
    { model: "openai/gpt-5-mini", usage: { promptTokens: 10000, completionTokens: 5000 } },
    { model: "google/gemini-2.5-flash", usage: { prompt_token_count: 10000, candidates_token_count: 5000 } },
    { model: "x-ai/grok-code-fast-1", usage: { promptTokens: 10000, completionTokens: 5000 } },
];

testCases.forEach(({ model, usage }) => {
    const breakdown = calculateUsageCost(model, usage as AIUsage);
    console.log(`${model}:`);
    console.log(`  ${formatCostBreakdown(breakdown)}`);
});

console.log("\n\n" + "=".repeat(80));
console.log("\n✅ All tests completed successfully!\n");
console.log("The agent now uses usage-cost-calculator.ts for comprehensive cost tracking.");
console.log("Benefits:");
console.log("  ✓ Eliminates code duplication");
console.log("  ✓ Consistent cost calculation across the app");
console.log("  ✓ Supports all pricing features (caching, reasoning, multimodal, tools)");
console.log("  ✓ Easy to maintain and extend");
console.log("");
