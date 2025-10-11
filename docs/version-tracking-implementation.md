# Version-Based Code Update Tracking

## Overview

Track project code updates using a simple version number system. Perfect for billing, usage analytics, and project history.

## Version System

- **v0** = Template only (no AI updates yet)
- **v1** = First AI code update
- **v2** = Second AI code update
- **v3+** = Subsequent updates

## Database Schema

```prisma
model Project {
  version             Int           @default(0) // v0 = template, v1+ = AI updates
  generationStatus    String        @default("template") // "template" | "generating" | "ready"
  lastCodeUpdateAt    DateTime?     // When code was last updated by AI
}

model ChatMessage {
  @@index([role, createdAt]) // For querying AI messages by time
}
```

## Benefits

✅ **Simple billing** - Charge per version increment (each code update)
✅ **Project history** - Version number shows how many times code was updated
✅ **Time-based queries** - ChatMessage index allows querying messages by timeframe
✅ **Usage analytics** - Track when users update code most frequently
✅ **Clean semantics** - Version 0 = template, Version N = N updates made

## How It Works

### 1. Project Creation

```
Status: template
Version: 0
```

### 2. User Sends First Message

```
Status: generating → ready (after completion)
Version: 0 → 1 (incremented when files saved)
lastCodeUpdateAt: [timestamp]
```

### 3. Subsequent Updates

```
Status: generating → ready
Version: 1 → 2 → 3 → ...
lastCodeUpdateAt: [updated timestamp]
```

## Code Flow

### ChatPanel - Save Files

```typescript
const saveFiles = async (files: { path: string; content: string }[]) => {
  // Save files one by one
  for (const file of files) {
    await fetch("/api/files", {
      body: JSON.stringify({
        projectId,
        filePath: file.path,
        content: file.content,
        skipGenerationTracking: true, // Don't update on each file
      }),
    });
  }

  // After all files saved, finalize
  await fetch("/api/files", {
    body: JSON.stringify({
      projectId,
      finalizeGeneration: true, // Increment version once
    }),
  });
};
```

### Files API - Finalize Generation

```typescript
if (finalizeGeneration) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      generationStatus: "ready",
      version: { increment: 1 },
      lastCodeUpdateAt: new Date(),
    },
  });
}
```

### Files API - Single File (with skip flag)

```typescript
if (filePath && content !== undefined) {
  const updateData = { files: currentFiles };

  // Only update tracking if not skipped
  if (!skipGenerationTracking) {
    updateData.generationStatus = "ready";
  }

  await prisma.project.update({ data: updateData });
}
```

## Usage Queries

### Get total code updates for a user

```typescript
const projects = await prisma.project.findMany({
  where: { userId },
  select: { version: true },
});

const totalUpdates = projects.reduce((sum, p) => sum + p.version, 0);
```

### Get projects updated in last 30 days

```typescript
const recentProjects = await prisma.project.findMany({
  where: {
    userId,
    lastCodeUpdateAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  },
  orderBy: { lastCodeUpdateAt: "desc" },
});
```

### Get AI messages in a timeframe

```typescript
const messages = await prisma.chatMessage.findMany({
  where: {
    role: "assistant",
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  },
  include: {
    chatSession: {
      include: { project: true },
    },
  },
});
```

## Billing Integration

### Simple Per-Update Pricing

```typescript
// Charge $X per code update
const totalUpdates = project.version; // v5 = 5 updates
const cost = totalUpdates * pricePerUpdate;
```

### Tiered Pricing

```typescript
// Free: 0-10 updates
// Basic: 11-50 updates
// Pro: 51+ updates
const tier =
  project.version <= 10 ? "free" : project.version <= 50 ? "basic" : "pro";
```

### Monthly Usage

```typescript
// Count updates in billing period
const updatesThisMonth = await prisma.project.aggregate({
  where: {
    userId,
    lastCodeUpdateAt: {
      gte: billingPeriodStart,
      lte: billingPeriodEnd,
    },
  },
  _sum: { version: true },
});
```

## Migration

Created: `20251011085006_add_version_tracking`

All existing projects:

- `version` starts at 0
- `generationStatus` = "template"
- `lastCodeUpdateAt` = null

## Auto-Start Preview Logic

Preview only auto-starts when:

```typescript
generationStatus === "ready" && version > 0;
```

This ensures:

- Template-only projects (v0) don't auto-start
- Only projects with AI updates auto-start
- Clear signal that code is ready to preview
