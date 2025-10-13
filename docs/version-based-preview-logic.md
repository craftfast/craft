# Version-Based Preview Auto-Start

## Summary

Updated preview logic to only auto-start when project has AI-generated code (version > 0), preventing sandbox startup for template-only projects.

## Changes Made

### 1. PreviewPanel Interface

Added `version` prop:

```typescript
interface PreviewPanelProps {
  version?: number; // Project version (0 = template, 1+ = has AI updates)
}
```

### 2. Auto-Start Logic

Updated to check version:

```typescript
if (
  !isGeneratingFiles &&
  generationStatus === "ready" &&
  version > 0 && // NEW: Must have AI updates
  Object.keys(projectFiles).length > 0 &&
  sandboxStatus === "inactive"
) {
  console.log(
    `🚀 AI finished generating (version: ${version}) - auto-starting preview...`
  );
  setTimeout(() => startSandbox(), 800);
}
```

### 3. User Messages

Different messages based on version:

**Version 0 (Template only):**

- Title: "No code generated yet"
- Message: "Start chatting to generate your project"

**Version 1+ (Has AI updates):**

- Title: "Ready to preview"
- Message: "Click 'Start Preview' to view your project"

**Generating:**

- Title: "AI is generating your code..."
- Message: "Preview will start automatically when complete"

### 4. CodingInterface

Pass version to PreviewPanel:

```typescript
<PreviewPanel
  projectId={project.id}
  projectFiles={projectFiles}
  isGeneratingFiles={isGeneratingFiles}
  generationStatus={project.generationStatus}
  version={project.version} // NEW
/>
```

## Flow

### New Project (v0)

```
1. User creates project
   → version = 0, status = "template"
   → Preview shows: "No code generated yet"
   → NO auto-start

2. User sends first message
   → status = "generating"
   → Preview shows: "AI is generating your code..."

3. AI generates code
   → version increments to 1
   → status = "ready"
   → Preview AUTO-STARTS 🚀
```

### Subsequent Updates (v1+)

```
1. User sends message
   → status = "generating"

2. AI updates code
   → version increments (1 → 2 → 3...)
   → status = "ready"
   → Preview AUTO-REFRESHES (if running)
   → or AUTO-STARTS (if not running)
```

## Benefits

✅ **No wasted resources** - Sandbox only starts when there's actual code to preview
✅ **Clear user feedback** - Different messages for template vs. ready states
✅ **Version tracking** - Logs show version number for debugging
✅ **Billing accuracy** - Only count versions with actual AI updates
✅ **Better UX** - Users see "No code generated yet" instead of premature preview attempts

## Testing Checklist

- [ ] Create new project → Shows "No code generated yet" (v0)
- [ ] Send first message → Shows "AI is generating..." (v0, status=generating)
- [ ] AI completes → Preview auto-starts (v1, status=ready)
- [ ] Send second message → Preview auto-refreshes (v2, status=ready)
- [ ] Close/reopen project with v1+ → Can manually start preview
- [ ] Close/reopen project with v0 → Shows "No code generated yet"
