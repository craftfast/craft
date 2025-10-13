# AI Environment Awareness - Visual Flow Diagram

## Complete System Flow

````
┌─────────────────────────────────────────────────────────────────────┐
│                         USER CREATES PROJECT                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Template Generated & Saved to DB                  │
│                                                                     │
│  package.json, tsconfig.json, tailwind.config.ts,                  │
│  next.config.ts, src/app/layout.tsx, src/app/page.tsx, etc.       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    USER DESCRIBES APP IDEA IN CHAT                  │
│                  "Create a dashboard with sidebar"                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ChatPanel.handleSendMessage()                     │
│                                                                     │
│  1. onGeneratingStatusChange(true) ✅                               │
│  2. Send to /api/chat with taskType: 'coding'                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      /api/chat (Chat Route)                         │
│                                                                     │
│  1. Get system prompt: getSystemPrompt('coding')                    │
│  2. Prompt includes:                                                │
│     - Sandbox environment (E2B, /home/user, port 3000)             │
│     - Available tools (file creation, HMR, database)               │
│     - Design system (neutral colors, rounded corners)              │
│     - File structure conventions                                    │
│  3. Stream response from Claude                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AI GENERATES RESPONSE                        │
│                                                                     │
│  "I'll create a dashboard with sidebar. Here are the components:   │
│                                                                     │
│  ```typescript // src/components/DashboardLayout.tsx               │
│  export default function DashboardLayout() { ... }                 │
│  ```                                                                │
│                                                                     │
│  ```typescript // src/components/Sidebar.tsx                       │
│  export default function Sidebar() { ... }                         │
│  ```                                                                │
│                                                                     │
│  This layout uses neutral colors and rounded corners..."           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ChatPanel Receives Stream                         │
│                                                                     │
│  1. Display response in real-time                                   │
│  2. After stream completes:                                         │
│     - Extract code blocks with file paths                           │
│     - Save each file to database                                    │
│     - Call onFilesCreated() → Updates CodingInterface state        │
│  3. onGeneratingStatusChange(false) ✅                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CodingInterface Updates                          │
│                                                                     │
│  1. setProjectFiles(newFiles) ✅                                    │
│  2. setIsGeneratingFiles(false) ✅                                  │
│  3. setActiveTab("preview") - Switch to preview                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PreviewPanel Detects Changes                      │
│                                                                     │
│  useEffect triggers:                                                │
│                                                                     │
│  const shouldAutoStart =                                            │
│    sandboxStatus === "inactive" &&                                  │
│    Object.keys(projectFiles).length > 0 &&                          │
│    !isGeneratingFiles; // ✅ NOW FALSE, GENERATION DONE             │
│                                                                     │
│  if (shouldAutoStart) {                                             │
│    setTimeout(() => startSandbox(), 500); ✅                        │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│               PreviewPanel.startSandbox() Executes                  │
│                                                                     │
│  1. setSandboxStatus("loading")                                     │
│  2. Fetch files from /api/files?projectId=...                       │
│  3. Send to POST /api/sandbox/[projectId]                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  /api/sandbox/[projectId] (POST)                    │
│                                                                     │
│  1. Get project files from database                                 │
│  2. Check if files exist:                                           │
│     if (files.length === 0) {                                       │
│       return error: "No files. Use AI chat first." ❌               │
│     }                                                               │
│  3. Create E2B Sandbox                                              │
│  4. Write all files to /home/user/*                                 │
│  5. npm install --legacy-peer-deps                                  │
│  6. Start Next.js dev server on port 3000                           │
│  7. Return preview URL                                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PreviewPanel Shows Preview                     │
│                                                                     │
│  1. setPreviewUrl(data.url)                                         │
│  2. setIframeUrl(data.url)                                          │
│  3. setSandboxStatus("running") ✅                                  │
│  4. Display iframe with live preview                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    USER SEES LIVE PREVIEW! 🎉                       │
│                                                                     │
│  Dashboard with sidebar appears in iframe                           │
│  - Uses neutral colors ✅                                           │
│  - Has rounded corners ✅                                           │
│  - Supports dark mode ✅                                            │
│  - HMR enabled for instant updates ✅                               │
└─────────────────────────────────────────────────────────────────────┘
````

## State Timeline

````
TIME →

0ms:     User clicks "Create Project"
         └─> Template generated → Saved to DB

100ms:   User types: "Create a dashboard"

200ms:   User presses Enter
         └─> isGeneratingFiles = TRUE ✅
         └─> Chat API called

250ms:   AI receives system prompt with:
         - Environment: E2B, /home/user, port 3000
         - Tools: File creation, HMR, database
         - Constraints: Neutral colors, rounded corners

300ms:   AI starts streaming response
         └─> "I'll create a dashboard..."

1000ms:  AI streams code block:
         ```typescript // src/components/DashboardLayout.tsx

2000ms:  AI completes streaming
         └─> Extract code blocks
         └─> Save files to database
         └─> onFilesCreated() called
         └─> isGeneratingFiles = FALSE ✅

2100ms:  PreviewPanel detects:
         - Has files ✅
         - Not generating ✅
         - Sandbox inactive ✅
         └─> startSandbox() triggered

2600ms:  Sandbox API receives request
         └─> Create E2B sandbox
         └─> Write files
         └─> npm install

15000ms: Dependencies installed
         └─> Start Next.js dev server

18000ms: Dev server ready on port 3000
         └─> Return preview URL

18500ms: Preview appears in iframe ✨
         └─> User sees dashboard with sidebar
         └─> HMR enabled for future updates
````

## Component Communication

```
┌─────────────────────────────────────────────────────────────┐
│                     CodingInterface                         │
│                      (Parent/Coordinator)                   │
│                                                             │
│  State:                                                     │
│  - projectFiles: Record<string, string>                     │
│  - isGeneratingFiles: boolean                               │
│                                                             │
│  Passes down:                                               │
│  - To ChatPanel: onGeneratingStatusChange(boolean)          │
│  - To PreviewPanel: projectFiles, isGeneratingFiles         │
└─────────────────────────────────────────────────────────────┘
          │                                    │
          │                                    │
          ▼                                    ▼
┌─────────────────────────┐      ┌───────────────────────────┐
│      ChatPanel          │      │      PreviewPanel         │
│  (File Generation)      │      │   (Sandbox Management)    │
│                         │      │                           │
│  When AI streams:       │      │  Watches:                 │
│  1. Set generating=true │      │  - projectFiles           │
│  2. Extract code blocks │      │  - isGeneratingFiles      │
│  3. Save to database    │      │                           │
│  4. Set generating=false│      │  Logic:                   │
│                         │      │  if (!isGenerating &&     │
│  Triggers:              │      │      hasFiles) {          │
│  onGeneratingStatusChange│      │    startSandbox();       │
│                         │      │  }                        │
└─────────────────────────┘      └───────────────────────────┘
          │                                    │
          │                                    │
          ▼                                    ▼
┌─────────────────────────┐      ┌───────────────────────────┐
│    /api/chat            │      │  /api/sandbox/[id]        │
│                         │      │                           │
│  Uses:                  │      │  Validates:               │
│  getSystemPrompt()      │      │  - Files exist?           │
│  - Environment info     │      │  - AI generated them      │
│  - Tool descriptions    │      │                           │
│  - Design constraints   │      │  Creates:                 │
│                         │      │  - E2B Sandbox            │
│  Returns:               │      │  - Installs deps          │
│  Streaming AI response  │      │  - Starts Next.js         │
└─────────────────────────┘      └───────────────────────────┘
```

## AI Knowledge Flow

```
┌──────────────────────────────────────────────────────────────┐
│              AI SYSTEM PROMPT (Coding)                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Technology Stack:                                           │
│  ✅ Next.js 15.1.3 with App Router                          │
│  ✅ TypeScript                                              │
│  ✅ Tailwind CSS (neutral colors ONLY)                      │
│  ✅ React 19                                                │
│  ✅ Prisma ORM                                              │
│                                                              │
│  Sandbox Environment:                                        │
│  ✅ Type: E2B Code Interpreter                              │
│  ✅ Working Directory: /home/user                           │
│  ✅ Runtime: Node.js                                        │
│  ✅ Port: 3000                                              │
│  ✅ Hot Reload: Enabled                                     │
│                                                              │
│  File Structure:                                             │
│  ✅ /home/user/src/app/        (pages)                      │
│  ✅ /home/user/src/components/ (components)                 │
│  ✅ /home/user/src/lib/        (utilities)                  │
│  ✅ /home/user/public/         (static)                     │
│                                                              │
│  Tools Available:                                            │
│  ✅ File Creation (code blocks with paths)                  │
│  ✅ Live Preview (auto HMR)                                 │
│  ✅ Database (Prisma)                                       │
│                                                              │
│  Design System:                                              │
│  ✅ Colors: neutral-*, stone-*, gray-* ONLY                 │
│  ✅ Borders: rounded-full, -lg, -xl, -2xl                   │
│  ✅ Dark Mode: Always required                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  AI Generates Code      │
              │  With Full Context      │
              │                         │
              │  ✅ Correct paths       │
              │  ✅ Right colors        │
              │  ✅ Rounded corners     │
              │  ✅ Dark mode support   │
              │  ✅ Best practices      │
              └─────────────────────────┘
```

## Error Prevention Flow

```
OLD SYSTEM (Hardcoded Template):
┌──────────────────────────────────────────┐
│  User creates project                    │
│  └─> Hardcoded template appears          │
│  └─> Sandbox starts immediately          │
│  └─> User sees generic template          │
│  └─> AI modifies template                │
│  └─> Not what user wanted ❌             │
└──────────────────────────────────────────┘

NEW SYSTEM (AI-Driven):
┌──────────────────────────────────────────┐
│  User creates project                    │
│  └─> Template saved (not visible)        │
│  └─> User describes app                  │
│  └─> AI generates from scratch           │
│  └─> Files appear in Code tab ✅         │
│  └─> Sandbox starts when ready ✅        │
│  └─> Preview shows AI code only ✅       │
│  └─> Exactly what user wanted ✅         │
└──────────────────────────────────────────┘

Error Case:
┌──────────────────────────────────────────┐
│  Try to start sandbox without files     │
│  └─> API checks: files.length === 0?    │
│  └─> Returns 400 error:                 │
│      "No files. Use AI chat first."     │
│  └─> Forces proper workflow ✅          │
└──────────────────────────────────────────┘
```

## Summary: What Changed

```
BEFORE:
├─ Hardcoded template → Sandbox starts → AI modifies
├─ AI unaware of environment
├─ Generic system prompts
└─ Template visible to users

AFTER:
├─ AI generates → Files saved → Sandbox starts
├─ AI fully aware of E2B environment
├─ Environment-specific system prompts
└─ Only AI-generated code visible

RESULT:
✅ Better AI code generation
✅ Faster initial setup
✅ Smoother user experience
✅ No template clutter
✅ Full AI creative freedom
```
