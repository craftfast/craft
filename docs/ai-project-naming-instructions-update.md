# AI Project Name Generation - Enhanced Instructions

## Date: October 9, 2025

## Problem

The Grok model was generating code snippets instead of just project names, despite being asked to generate only a name. This was confusing and providing unwanted output.

## Solution

Enhanced the AI prompts and added post-processing validation to ensure ONLY project names are generated and returned.

## Changes Made

### 1. Simplified and Clarified System Prompt

**Before:**

```
You are a creative assistant that generates project names...
```

**After:**

```
You are a naming assistant. You ONLY generate short project names.

CRITICAL RULES:
1. Output MUST be 1-4 words ONLY
2. NO code of any kind
3. NO explanations
4. NO markdown
5. NO special characters except spaces and hyphens
6. NO line breaks
7. Just the name, nothing else

Examples of CORRECT outputs:
- "Task Manager Pro"
- "Weather Dashboard"
- "Chat Bot"
- "Portfolio Site"

Examples of WRONG outputs (DO NOT DO THIS):
- Any code snippets
- "Here's a name: Task Manager"
- Multiple suggestions
- Descriptions or explanations
```

### 2. Simplified User Prompt

**Before:**

```
The user wants to create a project with this description: "${description}"

Generate only a creative project name for this (no code, no explanation):
```

**After:**

```
User's project idea: ${description}

Project name (1-4 words only, no code):
```

### 3. Added Post-Processing Validation

Added robust filtering to catch and reject any code-like content:

````typescript
// Clean and validate the generated name
let rawName = result.text.trim();

// Remove any markdown, code blocks, or formatting
rawName = rawName
  .replace(/```[\s\S]*?```/g, "") // Remove code blocks
  .replace(/`[^`]*`/g, "") // Remove inline code
  .replace(/['"]/g, "") // Remove quotes
  .replace(/^\*+|\*+$/g, "") // Remove asterisks
  .replace(/^#+\s*/g, "") // Remove markdown headers
  .trim();

// Take only the first line if multiple lines
rawName = rawName.split("\n")[0].trim();

// If it looks like code (contains common code characters), reject it
if (
  rawName.includes("{") ||
  rawName.includes("}") ||
  rawName.includes("(") ||
  rawName.includes(")") ||
  rawName.includes(";") ||
  rawName.includes("=") ||
  rawName.includes("function") ||
  rawName.includes("const") ||
  rawName.includes("let") ||
  rawName.includes("var") ||
  rawName.length > 50
) {
  console.warn(`Generated name looks like code, rejecting: ${rawName}`);
  throw new Error("Generated name contains code-like content");
}
````

### 4. Reduced Temperature

Changed temperature from `0.8` to `0.7` for more focused, consistent outputs.

## How It Works

1. **System Prompt**: Sets clear, explicit rules with examples of what IS and ISN'T allowed
2. **User Prompt**: Simple, direct request for just the name
3. **Post-Processing**: Automatically strips out any formatting, markdown, or code
4. **Validation**: Rejects outputs that contain code-like characters
5. **Fallback**: If validation fails, triggers the Claude fallback with the same strict rules

## Benefits

- ✅ **No more code generation** - Strict rules prevent code snippets
- ✅ **Clean output** - Automatic removal of markdown and formatting
- ✅ **Validation** - Catches and rejects code-like content
- ✅ **Consistent format** - Always returns 1-4 word names
- ✅ **Better reliability** - Clearer instructions lead to better AI adherence
- ✅ **Dual protection** - Both Grok and Claude fallback use the same strict rules

## Example Outputs

### Good Examples (What We Want)

- "Task Manager Pro"
- "Weather Dashboard"
- "Portfolio Builder"
- "Chat System"

### Bad Examples (What Gets Rejected)

- Code snippets with { } or ( )
- Multi-line explanations
- Names longer than 50 characters
- Names with semicolons, equals signs, etc.

## Files Modified

- `src/app/api/projects/route.ts`

## Testing Recommendations

Test with various project descriptions to ensure:

1. Names are concise (1-4 words)
2. No code is generated
3. No explanations or formatting
4. Validation catches problematic outputs
5. Fallback works if primary model fails
