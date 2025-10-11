# Generation Tracking Implementation

## Problem

The sandbox was trying to start immediately when a project was created, even though it only had template files. This caused unnecessary E2B sandbox initialization before the AI had actually generated any custom code.

## Solution

Added generation tracking to the Project model to know when the AI has actually generated code vs when a project just has template files.

## Database Changes

### New Fields in `Project` Model

```prisma
model Project {
  // ... existing fields ...
  generationStatus    String        @default("template") // "template" | "generating" | "ready"
  lastGeneratedAt     DateTime?     // When AI last generated/updated code
  aiGenerationCount   Int           @default(0) // How many times AI has generated code
}
```

### Field Meanings

1. **`generationStatus`**: Tracks the state of AI code generation

   - `"template"` - Project just created, only has base Next.js template
   - `"generating"` - AI is currently generating/updating code
   - `"ready"` - AI has finished generating, ready for preview

2. **`lastGeneratedAt`**: Timestamp of when AI last generated code

   - Useful for "Recently Modified" sorting
   - Analytics on project activity
   - Can show "Last updated X minutes ago"

3. **`aiGenerationCount`**: Counter of how many times AI has generated code
   - Usage tracking
   - Analytics
   - Potential usage limits in the future

## Code Changes

### 1. `src/components/coding-interface/ChatPanel.tsx`

When user sends a message, set status to "generating":

```typescript
await fetch(`/api/projects/${projectId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ generationStatus: "generating" }),
});
```

### 2. `src/app/api/files/route.ts`

When files are saved, update generation tracking:

```typescript
await prisma.project.update({
  where: { id: projectId },
  data: {
    files: updatedFiles,
    generationStatus: "ready",
    lastGeneratedAt: new Date(),
    aiGenerationCount: { increment: 1 },
  },
});
```

### 3. `src/components/coding-interface/PreviewPanel.tsx`

Only auto-start sandbox when `generationStatus === "ready"`:

```typescript
useEffect(() => {
  if (
    !isGeneratingFiles &&
    generationStatus === "ready" &&
    Object.keys(projectFiles).length > 0 &&
    sandboxStatus === "inactive"
  ) {
    console.log(`🚀 AI finished generating - auto-starting preview...`);
    setTimeout(() => startSandbox(), 800);
  }
}, [isGeneratingFiles, generationStatus, projectFiles, sandboxStatus]);
```

### 4. `src/components/CodingInterface.tsx`

- Added `generationStatus` to Project interface
- Pass `generationStatus` to PreviewPanel
- Refresh project after files are saved to get updated status

## Flow Diagram

```
1. User creates project
   ↓
   generationStatus = "template"
   Preview panel: Do nothing (no auto-start)

2. User sends first message
   ↓
   generationStatus = "generating"
   Preview panel: Show "AI is generating..."

3. AI generates files → Files saved
   ↓
   generationStatus = "ready"
   lastGeneratedAt = now()
   aiGenerationCount += 1

4. PreviewPanel detects status change
   ↓
   Auto-start sandbox (first time only)
   OR
   Update existing sandbox files (subsequent times)
```

## Benefits

✅ **No premature sandbox starts** - Sandbox only starts after AI generates code
✅ **Better user experience** - Clear states: template → generating → ready
✅ **Analytics data** - Track when and how often AI generates code
✅ **Future features** - Can show "Last updated", usage limits, etc.
✅ **Cleaner logic** - Database field instead of client-side state tracking

## Migration

Migration created: `20251011083603_add_generation_tracking`

All existing projects will have:

- `generationStatus = "template"` (default)
- `lastGeneratedAt = null`
- `aiGenerationCount = 0`

When they next generate code, these fields will be updated automatically.

## Testing

1. Create a new project → generationStatus should be "template"
2. Send first message → generationStatus changes to "generating"
3. AI generates files → generationStatus changes to "ready"
4. Preview auto-starts only after status is "ready"
5. Subsequent messages update files but don't restart sandbox
