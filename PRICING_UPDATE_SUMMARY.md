# AI Model Pricing Update - November 2025

## Summary

Updated all model pricing configurations with accurate data from official provider documentation. Added comprehensive cost calculation system supporting all pricing types including caching, reasoning tokens, multimodal inputs, and server-side tools.

## Updated Pricing (All values per 1M tokens unless noted)

### Anthropic (Claude)

#### Claude Haiku 4.5

- **Input**: $1.00
- **Output**: $5.00
- **Cache Creation** (5-min): $1.25 (1.25x base)
- **Cache Creation** (1-hour): $2.00 (2x base)
- **Cache Read**: $0.10 (90% discount)
- **Context Window**: 200K tokens
- **Batch API**: 50% discount ($0.50 input, $2.50 output)

#### Claude Sonnet 4.5 (Default)

- **Input**: $3.00 (≤200K tokens)
- **Output**: $15.00 (≤200K tokens)
- **Long Context** (>200K): $6.00 input, $22.50 output
- **Cache Creation** (5-min): $3.75 (1.25x base)
- **Cache Creation** (1-hour): $6.00 (2x base)
- **Cache Read**: $0.30 (90% discount)
- **Context Window**: 1M tokens (beta), 200K standard
- **Batch API**: 50% discount ($1.50 input, $7.50 output)

### OpenAI (GPT)

#### GPT-5 Mini (CORRECTED NAME)

- **Input**: $0.25
- **Output**: $2.00
- **Cache Creation**: $0.3125 (1.25x base)
- **Cache Read**: $0.025 (90% discount)
- **Context Window**: 400K tokens
- **Web Search**: $10 per 1,000 searches (separate charge)

#### GPT-5.1

- **Input**: $1.25
- **Output**: $10.00
- **Cache Creation**: $1.5625 (1.25x base)
- **Cache Read**: $0.125 (90% discount)
- **Context Window**: 400K tokens
- **Web Search**: $10 per 1,000 searches (separate charge)

### Google (Gemini)

#### Gemini 2.5 Flash

- **Input**: $0.30 (text/image/video)
- **Output**: $2.50 (includes thinking tokens)
- **Audio Input**: $1.00 (separate pricing)
- **Cache Read**: $0.03 (90% discount)
- **Cache Storage**: $1.00/1M tokens/hour
- **Context Window**: 1,048,576 tokens (1M)
- **Web Search**: $35 per 1,000 grounded prompts (1,500 RPD free)
- **Maps Grounding**: $25 per 1,000 grounded prompts (1,500 RPD free)
- **Batch API**: 50% discount available
- **Video Tokenization**: 263 tokens/second
- **Audio Tokenization**: 32 tokens/second

#### Gemini 3 Pro Preview

- **Input**: $2.00 (≤200K tokens)
- **Output**: $12.00 (≤200K tokens, includes thinking)
- **Large Prompts** (>200K): $4.00 input, $18.00 output
- **Cache Read**: $0.20 (90% discount)
- **Cache Storage**: $4.50/1M tokens/hour
- **Context Window**: 1,048,576 tokens (1M)
- **Web Search**: $14 per 1,000 search queries (1,500 RPD free)
- **Batch API**: 50% discount available
- **Paid tier only** (not available on free tier)

#### Gemini 2.5 Flash Image (Nano Banana 🍌)

- **Input**: $0.30 (text/image)
- **Output**: $30.00 per 1M tokens (or $0.039 per image)
- **Context Window**: 32,768 tokens
- **Image Size**: Up to 1024x1024px = 1290 tokens
- **Batch API**: 50% discount available
- **Paid tier only**

### xAI (Grok)

#### Grok 4.1 Fast (System Model)

- **Input**: $0.20
- **Output**: $1.50
- **Cached Prompt Tokens**: $0.02 (90% discount, automatic)
- **Context Window**: 2,000,000 tokens (2M)
- **Web Search**: Via server-side tools ($5 per 1,000)
- **Code Execution**: $5 per 1,000 executions

#### Grok Code Fast 1

- **Input**: $0.20
- **Output**: $1.50
- **Cached Prompt Tokens**: $0.02 (90% discount, automatic)
- **Context Window**: 256,000 tokens
- **Server-side Tools**:
  - Web Search: $5 per 1,000
  - X Search: $5 per 1,000
  - Code Execution: $5 per 1,000
  - Document Search: $5 per 1,000
  - Collections Search: $2.50 per 1,000

## Key Changes

### Model Name Corrections

- ❌ **OLD**: `openai/gpt-5.1-mini` → ✅ **NEW**: `openai/gpt-5-mini`
- ✅ Corrected display name: "GPT-5 Mini" (not "GPT-5.1 Mini")
- ✅ Updated all references in code, docs, and schema

### Context Window Updates

- **Claude Sonnet 4.5**: 200K → 1M (beta)
- **OpenAI Models**: 128K → 400K
- **Gemini Models**: Confirmed 1,048,576 tokens (1M)
- **Grok 4.1 Fast**: Confirmed 2M tokens

### New Pricing Features Captured

#### Anthropic

- 5-minute cache (default): 1.25x base input
- 1-hour cache: 2x base input
- Cache reads: 0.1x base input (90% discount)
- Long context premium (>200K tokens)
- Batch API 50% discount
- Web search tool: $10 per 1,000 searches

#### OpenAI

- Prompt caching support
- Reasoning tokens (charged at output rate)
- Audio tokens support
- Web search: $10 per 1,000 searches

#### Google

- Separate audio input pricing ($1.00 vs $0.30 text)
- Video/audio tokenization rates
- Context caching with storage costs
- Web search grounding: $35 per 1,000 (with 1,500 RPD free)
- Maps grounding: $25 per 1,000 (with 1,500 RPD free)
- Batch API 50% discount
- Long context pricing tiers

#### xAI

- Automatic prompt caching (90% discount)
- Server-side tool pricing per 1,000 uses
- Collections search ($2.50 per 1,000)

## New Files Created

### `src/lib/ai/usage-cost-calculator.ts`

Comprehensive cost calculation system supporting:

- **All providers**: Anthropic, OpenAI, Google, xAI
- **All token types**: Input, output, cached, reasoning, audio, video, image
- **Caching options**: 5-minute, 1-hour, automatic
- **Modifiers**: Batch API discounts, long context premiums
- **Server-side tools**: Web search, code execution, etc.
- **Image generation**: Per-image and per-token pricing

Key functions:

- `calculateUsageCost()`: Main calculation with detailed breakdown
- `estimateCost()`: Pre-request cost estimation
- `formatCostBreakdown()`: Human-readable cost display

## Files Updated

### Core Configuration

- ✅ `src/lib/models/config.ts` - All model pricing updated
- ✅ `src/lib/ai/usage-cost-calculator.ts` - New cost calculator

### Database Schema

- ✅ `prisma/schema.prisma` - Updated default enabled models
  - Removed: `minimax/minimax-m2`
  - Added: `x-ai/grok-code-fast-1`
  - Fixed: `openai/gpt-5.1-mini` → `openai/gpt-5-mini`

### Documentation

- ✅ `docs/direct-providers-quick-ref.md` - Updated model names and pricing

## Migration Notes

### Database Migration Required

```bash
# Update existing user preferences
# Old model IDs will still work but should be migrated
pnpm prisma migrate dev --name update_enabled_models_default
```

### User Impact

- Existing user preferences with old model IDs will continue to work
- New users will get updated default model list
- No breaking changes to API or functionality

## Pricing Accuracy

All pricing sourced from official documentation (accessed November 20, 2025):

- ✅ **Anthropic**: https://platform.claude.com/docs/en/about-claude/pricing
- ✅ **OpenAI**: https://platform.openai.com/docs/pricing
- ✅ **Google**: https://ai.google.dev/gemini-api/docs/pricing
- ✅ **xAI**: https://docs.x.ai/docs/models

## Testing Recommendations

1. **Cost Calculation Tests**

   - Test all providers with sample usage objects
   - Verify caching discounts apply correctly
   - Test batch mode and long context modifiers

2. **Model Selection Tests**

   - Verify model IDs resolve correctly
   - Test fallback to default model
   - Check enabled models filtering

3. **Database Migration Tests**
   - Test with existing user data
   - Verify default values for new users
   - Check model preference updates

## Next Steps

1. Run Prisma migration to update schema
2. Test cost calculation with live API responses
3. Update any UI displaying pricing information
4. Consider adding pricing display in model selector
5. Monitor actual costs vs. calculated costs for accuracy
