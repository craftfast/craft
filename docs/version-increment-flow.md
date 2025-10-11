# Version Number Update Flow

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER SENDS MESSAGE                                           │
│    ChatPanel.handleSendMessage()                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SET STATUS TO "GENERATING"                                   │
│    PATCH /api/projects/{id}                                     │
│    { generationStatus: "generating" }                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. AI RESPONDS WITH CODE                                        │
│    POST /api/chat                                               │
│    Streams response with code blocks                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. EXTRACT CODE BLOCKS                                          │
│    ChatPanel.extractCodeBlocks(fullContent)                     │
│    Returns: [{ path: "...", content: "..." }, ...]             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SAVE FILES ONE BY ONE (Version NOT incremented yet)         │
│    ChatPanel.saveFiles(extractedFiles)                          │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ FOR EACH FILE:                                       │    │
│    │   POST /api/files                                    │    │
│    │   {                                                  │    │
│    │     projectId,                                       │    │
│    │     filePath: "src/app/page.tsx",                   │    │
│    │     content: "...",                                  │    │
│    │     skipGenerationTracking: true  ← KEY!            │    │
│    │   }                                                  │    │
│    │                                                      │    │
│    │   Result: File saved, but version NOT incremented   │    │
│    └──────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. FINALIZE GENERATION (Version IS incremented here!)          │
│    POST /api/files                                              │
│    {                                                            │
│      projectId,                                                 │
│      finalizeGeneration: true  ← TRIGGERS VERSION INCREMENT     │
│    }                                                            │
│                                                                 │
│    Files API does:                                              │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ await prisma.project.update({                        │    │
│    │   where: { id: projectId },                          │    │
│    │   data: {                                            │    │
│    │     generationStatus: "ready",                       │    │
│    │     version: { increment: 1 },  ← VERSION: 0→1→2→... │    │
│    │     lastCodeUpdateAt: new Date()                     │    │
│    │   }                                                  │    │
│    │ })                                                   │    │
│    └──────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. NOTIFY PARENT COMPONENT                                      │
│    onFilesCreated(files) → CodingInterface                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. REFRESH PROJECT DATA                                         │
│    CodingInterface.refreshProject()                             │
│    GET /api/projects/{id}                                       │
│    Returns updated project with new version number              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. PREVIEW PANEL DETECTS CHANGE                                 │
│    useEffect([version, generationStatus, ...])                  │
│    Checks: version > 0 && generationStatus === "ready"          │
│    → AUTO-STARTS PREVIEW! 🚀                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Code Locations

### Where Version is Incremented

**File:** `src/app/api/files/route.ts`

**Two places:**

1. **Finalize Generation** (Lines 40-56) - Used by ChatPanel

```typescript
if (finalizeGeneration) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      version: { increment: 1 }, // ← HERE
      generationStatus: "ready",
      lastCodeUpdateAt: new Date(),
    },
  });
}
```

2. **Batch File Update** (Lines 62-79) - Fallback/alternative method

```typescript
if (batchFiles && typeof batchFiles === "object") {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      files: updatedFiles,
      version: { increment: 1 }, // ← HERE TOO
      generationStatus: "ready",
      lastCodeUpdateAt: new Date(),
    },
  });
}
```

### When It's Called

**File:** `src/components/coding-interface/ChatPanel.tsx`

**Function:** `saveFiles()` (Lines 253-287)

```typescript
const saveFiles = async (files: { path: string; content: string }[]) => {
  // Step 1: Save all files without incrementing version
  for (const file of files) {
    await fetch("/api/files", {
      body: JSON.stringify({
        projectId,
        filePath: file.path,
        content: file.content,
        skipGenerationTracking: true, // Don't increment yet
      }),
    });
  }

  // Step 2: Increment version ONCE after all files are saved
  await fetch("/api/files", {
    body: JSON.stringify({
      projectId,
      finalizeGeneration: true, // Triggers version increment
    }),
  });
};
```

## Why This Approach?

### ❌ Bad Approach (What we DON'T do):

```
Save file 1 → version++  (0 → 1)
Save file 2 → version++  (1 → 2)
Save file 3 → version++  (2 → 3)
Result: version = 3 for ONE AI response! ❌
```

### ✅ Good Approach (What we DO):

```
Save file 1 → version stays 0
Save file 2 → version stays 0
Save file 3 → version stays 0
Finalize   → version++  (0 → 1)
Result: version = 1 for ONE AI response! ✅
```

## Database Queries

### Version Increment Query

```sql
UPDATE "projects"
SET
  "version" = "version" + 1,
  "generationStatus" = 'ready',
  "lastCodeUpdateAt" = NOW(),
  "updatedAt" = NOW()
WHERE "id" = $1
RETURNING *
```

Prisma equivalent:

```typescript
version: {
  increment: 1;
}
```

## Debugging

### Check Current Version

```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  select: {
    version: true,
    generationStatus: true,
    lastCodeUpdateAt: true,
  },
});

console.log(`Version: ${project.version}`);
console.log(`Status: ${project.generationStatus}`);
console.log(`Last Update: ${project.lastCodeUpdateAt}`);
```

### Console Logs to Watch For

1. **File saves:**

```
📄 Updated single file src/app/page.tsx for project xxx (status update skipped)
```

2. **Version increment:**

```
✅ Finalized generation - incremented version for project xxx
```

3. **Preview auto-start:**

```
🚀 AI finished generating (status: ready, version: 1) - auto-starting preview...
```

## Summary

**When:** After AI completes generating code and all files are saved  
**Where:** `/api/files` route with `finalizeGeneration: true`  
**How:** `version: { increment: 1 }` in Prisma update  
**Result:** Version goes from 0 → 1 → 2 → 3... (once per AI code generation)
