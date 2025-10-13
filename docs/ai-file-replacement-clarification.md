# AI File Replacement Clarification

## Issue Identified

The AI was **completely rewriting files** and deleting necessary code because the system prompts weren't clear enough about the file replacement behavior.

### The Problem

**Symptoms:**

- AI rewrites entire files instead of making surgical updates
- Necessary code gets deleted (imports, configurations, etc.)
- Template files lose important functionality
- User's existing code gets overwritten

**Root Cause:**
The system prompt said files would be "replaced" but didn't emphasize enough that:

1. The AI must provide **COMPLETE** file content (not just changes)
2. The AI must preserve **ALL** necessary code (imports, exports, configs)
3. File replacement means "here's the complete new version" not "here's what to add"

## The Solution

Updated `src/lib/ai/system-prompts.ts` to be **much more explicit** about file replacement:

### Changes Made

#### 1. Enhanced Base Template Instructions (Lines 140-162)

**Before:**

```typescript
3. **File replacement strategy**:
   - When you create a file with the same path as an existing file, it will be **replaced**
   - This is how you UPDATE the base template files (like page.tsx)
```

**After:**

```typescript
3. **File update strategy**:
   - When you create a code block with the same path as an existing file, it **COMPLETELY REPLACES** that file
   - You MUST include ALL the code that should be in the file (not just the changes)
   - Think of it as "here's the complete new version of this file" not "here's what to add"
   - Always preserve critical code like configuration objects, necessary imports, and core functionality
```

**Added warnings:**

- ⚠️ **IMPORTANT**: When updating a file, include ALL necessary code (imports, exports, configurations)
- ⚠️ **DO NOT DELETE** essential configurations, imports, or working features

#### 2. Updated Existing Files Context (Lines 82-99)

**Enhanced the instructions when AI receives existing project files:**

```typescript
**⚠️ REMEMBER**: When you create a file with an existing path, it REPLACES that file completely.
- You MUST include the COMPLETE file content (all imports, all code, all exports)
- DO NOT provide partial updates or snippets
- DO NOT delete existing functionality unless explicitly asked
- Think "here's the new complete version" NOT "here's what to add"
```

#### 3. Improved Example Section (Lines 164-191)

**Added critical warnings in the example:**

```typescript
**⚠️ CRITICAL**: The above code block will COMPLETELY REPLACE `src/app/page.tsx`. Make sure you include:
- All necessary imports
- All required components
- All configurations
- Complete, working code (not just snippets)

WRONG approaches:
❌ Don't provide partial code that's missing imports or exports
❌ Don't delete working features when making updates
```

## How It Works Now

### File Replacement Behavior

When the AI creates a code block like this:

```typescript // src/app/page.tsx
export default function Home() {
  return <div>Hello</div>;
}
```

The system will:

1. ✅ **Replace** the entire contents of `src/app/page.tsx`
2. ✅ Save the **complete** new file content to the database
3. ✅ Deploy the **full** file to the E2B sandbox

**This is by design** - it's a file replacement system, not an incremental editing system.

### What the AI Should Do

#### ✅ Correct Behavior

When updating `page.tsx` to add a hero section:

```typescript // src/app/page.tsx
// COMPLETE file with ALL necessary code
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero section */}
      <section className="h-screen flex items-center justify-center">
        <h1 className="text-6xl font-bold">Welcome</h1>
      </section>

      {/* Other sections */}
      <section className="py-20">{/* ... */}</section>
    </main>
  );
}
```

**Why this is correct:**

- ✅ Includes all imports needed
- ✅ Complete component with all sections
- ✅ Proper exports
- ✅ Can run as a standalone file

#### ❌ Incorrect Behavior

**DON'T do this - partial updates:**

```typescript // src/app/page.tsx
// Just adding a hero section (INCOMPLETE)
<section className="h-screen">
  <h1>Welcome</h1>
</section>
```

**Why this is wrong:**

- ❌ No imports
- ❌ No component wrapper
- ❌ No export
- ❌ Missing other content
- ❌ Won't run standalone

## Why We Don't Have Incremental Editing

### Current Architecture

The system is designed for **complete file replacement** because:

1. **Simplicity** - Easy to understand and implement
2. **Database storage** - Files are stored as complete JSON objects
3. **E2B deployment** - Sandbox receives complete files
4. **No diff tracking** - Don't track changes, just versions

### To Add Incremental Editing Would Require

1. **Diff/patch system** - Track changes, not full content
2. **File reading** - AI needs to read current file content
3. **Merge logic** - Combine existing + new code
4. **Conflict resolution** - Handle overlapping changes
5. **Undo/redo** - More complex state management

**Decision**: For MVP, complete file replacement is simpler and works well if:

- AI is **properly instructed** to provide complete files
- Users understand files will be **fully replaced**
- File sizes stay **reasonable** (not huge files)

## Testing the Fix

### Before Fix

**User:** "Add a contact form to the landing page"

**AI might do:**

```typescript // src/app/page.tsx
// Incomplete - just the form
<form>
  <input type="email" />
  <button>Submit</button>
</form>
```

**Result:** ❌ File broken, no imports, no component, hero section deleted

### After Fix

**User:** "Add a contact form to the landing page"

**AI should do:**

```typescript // src/app/page.tsx
// COMPLETE file with form added
export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Existing hero section - PRESERVED */}
      <section className="h-screen">
        <h1>Welcome</h1>
      </section>

      {/* New contact form - ADDED */}
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

**Result:** ✅ Complete file, all sections preserved, form added

## Monitoring AI Behavior

### Signs AI Is Following Instructions

✅ Files have all necessary imports
✅ Files have proper exports
✅ Existing features are preserved
✅ Files can run standalone
✅ No missing dependencies

### Signs AI Is Not Following Instructions

❌ Partial code snippets without imports
❌ Missing exports or component wrappers
❌ Existing features deleted unnecessarily
❌ Incomplete files that can't run
❌ Breaking changes without being asked

## Future Improvements

### Short Term

- [ ] Add examples in docs showing complete file updates
- [ ] Test with complex multi-section pages
- [ ] Monitor for files being broken by updates

### Medium Term

- [ ] Add file diff preview in chat
- [ ] Show what changed between versions
- [ ] Warn user before major file changes

### Long Term

- [ ] Implement incremental editing system
- [ ] Add file reading capability for AI
- [ ] Smart merge/conflict resolution
- [ ] Undo/redo for file changes

## Related Documentation

- **Base Template Workflow**: `docs/base-template-ai-workflow-summary.md`
- **System Prompts**: `src/lib/ai/system-prompts.ts`
- **Template Service**: `src/lib/templates/nextjs.ts`
- **File API**: `src/app/api/files/route.ts`

## Summary

**The Fix:**

- ✅ Made system prompts **extremely clear** about file replacement
- ✅ Added multiple warnings about providing **complete files**
- ✅ Emphasized preserving existing code
- ✅ Better examples showing **full file content**

**Expected Behavior:**

- AI provides **complete** files when updating
- AI **preserves** existing functionality
- AI includes **all** necessary code (imports, exports, etc.)
- Files can **run standalone** after update

**This is a prompt engineering fix**, not a system architecture change. The file replacement system remains the same, but the AI is now properly instructed on how to use it.
