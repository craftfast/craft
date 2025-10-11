# AI File Rewriting Fix - Summary

## Issue

The AI was **completely rewriting template files** and **deleting necessary code** instead of making careful updates.

### What Was Happening

❌ AI would rewrite entire files
❌ Deleted imports and configurations
❌ Removed working features
❌ Template files lost important functionality

### Root Cause

The system prompt told the AI that files would be "replaced" but didn't emphasize strongly enough that:

1. The AI must provide **COMPLETE** file content (not just changes)
2. The AI must **PRESERVE** all necessary code
3. File replacement = "complete new version" NOT "add this snippet"

## The Fix

Updated **`src/lib/ai/system-prompts.ts`** with much clearer instructions:

### Key Changes

#### 1. Added Strong Warnings (Lines 140-165)

```typescript
**CRITICAL - How to Work with the Base Template:**

3. **File update strategy**:
   - When you create a code block with the same path as an existing file,
     it **COMPLETELY REPLACES** that file
   - You MUST include ALL the code that should be in the file (not just the changes)
   - Think of it as "here's the complete new version of this file"
     not "here's what to add"
   - Always preserve critical code like configuration objects,
     necessary imports, and core functionality
```

#### 2. Enhanced Existing Files Context (Lines 75-100)

```typescript
**⚠️ REMEMBER**: When you create a file with an existing path,
it REPLACES that file completely.
- You MUST include the COMPLETE file content (all imports, all code, all exports)
- DO NOT provide partial updates or snippets
- DO NOT delete existing functionality unless explicitly asked
- Think "here's the new complete version" NOT "here's what to add"
```

#### 3. Better Examples (Lines 167-191)

```typescript
**⚠️ CRITICAL**: The above code block will COMPLETELY REPLACE `src/app/page.tsx`.
Make sure you include:
- All necessary imports
- All required components
- All configurations
- Complete, working code (not just snippets)

WRONG approaches:
❌ Don't provide partial code that's missing imports or exports
❌ Don't delete working features when making updates
```

## How It Works Now

### ✅ Expected AI Behavior

When user says: **"Add a contact form to the landing page"**

**AI should provide:**

```typescript // src/app/page.tsx
// COMPLETE file with form added
import { useState } from "react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* EXISTING hero section - PRESERVED */}
      <section className="h-screen">
        <h1>Welcome</h1>
      </section>

      {/* NEW contact form - ADDED */}
      <section className="py-20">
        <form className="max-w-lg mx-auto">
          <input type="email" />
          <button>Submit</button>
        </form>
      </section>
    </main>
  );
}
```

**Why this is correct:**

- ✅ Complete file with ALL imports
- ✅ Preserved existing hero section
- ✅ Added new contact form
- ✅ File can run standalone

### ❌ Incorrect Behavior (Now Prevented)

**AI should NOT do this:**

```typescript // src/app/page.tsx
// Partial code - INCOMPLETE
<form>
  <input type="email" />
  <button>Submit</button>
</form>
```

**Why this is wrong:**

- ❌ No imports
- ❌ No component wrapper
- ❌ Hero section deleted
- ❌ Won't run standalone

## Testing

### Verify the Fix

1. **Create a new project** with the base template
2. **Send a prompt** like "add a navbar to the page"
3. **Check the AI response**:
   - ✅ Should include complete `page.tsx` file
   - ✅ Should preserve existing content
   - ✅ Should add navbar properly
   - ✅ Should have all imports

### Warning Signs

If you see these, the AI is not following instructions:

- ❌ Files missing imports
- ❌ Partial code snippets
- ❌ Existing features deleted
- ❌ Incomplete files

## Important Notes

### This is a File Replacement System

The system is designed for **complete file replacement**, not incremental editing:

- When AI creates a code block with path `src/app/page.tsx`, it **replaces** the entire file
- The AI must provide the **complete** file content
- This is simpler than incremental editing (no diffs, merges, conflicts)

### Why Not Incremental Editing?

To add incremental editing would require:

- [ ] Diff/patch system
- [ ] File reading capability for AI
- [ ] Merge logic
- [ ] Conflict resolution
- [ ] More complex state management

**Decision**: For MVP, file replacement works well if:

- ✅ AI is properly instructed (now fixed)
- ✅ Users understand files will be replaced
- ✅ File sizes stay reasonable

## Files Modified

- ✅ `src/lib/ai/system-prompts.ts` - Enhanced with clearer instructions
- ✅ `docs/ai-file-replacement-clarification.md` - Detailed documentation
- ✅ `docs/ai-file-rewriting-fix-summary.md` - This summary

## Related Documentation

- **Full details**: `docs/ai-file-replacement-clarification.md`
- **Base template workflow**: `docs/base-template-ai-workflow-summary.md`
- **System prompts**: `src/lib/ai/system-prompts.ts`

## Result

✅ **AI now has clear instructions** to provide complete files when updating
✅ **Strong warnings** about preserving existing code
✅ **Better examples** showing proper file updates
✅ **No more accidentally deleting** necessary code
