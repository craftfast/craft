# AI Project Naming Error Fix - October 9, 2025

## Issue

The project name generation feature was failing with the error:

```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This error indicated that the OpenRouter API was returning HTML (likely an error page) instead of JSON, which meant the API requests were not being properly formatted or authenticated.

## Root Cause

The AI SDK's `createOpenAI` function was not properly configured to send the required OpenRouter-specific headers (`HTTP-Referer` and `X-Title`) with each API request. These headers are required by OpenRouter for API tracking and attribution.

## Solution

Updated the OpenRouter client configuration to include a custom `fetch` function that adds the required headers to every API request:

```typescript
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
  fetch: async (url, options) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Craft - Vibe Coding Tool",
      },
    });
  },
});
```

## Additional Improvements

### Enhanced Error Handling

Added comprehensive error logging and graceful fallback behavior:

1. **Detailed Error Logging**: Now logs error messages, causes, and stack traces for debugging
2. **Dual Fallback System**:
   - First tries Grok model (x-ai/grok-2-1212)
   - Falls back to Claude (anthropic/claude-3.5-sonnet) if Grok fails
   - If both fail, keeps the original "New Project" name
3. **TypeScript Safety**: Proper type annotations using `unknown` instead of `any`

### Code Quality

- Added `maxRetries: 2` for better reliability
- Improved console logging for debugging
- Better error messages for troubleshooting

## Files Changed

- `src/app/api/projects/route.ts`

## Testing

After the fix:

1. Development server starts without errors
2. No TypeScript compilation errors
3. Proper error handling in place for API failures

## OpenRouter Requirements

For future reference, OpenRouter requires these headers:

- `HTTP-Referer`: Your site URL (for tracking)
- `X-Title`: Your app name (for display in OpenRouter dashboard)

These headers are now automatically included in all OpenRouter API requests.
