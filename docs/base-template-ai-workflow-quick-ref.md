# Base Template AI Workflow - Quick Reference

## TL;DR

The AI now **sees** and **updates** the base template files that are saved to the database when a project is created, instead of generating everything from scratch each time.

## What Changed

### Before

```
User: "Create a landing page"

AI: (Generates everything from scratch)
- ❌ Creates new package.json
- ❌ Creates new tsconfig.json
- ❌ Creates new page.tsx
- ❌ Creates new layout.tsx
- ❌ No awareness of existing files
```

### After

```
User: "Create a landing page"

AI: (Sees existing files, makes targeted updates)
- ✅ Knows package.json exists (doesn't recreate)
- ✅ Knows layout.tsx exists (doesn't recreate)
- ✅ Updates page.tsx (replaces existing)
- ✅ Creates only what's needed
```

## How It Works

```
Project Created
    ↓
Base Template Saved (8 files)
    ↓
User Opens Project
    ↓
Files Loaded into State
    ↓
User Sends Message
    ↓
Files Sent to AI with Message
    ↓
AI Sees File List
    ↓
AI Updates/Creates Files
    ↓
Files Saved Back to Database
    ↓
Preview Updates
```

## AI Prompt Change

**AI now sees this context:**

````
## Current Project Files (8 files loaded)

The project ALREADY HAS these files saved:

- `next.config.ts`
- `package.json`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `tailwind.config.ts`
- `tsconfig.json`
- ...

**To UPDATE an existing file:**
```typescript // src/app/page.tsx
// Same path = replace file
````

**To CREATE a new file:**

```typescript // src/components/NewComponent.tsx
// New path = create file
```

````

## Code Changes

### 1. ChatPanel Props
```typescript
interface ChatPanelProps {
  projectFiles?: Record<string, string>; // ← NEW
}

// Usage
<ChatPanel
  projectFiles={projectFiles} // ← Pass files
  ...
/>
````

### 2. Chat API Call

```typescript
fetch("/api/chat", {
  body: JSON.stringify({
    messages,
    taskType: "coding",
    projectFiles, // ← Send files
  }),
});
```

### 3. System Prompt Function

```typescript
export function getCodingSystemPrompt(
  projectFiles?: Record<string, string> // ← Accept files
) {
  // Build file list context
  const fileList = Object.keys(projectFiles).sort();
  // Include in prompt
}
```

### 4. Chat API Handler

```typescript
const { messages, taskType, projectFiles } = await req.json();

const systemPrompt = getSystemPrompt(taskType, projectFiles); // ← Pass files

console.log(`📁 Context: ${Object.keys(projectFiles).length} files`);
```

## Example Scenarios

### Scenario 1: First Message (New Project)

**Files:** 8 base template files

**User:** "Create a hero section"

**AI:**

- Sees `src/app/page.tsx` exists
- Updates it (doesn't create new)
- Doesn't recreate package.json or configs

**Result:** 1 file updated ✅

### Scenario 2: Adding Component

**Files:** 8 base + 2 custom files

**User:** "Add a navbar component"

**AI:**

- Sees existing files
- Creates `src/components/Navbar.tsx` (new)
- Updates `src/app/layout.tsx` (existing)

**Result:** 1 new, 1 updated ✅

### Scenario 3: Adding Dependencies

**Files:** 10 files

**User:** "Add animations with Framer Motion"

**AI:**

- Sees `package.json` exists
- Updates it with new dependency
- Creates component using framer-motion

**Result:** 1 updated, 1 new ✅

## Benefits

✅ **Faster** - AI focuses on what to change, not recreating everything
✅ **Smarter** - AI knows project structure
✅ **Cleaner** - Surgical updates instead of full regeneration
✅ **Consistent** - Base template preserved across updates
✅ **Efficient** - Less token usage

## Files Modified

```
src/lib/ai/system-prompts.ts          - Added file context to prompt
src/app/api/chat/route.ts              - Accepts and uses projectFiles
src/components/coding-interface/
  └── ChatPanel.tsx                    - Sends projectFiles to API
src/components/CodingInterface.tsx     - Passes files to ChatPanel
```

## Testing Checklist

- [ ] Create new project
- [ ] Verify base template saved (8 files)
- [ ] Send first message
- [ ] Check AI updates page.tsx (doesn't recreate package.json)
- [ ] Add component
- [ ] Verify AI creates new file + updates existing
- [ ] Check console for "Context: X existing files" log

## Debugging

**Check if files are being sent:**

```javascript
// In browser console during chat:
// Should see: "📁 Context: 8 existing project files"
```

**Check AI response:**

````typescript
// AI should update existing files:
```typescript // src/app/page.tsx  ← Existing path
...
````

// Not create duplicates:
❌ ```typescript // src/pages/home.tsx ← Wrong (new path)

```

## Related Docs

- Full implementation: `docs/base-template-ai-workflow.md`
- Template source: `src/lib/templates/nextjs.ts`
- Preview fix: `docs/preview-auto-load-fix.md`
```
