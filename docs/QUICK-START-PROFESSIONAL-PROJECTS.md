# Professional Project Creation - Quick Start Guide

## 🎯 Overview

Every project in Craft now starts with a **professional, standardized Next.js template** - just like running `create-next-app@latest`. The AI then edits this code based on your requirements, and everything is automatically saved to the database and deployed to a live preview sandbox.

## 🚀 How It Works

### 1. Create a Project

```typescript
// User describes what they want to build
"Create a modern landing page with hero section and pricing";

// System automatically:
// 1. Generates an AI-powered project name: "Modern Landing Page"
// 2. Creates Next.js template files (package.json, app/layout.tsx, etc.)
// 3. Saves all template files to database
// 4. Redirects to coding interface
```

### 2. AI Edits the Code

```typescript
// On page load, AI receives the project description automatically
// AI analyzes what you want and starts editing files:

Modified files:
- app/page.tsx          → Creates landing page with hero
- app/components/Hero.tsx → Hero section component
- app/components/Pricing.tsx → Pricing section component
- app/globals.css       → Updated styles

All changes are saved to database in real-time ✅
```

### 3. Preview in Sandbox

```typescript
// Click "Start Preview"
// System:
// 1. Fetches latest files from database
// 2. Creates E2B sandbox
// 3. Installs dependencies
// 4. Starts Next.js dev server
// 5. Returns live preview URL

Preview available at: https://sandbox-abc123.e2b.dev ✅
```

### 4. Continuous Iteration

```typescript
// User: "Make the hero section more colorful"
// AI: Edits app/page.tsx and app/globals.css
// Files automatically saved to database
// Sandbox auto-updates via HMR (Hot Module Replacement)
// Preview updates instantly

Everything is persistent - reload the page and your code is still there ✅
```

## 📁 Standard Template Structure

Every project starts with these files:

```
project/
├── package.json              # Next.js 15 + React 19 + TypeScript
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS v3.4
├── postcss.config.mjs        # PostCSS with Tailwind
├── .gitignore                # Standard Next.js gitignore
├── README.md                 # Project documentation
└── src/
    └── app/
        ├── layout.tsx        # Root layout with metadata
        ├── page.tsx          # Home page
        └── globals.css       # Tailwind CSS imports
```

## 🔧 API Reference

### Create Project

```bash
POST /api/projects
Content-Type: application/json

{
  "name": "New Project",
  "description": "A modern portfolio website with dark mode"
}
```

**Response:**

```json
{
  "project": {
    "id": "clx123abc",
    "name": "Modern Portfolio Site", // AI-generated
    "description": "A modern portfolio website with dark mode",
    "files": {
      "package.json": "...",
      "src/app/layout.tsx": "...",
      "src/app/page.tsx": "..."
      // ... all template files
    },
    "createdAt": "2025-10-10T12:00:00.000Z"
  }
}
```

### Save Files (Single File)

```bash
POST /api/files
Content-Type: application/json

{
  "projectId": "clx123abc",
  "filePath": "src/app/page.tsx",
  "content": "export default function Home() { ... }"
}
```

### Save Files (Batch Update)

```bash
POST /api/files
Content-Type: application/json

{
  "projectId": "clx123abc",
  "files": {
    "src/app/page.tsx": "...",
    "src/app/components/Hero.tsx": "...",
    "src/app/globals.css": "..."
  }
}
```

### Get Project Files

```bash
GET /api/files?projectId=clx123abc
```

**Response:**

```json
{
  "files": {
    "package.json": "...",
    "src/app/layout.tsx": "...",
    "src/app/page.tsx": "...",
    "src/app/components/Hero.tsx": "..."
  }
}
```

### Start Sandbox Preview

```bash
POST /api/sandbox/clx123abc
Content-Type: application/json

{
  "files": {
    // Optional - if not provided, fetches from database
  }
}
```

**Response:**

```json
{
  "sandboxId": "clx123abc",
  "url": "https://sandbox-clx123abc.e2b.dev",
  "status": "running",
  "filesUpdated": false
}
```

### Update Sandbox Files

```bash
POST /api/sandbox/clx123abc
Content-Type: application/json

{
  "files": {
    "src/app/page.tsx": "updated content...",
    "src/app/components/NewComponent.tsx": "new component..."
  }
}
```

**Behavior:**

- Existing sandbox: Updates files, reruns `npm install` if `package.json` changed
- New sandbox: Creates sandbox with all files

## 🎨 Template Customization

### Using the Template Service

```typescript
import { getNextJsTemplate } from "@/lib/templates/nextjs";

// Get full Next.js template
const files = getNextJsTemplate();

// Customize before saving
files["src/app/page.tsx"] = `
export default function Home() {
  return <div>Custom home page</div>;
}
`;

// Save to database
await prisma.project.create({
  data: {
    name: "My Project",
    files: files,
    userId: user.id,
  },
});
```

### Template Features

- ✅ Next.js 15.1.3
- ✅ React 19
- ✅ TypeScript 5
- ✅ Tailwind CSS 3.4
- ✅ ESLint
- ✅ App Router
- ✅ Dark mode support
- ✅ Geist fonts
- ✅ Production-ready config

## 🔄 Data Flow

```
User Input
    ↓
Generate Name (AI)
    ↓
Create Project + Template Files → Database
    ↓
Redirect to Coding Interface
    ↓
AI Auto-Prompt → Generate Code → Save to Database
    ↓
User Clicks Preview → Fetch Files from Database → E2B Sandbox
    ↓
Preview Running ✅
    ↓
User Chats with AI → AI Edits Code → Save to Database → Sandbox Auto-Updates
```

## 🧪 Testing

### 1. Test Project Creation

```bash
# Create a new project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "New Project",
    "description": "A weather dashboard app"
  }'

# Verify files in response
# Should see package.json, src/app/layout.tsx, etc.
```

### 2. Test File Operations

```bash
# Get project files
curl http://localhost:3000/api/files?projectId=clx123abc \
  -H "Cookie: your-session-cookie"

# Update a file
curl -X POST http://localhost:3000/api/files \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "projectId": "clx123abc",
    "filePath": "src/app/page.tsx",
    "content": "export default function Home() { return <div>Test</div> }"
  }'

# Batch update multiple files
curl -X POST http://localhost:3000/api/files \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "projectId": "clx123abc",
    "files": {
      "src/app/page.tsx": "...",
      "src/app/test.tsx": "..."
    }
  }'
```

### 3. Test Sandbox Integration

```bash
# Start sandbox (fetches files from database)
curl -X POST http://localhost:3000/api/sandbox/clx123abc \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{}'

# Check sandbox status
curl http://localhost:3000/api/sandbox/clx123abc \
  -H "Cookie: your-session-cookie"

# Stop sandbox
curl -X DELETE http://localhost:3000/api/sandbox/clx123abc \
  -H "Cookie: your-session-cookie"
```

## 📊 Database Schema

```prisma
model Project {
  id           String        @id @default(cuid())
  name         String
  description  String?
  type         String        @default("document")
  status       String        @default("active")
  userId       String
  files        Json          @default("{}") // Stores all project files
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  user         User          @relation(fields: [userId], references: [id])
  chatSessions ChatSession[]
}
```

**Files JSON Structure:**

```json
{
  "package.json": "{ \"name\": \"project\"... }",
  "src/app/layout.tsx": "import type { Metadata }...",
  "src/app/page.tsx": "export default function Home()...",
  "src/app/globals.css": "@tailwind base;...",
  "tsconfig.json": "{ \"compilerOptions\": {...}}",
  "tailwind.config.ts": "import type { Config }...",
  "next.config.ts": "import type { NextConfig }...",
  "postcss.config.mjs": "const config = {...}",
  "README.md": "# Project Name..."
}
```

## ⚡ Performance Tips

### 1. Batch File Updates

```typescript
// ❌ Don't: Multiple individual requests
for (const [path, content] of Object.entries(files)) {
  await fetch("/api/files", {
    method: "POST",
    body: JSON.stringify({ projectId, filePath: path, content }),
  });
}

// ✅ Do: Single batch request
await fetch("/api/files", {
  method: "POST",
  body: JSON.stringify({ projectId, files }),
});
```

### 2. Smart Sandbox Updates

```typescript
// Sandbox automatically fetches from database
// No need to send files if they're already saved

// ✅ Simple preview start
await fetch(`/api/sandbox/${projectId}`, {
  method: "POST",
  body: JSON.stringify({}), // Empty - fetches from DB
});
```

### 3. Optimize File Storage

```typescript
// Store only source files, not generated ones
const filesToSave = Object.fromEntries(
  Object.entries(files).filter(
    ([path]) =>
      !path.includes("node_modules") &&
      !path.includes(".next") &&
      !path.includes("build")
  )
);
```

## 🐛 Troubleshooting

### Files Not Appearing in Preview

```typescript
// 1. Check if files are in database
const response = await fetch(`/api/files?projectId=${projectId}`);
const { files } = await response.json();
console.log("Files in DB:", Object.keys(files));

// 2. Check sandbox received files
// Look for logs: "📦 Using X files for project"
// "📋 Files list: [...]"

// 3. Verify file paths match
// Sandbox expects: src/app/page.tsx
// Not: /src/app/page.tsx or app/page.tsx
```

### Sandbox Not Starting

```typescript
// Check E2B API key
console.log("E2B_API_KEY:", process.env.E2B_API_KEY ? "Set ✓" : "Missing ✗");

// Check sandbox logs in terminal
// Look for: "🚀 Creating NEW sandbox for project"

// Verify project ownership
// Only the project owner can start sandboxes
```

### Files Not Persisting

```typescript
// Ensure files are saved to database after AI edits
// Check for successful API response:
{
  "success": true,
  "filesUpdated": 5,
  "message": "Files saved successfully"
}

// Check browser DevTools Network tab
// Look for POST /api/files requests
```

## 📚 Related Documentation

- [Professional Project Creation System](./professional-project-creation.md) - Full architecture
- [E2B Preview Summary](./e2b-preview-summary.md) - Sandbox system details
- [AI Integration Summary](./ai-integration-summary.md) - AI code editing
- [Chat Sessions Implementation](./chat-sessions-implementation.md) - Chat system
- [Projects Implementation](./projects-implementation.md) - Project management

## 🎯 Next Steps

1. **Try It Out**: Create a new project and see the template in action
2. **Customize**: Modify the template in `src/lib/templates/nextjs.ts`
3. **Extend**: Add more templates (React, Vue, etc.)
4. **Deploy**: Push to production and let users build!

---

**Status**: ✅ Ready to Use  
**Last Updated**: October 10, 2025
