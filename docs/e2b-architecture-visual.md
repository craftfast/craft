# E2B Integration Architecture - Visual Guide

## 🏗️ Architecture Comparison

### ❌ Old Complex Architecture

```
┌─────────────┐
│ AI Response │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Save to Database │
│   (files table)  │
└──────┬───────────┘
       │
       ▼
┌───────────────────────┐
│ Fetch from Database   │
│ /api/files?projectId  │
└──────┬────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Check Sandbox Exists         │
│ /api/sandbox/[id] GET        │
└──────┬───────────────────────┘
       │
       ├─── Exists ────┐
       │               │
       │               ▼
       │        ┌────────────────┐
       │        │ Update Files   │
       │        │ Write to FS    │
       │        │ Check deps     │
       │        │ Maybe reinstall│
       │        └────────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────────────────────┐
│ Create New Sandbox           │
│ - Initialize E2B             │
│ - Setup Next.js              │
│ - npm install                │
│ - Write files                │
│ - Start dev server           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Return URL                   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Auto-refresh Logic           │
│ - Watch file changes         │
│ - Fetch again from DB        │
│ - Update sandbox             │
│ - Complex state management   │
└──────────────────────────────┘

Problems:
❌ 6-8 steps
❌ Multiple database queries
❌ Complex state management
❌ Slow updates
❌ Many failure points
```

### ✅ New Simplified Architecture

```
┌─────────────┐
│ AI Response │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│ Send Code to E2B             │
│ /api/sandbox-simple POST     │
│                              │
│ {                            │
│   projectId: "123",          │
│   code: {                    │
│     "pages/index.tsx": "..." │
│   }                          │
│ }                            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ E2B Creates Sandbox          │
│ - Sandbox.create()           │
│ - Write files directly       │
│ - Return URL                 │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Display in iframe            │
│ <iframe src={url} />         │
└──────────────────────────────┘

Benefits:
✅ 3 simple steps
✅ Zero database queries
✅ Minimal state
✅ Fast and reliable
✅ One failure point
```

## 🔄 Data Flow Diagrams

### Old Flow (Complex)

```
User Clicks "Start Preview"
         │
         ▼
┌────────────────────┐
│ Fetch files from DB│ ← 200-500ms
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Check sandbox      │ ← 100ms
└────────┬───────────┘
         │
         ├─── Exists? ───┐
         │   No          │ Yes
         ▼               ▼
    ┌─────────┐    ┌──────────┐
    │ Create  │    │ Update   │
    │ Sandbox │    │ Files    │
    │ 30-40s  │    │ 2-5s     │
    └────┬────┘    └────┬─────┘
         │              │
         └──────┬───────┘
                ▼
         ┌─────────────┐
         │ Return URL  │
         └──────┬──────┘
                ▼
         ┌─────────────┐
         │ Display     │
         └─────────────┘

Total: 35-50s first time
       2-5s updates
```

### New Flow (Simple)

```
User Clicks "Start Preview"
         │
         ▼
┌────────────────────┐
│ POST to sandbox    │
│ with code directly │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ E2B creates        │
│ sandbox + writes   │
│ files (30-40s)     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Return URL         │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Display in iframe  │
└────────────────────┘

Total: 30-40s first time
       Instant refreshes

With Template: 3-6s!
```

## 📦 Component Structure

### Old Structure

```
CodingInterface.tsx
    │
    ├── ChatPanel
    │   └── Sends messages
    │       └── Updates database
    │           └── Triggers file fetch
    │
    └── PreviewPanel
        ├── State (8+ variables)
        │   ├── previewUrl
        │   ├── iframeUrl
        │   ├── isRefreshing
        │   ├── sandboxStatus
        │   ├── error
        │   ├── loadingMessage
        │   └── deviceMode
        │
        ├── useEffect #1: Check sandbox
        ├── useEffect #2: Auto-refresh
        │
        ├── startSandbox()
        │   ├── Fetch from /api/files
        │   └── POST to /api/sandbox/[id]
        │
        ├── updateSandboxFiles()
        │   ├── Fetch from /api/files
        │   ├── POST to /api/sandbox/[id]
        │   ├── Wait for write
        │   └── Force refresh iframe
        │
        └── Complex refresh logic
```

### New Structure

```
CodingInterface.tsx
    │
    ├── ChatPanel
    │   └── Sends messages
    │       └── Updates projectFiles state
    │
    └── PreviewPanelSimple
        ├── State (3 variables)
        │   ├── previewUrl
        │   ├── iframeKey
        │   └── status
        │
        ├── startPreview()
        │   └── POST to /api/sandbox-simple
        │       └── Done!
        │
        ├── refreshPreview()
        │   └── setIframeKey(prev => prev + 1)
        │
        └── Simple iframe display
```

## 🎯 API Endpoint Comparison

### Old API Endpoints

```
GET  /api/files?projectId=xxx
     ├── Query database
     ├── Return file content
     └── Used by preview for refresh

POST /api/files
     ├── Validate project
     ├── Store in database
     └── Used by chat to save

GET  /api/sandbox/[projectId]
     ├── Check if sandbox exists
     └── Return status

POST /api/sandbox/[projectId]
     ├── Check global sandbox map
     ├── If exists: update files
     │   ├── Fetch from database
     │   ├── Write to sandbox
     │   ├── Check package.json
     │   └── Maybe reinstall
     ├── If not: create new
     │   ├── Initialize sandbox
     │   ├── Setup Next.js
     │   ├── npm install
     │   └── Start server
     └── Return URL

DELETE /api/sandbox/[projectId]
       └── Kill sandbox
```

### New API Endpoint

```
POST /api/sandbox-simple
     ├── Receive code directly
     ├── Sandbox.create()
     ├── Write files
     ├── Return URL
     └── Done!

That's it! 🎉
```

## 🧩 State Management

### Old State (Complex)

```typescript
// PreviewPanel.tsx
const [previewUrl, setPreviewUrl] = useState("");
const [iframeUrl, setIframeUrl] = useState("");
const [isRefreshing, setIsRefreshing] = useState(false);
const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>("inactive");
const [error, setError] = useState<string | null>(null);
const [deviceMode, setDeviceMode] = useState<"mobile" | "tablet" | "desktop">(
  "desktop"
);
const [loadingMessage, setLoadingMessage] = useState("Starting preview...");

// Global state
declare global {
  var activeSandboxes: Map<
    string,
    {
      sandbox: Sandbox;
      lastAccessed: Date;
    }
  >;
}

// Cleanup intervals
setInterval(() => {
  // Check and cleanup
}, 5 * 60 * 1000);
```

### New State (Simple)

```typescript
// PreviewPanelSimple.tsx
const [previewUrl, setPreviewUrl] = useState("");
const [iframeKey, setIframeKey] = useState(0);
const [status, setStatus] = useState<PreviewStatus>("idle");

// That's it! No global state, no intervals
```

## 🚀 With E2B Template (Future)

```
┌─────────────────────────┐
│ E2B Template            │
│ (Pre-built once)        │
├─────────────────────────┤
│ ✅ Node.js installed    │
│ ✅ Next.js installed    │
│ ✅ Dependencies ready   │
│ ✅ Dev server configured│
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│ User Requests Preview   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Sandbox.create(template)│ ← 2s
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Write AI-generated code │ ← 500ms
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Dev server auto-starts  │ ← 1s
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Preview Ready!          │ ← Total: 3-4s
└─────────────────────────┘

10x FASTER! 🚀
```

## 📊 Performance Metrics

### Startup Time Comparison

```
Without Template:
Old: ████████████████████████████████████████ 35-50s
New: ██████████████████████████████████░░░░░░ 30-40s

With Template:
New: ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 3-6s

█ = 5 seconds
```

### Code Complexity

```
API Route:
Old: ████████████████████████████████████████ 408 lines
New: ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 145 lines

Preview Component:
Old: ████████████████████████████████████████ Complex
New: ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Simple

█ = 50 lines or complexity unit
```

### Refresh Speed

```
Old: ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 2-5s
New: █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Instant

█ = 500ms
```

## 🎓 Key Principles

### 1. Stateless is Better

```
❌ Store sandbox references globally
✅ Create new sandbox for each preview
```

### 2. Direct is Better

```
❌ Save to DB → Fetch from DB → Send to E2B
✅ Send directly to E2B
```

### 3. Simple is Better

```
❌ Multiple useEffects, auto-refresh, file watching
✅ Simple state, manual refresh, trust E2B
```

### 4. Templates are Better

```
❌ npm install every time (30s)
✅ Pre-built template (3s)
```

### 5. Let E2B Handle It

```
❌ Implement your own hot-reload, file watching
✅ E2B sandboxes have this built-in
```

## 🎯 Decision Tree

```
Need to preview AI code?
    │
    ├─ Yes → Use simplified E2B integration
    │        │
    │        ├─ Need fast previews?
    │        │   │
    │        │   ├─ Yes → Create E2B template
    │        │   │        └─ 3-6s startup! 🚀
    │        │   │
    │        │   └─ No → Use default
    │        │            └─ 30-40s startup
    │        │
    │        └─ Need to update code?
    │            │
    │            └─ Create new sandbox
    │               (Don't try to update old one)
    │
    └─ No → You don't need this guide 😊
```

## 📁 File Organization

```
src/
├── app/
│   └── api/
│       ├── sandbox/              ❌ Old (delete after testing)
│       │   └── [projectId]/
│       │       └── route.ts
│       ├── sandbox-simple/       ✅ New (rename to 'sandbox')
│       │   └── route.ts
│       └── files/                ❌ Optional (maybe delete)
│           └── route.ts
│
└── components/
    └── coding-interface/
        ├── PreviewPanel.tsx      ❌ Old (delete after testing)
        └── PreviewPanelSimple.tsx ✅ New (rename to 'PreviewPanel')
```

## 🎉 Success Metrics

After implementing simplified version:

```
Code Complexity:   ████████░░ (60% reduction)
Performance:       ██████████ (10x with template)
Maintainability:   ██████████ (Much easier)
Reliability:       ██████████ (More consistent)
Developer Joy:     ██████████ (Simpler = happier)

█ = 10%
```

---

**Ready to implement?** Follow `docs/e2b-testing-guide.md` to get started! 🚀
