# Preview Auto-Start Optimization

## Overview

Simplified the preview auto-start logic to be more efficient and handle edge cases better. The new approach is cleaner, more predictable, and easier to maintain.

**Key Insight:** All projects in Craft start with Next.js template files (~10-15 files), so we can't use "file count" to determine if a project is new. Instead, we track if AI has **ever completed a generation** in this session.

## Previous Implementation Issues

The previous implementation had **3 separate useEffects** managing:

1. Auto-start on mount with complex conditions
2. Auto-refresh when files change
3. Update after AI generation completes

This created:

- **Redundant logic** across multiple effects
- **Race conditions** between effects
- **Unnecessary complexity** with multiple timers
- **Confusing behavior** for new projects
- **Hard to debug** state transitions
- **Wrong assumption**: Tried to detect "new" projects by file count (but all projects start with template files!)

## New Simplified Approach

### Single Source of Truth

**One useEffect** handles both auto-start and auto-update based on AI generation completion:

```typescript
useEffect(() => {
  if (!isGeneratingFiles && Object.keys(projectFiles).length > 0) {
    // Auto-start ONLY on the first AI generation completion
    if (sandboxStatus === "inactive" && !hasCompletedFirstGeneration) {
      startSandbox();
      setHasCompletedFirstGeneration(true);
    } else if (sandboxStatus === "running") {
      // Preview already running - just update
      updateSandboxFiles();
    }
  }
}, [isGeneratingFiles, projectFiles, sandboxStatus]);
```

### Clear State Management

- **`hasCompletedFirstGeneration`** flag tracks if AI has ever completed generating in this session
  - `false`: Initial state - preview will auto-start when AI first completes
  - `true`: AI has generated - subsequent updates refresh (don't restart)
- No complex "new project" detection needed
- Works for both:
  - Brand new projects (template files → AI modified files)
  - Existing projects reopened (user starts chatting → AI generates → auto-start)

### Edge Cases Handled

1. **New Projects**: Auto-starts after first AI generation (modifies template)
2. **Reopened Projects**: Auto-starts when user first chats with AI
3. **Subsequent Updates**: Updates existing preview (no restart)
4. **Manual Start**: User can manually start anytime
5. **Existing Sandbox**: Detects and uses running sandbox on mount
6. **Generation In Progress**: Waits for completion before action
7. **Component Remount**: State resets, but sandbox detection handles it

## Behavior Flow

```
New Project Created (with Next.js template files)
└─> hasCompletedFirstGeneration = false
    └─> Preview Panel: "Start chatting to generate your project"
        └─> User sends prompt to AI
            └─> AI starts modifying template
                └─> Preview Panel: "AI is generating your code..."
                    └─> AI completes generation
                        └─> Preview Panel: Auto-starts sandbox (800ms delay) ✅
                            └─> hasCompletedFirstGeneration = true
                            └─> Preview shows live Next.js app
                                └─> User requests changes
                                    └─> AI updates files
                                        └─> Preview auto-refreshes (500ms delay) ✅

Existing Project Reopened
└─> hasCompletedFirstGeneration = false (resets on mount)
    └─> Check for existing sandbox
        ├─> Sandbox Running → Use it + set hasCompletedFirstGeneration = true
        └─> No Sandbox → Wait for user to chat
            └─> User sends prompt to AI
                └─> AI generates changes
                    └─> Preview auto-starts (first generation) ✅
                        └─> hasCompletedFirstGeneration = true
```

## Why Template Files Matter

### The Reality

Every project created in Craft includes:

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- And more... (~10-15 files total)

These are created **before** the user even starts chatting with AI.

### The Solution

**We can't use file count to detect "new" projects.**

Instead, we use:

- **First generation flag**: Has AI completed modifying files in this session?
- **Sandbox detection**: Is a preview already running?

This means:

- ✅ Works for brand new projects (template → AI modifies → auto-start)
- ✅ Works for reopened projects (existing files → user chats → auto-start)
- ✅ Works for active projects (sandbox detected → reuse, mark as generated)
- ✅ Simple, predictable, no edge cases

## Benefits

✅ **Simpler Logic**: 1 effect instead of 3
✅ **Better UX**: Clear states and messaging
✅ **Fewer Bugs**: No race conditions or duplicate starts
✅ **Optimized**: Minimal unnecessary operations
✅ **Maintainable**: Easy to understand and modify
✅ **Predictable**: Consistent behavior across scenarios
✅ **Template-Aware**: Correctly handles pre-populated projects

## UI States

### 1. Initial State (Template Files, No AI Interaction)

- Icon: Eye (neutral)
- Message: "Ready to preview"
- Submessage: "Start chatting to generate your project"

### 2. AI Generating (First Time or Update)

- Icon: Code (pulsing)
- Message: "AI is generating your code..."
- Submessage: "Preview will start automatically when complete"
- Animation: 3 bouncing dots

### 3. Loading Preview

- Icon: Refresh (spinning)
- Message: Dynamic (e.g., "Setting up Next.js...")
- Submessage: "Setting up Next.js (this may take 20-30 seconds)..."

### 4. Preview Running

- Shows iframe with live preview
- Device selector (mobile/tablet/desktop)
- Refresh button available

### 5. Error State

- Icon: Alert (red)
- Message: "Preview Failed"
- Error details displayed
- "Try Again" button

## Code Removed

Eliminated ~100 lines of complex logic:

- ❌ Auto-start timer with complex conditions
- ❌ Separate auto-refresh effect
- ❌ Duplicate file update effect
- ❌ "New project" detection via file count
- ❌ Multiple conditional branches
- ❌ Redundant logging

## Files Modified

- `src/components/coding-interface/PreviewPanel.tsx`
  - Simplified useEffects (3 → 1 for auto-start/update)
  - Added `hasCompletedFirstGeneration` state
  - Removed `isNewProject` detection (not needed with templates)
  - Unified inactive state UI
  - Clearer logging messages

## Testing Checklist

- [x] New project auto-starts after first AI generation
- [x] Subsequent AI updates refresh preview (not restart)
- [x] Manual start button works anytime
- [x] Existing sandbox detected on mount
- [x] Template files don't trigger unwanted auto-start
- [x] Clean unmount/cleanup
- [x] Proper error handling
- [x] Clear UI states for all scenarios

## Future Improvements

Potential enhancements:

- Add progress indicator during sandbox creation
- Show file count during generation
- Add "Skip Auto-Start" preference
- Expose manual refresh control prominently
- Add retry logic for failed starts
- Consider persisting `hasCompletedFirstGeneration` to prevent auto-start on page refresh
