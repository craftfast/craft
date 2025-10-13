# Base Template AI Workflow - Implementation Summary

## Overview

The AI now works with the **base Next.js template files** that are automatically saved to the database when a project is created. Instead of generating everything from scratch, the AI:

1. Receives the list of existing project files
2. Updates/modifies base template files (like `src/app/page.tsx`)
3. Creates new files as needed (components, APIs, etc.)

This creates a more efficient and consistent workflow.

## How It Works

### 1. Project Creation (Unchanged)

When a user creates a new project:

```typescript
// src/app/api/projects/route.ts
const baseTemplate = getMinimalNextJsTemplate();
// Returns: package.json, tsconfig.json, src/app/page.tsx, etc.

const project = await prisma.project.create({
  data: {
    name: projectName,
    description: description?.trim() || null,
    userId: user.id,
    files: baseTemplate as object, // ✅ Saved to database
  },
});
```

**Base template includes:**
- `package.json` - All dependencies pre-configured
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS with neutral colors
- `postcss.config.mjs` - PostCSS configuration
- `src/app/layout.tsx` - Root layout with HTML structure
- `src/app/page.tsx` - Minimal placeholder page
- `src/app/globals.css` - Global styles with Tailwind directives

### 2. Loading Project Files

When user opens the project:

```typescript
// src/components/CodingInterface.tsx
useEffect(() => {
  const loadProjectFiles = async () => {
    const response = await fetch(`/api/files?projectId=${project.id}`);
    const data = await response.json();
    setProjectFiles(data.files || {});
    // projectFiles now contains all base template files
  };
  loadProjectFiles();
}, [project.id]);
```

### 3. Sending Files to AI

When user chats with the AI:

```typescript
// src/components/coding-interface/ChatPanel.tsx
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({
    messages: [...messages, userMessage],
    taskType: "coding",
    projectFiles, // ✅ Send existing files to AI
  }),
});
```

### 4. AI Receives Context

The AI receives the file list in its system prompt:

```typescript
// src/lib/ai/system-prompts.ts
export function getCodingSystemPrompt(projectFiles?: Record<string, string>) {
  if (projectFiles && Object.keys(projectFiles).length > 0) {
    const fileList = Object.keys(projectFiles).sort();
    
    // AI sees:
    // ## Current Project Files (8 files loaded)
    // - `package.json`
    // - `src/app/layout.tsx`
    // - `src/app/page.tsx`
    // - `tailwind.config.ts`
    // ... etc
  }
}
```

### 5. AI Updates Files

The AI now knows to **update existing files** instead of creating new ones:

**User:** "Create a landing page with a hero section"

**AI Response:**
```typescript // src/app/page.tsx
// Updates the existing page.tsx instead of creating a new file
export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="h-screen flex items-center justify-center">
        <h1 className="text-6xl font-bold">Welcome</h1>
      </section>
    </main>
  );
}
```

## Key Benefits

### ✅ **Efficiency**
- AI doesn't recreate `package.json` every time
- Base configuration files remain consistent
- Less token usage (smaller prompts)

### ✅ **Context Awareness**
- AI knows what files already exist
- Can make surgical updates to specific files
- Avoids duplicate file creation

### ✅ **Better User Experience**
- Faster responses (AI focuses on what to change)
- More targeted code generation
- Cleaner chat messages

### ✅ **Consistency**
- All projects start from the same base template
- Configuration files are standardized
- Dependencies are pre-configured

## Example Workflows

### Scenario 1: New Project (First Prompt)

**Project created with base template:**
```
✅ package.json (with Next.js 15, React 19, etc.)
✅ src/app/layout.tsx (minimal root layout)
✅ src/app/page.tsx (placeholder)
✅ tailwind.config.ts
✅ tsconfig.json
```

**User:** "Create a modern landing page"

**AI receives:**
- List of 8 existing files
- Knows `src/app/page.tsx` exists

**AI does:**
```typescript // src/app/page.tsx
// Replaces the placeholder page.tsx with landing page
export default function Home() {
  return <main>Landing page content...</main>;
}
```

**Result:** 
- Updates 1 file (`page.tsx`)
- Creates 0 new files
- Base template preserved ✅

### Scenario 2: Adding Features

**User:** "Add a contact form component"

**AI receives:**
- Current files: `page.tsx`, `layout.tsx`, etc.
- Knows to create new component file

**AI does:**
```typescript // src/components/ContactForm.tsx
// Creates NEW file (doesn't exist in base template)
export default function ContactForm() {
  return <form>...</form>;
}
```

```typescript // src/app/page.tsx
// Updates EXISTING page to import the component
import ContactForm from '@/components/ContactForm';

export default function Home() {
  return (
    <main>
      <ContactForm />
    </main>
  );
}
```

**Result:**
- Creates 1 new file (`ContactForm.tsx`)
- Updates 1 existing file (`page.tsx`)
- Smart file management ✅

### Scenario 3: Adding Dependencies

**User:** "Add Framer Motion animations"

**AI receives:**
- Sees existing `package.json`
- Knows it needs to update dependencies

**AI does:**
```json // package.json
{
  "name": "craft-project",
  "dependencies": {
    "react": "^19.0.0",
    "next": "^15.1.3",
    "framer-motion": "^11.0.0"  // ← Added new dependency
  }
}
```

**Result:**
- Updates `package.json` with new dependency
- E2B sandbox automatically runs `npm install`
- Animations work ✅

## Technical Implementation

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PROJECT CREATION                                         │
│    getMinimalNextJsTemplate() → Database                   │
│    Files stored in project.files JSON field                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PROJECT OPENED                                           │
│    CodingInterface loads files from API                     │
│    setProjectFiles({ "page.tsx": "...", ... })             │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. USER SENDS MESSAGE                                       │
│    ChatPanel receives projectFiles prop                     │
│    Sends to /api/chat with projectFiles                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. AI RECEIVES CONTEXT                                      │
│    getCodingSystemPrompt(projectFiles)                      │
│    Generates file list in system prompt                     │
│    AI knows what files exist                                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. AI GENERATES CODE                                        │
│    Updates existing files (same path → replace)             │
│    Creates new files (new path → create)                    │
│    Returns code blocks with file paths                      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. FILES SAVED                                              │
│    ChatPanel extracts code blocks                           │
│    Saves to database (replaces or creates)                  │
│    Updates projectFiles state                               │
│    E2B sandbox receives updated files                       │
└─────────────────────────────────────────────────────────────┘
```

### Code Changes

#### 1. ChatPanel - Accept and Send Files

```typescript
interface ChatPanelProps {
  projectFiles?: Record<string, string>; // ← New prop
}

// Send to API
body: JSON.stringify({
  messages: [...messages, userMessage],
  taskType: "coding",
  projectFiles, // ← Include existing files
})
```

#### 2. Chat API - Receive Files

```typescript
export async function POST(req: Request) {
  const { messages, taskType, projectFiles } = await req.json(); // ← Extract files
  
  const systemPrompt = getSystemPrompt(taskType, projectFiles); // ← Pass to prompt
  
  if (projectFiles && Object.keys(projectFiles).length > 0) {
    console.log(`📁 Context: ${Object.keys(projectFiles).length} existing files`);
  }
}
```

#### 3. System Prompts - Include File Context

```typescript
export function getCodingSystemPrompt(projectFiles?: Record<string, string>) {
  let existingFilesContext = "";
  
  if (projectFiles && Object.keys(projectFiles).length > 0) {
    const fileList = Object.keys(projectFiles).sort();
    
    existingFilesContext = `
## Current Project Files (${fileList.length} files loaded)

${fileList.map(filepath => `- \`${filepath}\``).join('\n')}

**How to work with existing files:**
1. To UPDATE: Create code block with SAME file path
2. To CREATE: Use NEW file path
    `;
  }
  
  // Include in prompt
  return `... ${existingFilesContext} ...`;
}
```

## AI Prompt Changes

### Before

```
## Base Template Files

Every project has these files:
- package.json
- src/app/page.tsx
- ...

You can modify these files...
```

**Problem:** AI doesn't know if files actually exist or what they contain.

### After

```
## Current Project Files (8 files loaded)

The project ALREADY HAS these files saved:

- `next.config.ts`
- `package.json`
- `postcss.config.mjs`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `tailwind.config.ts`
- `tsconfig.json`

**How to work with existing files:**

1. To UPDATE an existing file:
   ```typescript // src/app/page.tsx
   // This will REPLACE the existing file
   ```

2. To CREATE a new file:
   ```typescript // src/components/NewComponent.tsx
   // This will CREATE a new file
   ```
```

**Benefit:** AI has exact file list and knows how to update vs create.

## Edge Cases Handled

### 1. Empty Project (Shouldn't Happen)

If somehow `projectFiles` is empty:
```typescript
existingFilesContext = `
## Project Status

This is a NEW project with the base Next.js template. 
You'll be creating the initial files.
`;
```

### 2. Partial File Updates

AI can update just one file without affecting others:
```typescript
// Update only page.tsx
// All other files (layout.tsx, package.json, etc.) remain unchanged
```

### 3. Multiple File Updates

AI can update multiple files in one response:
```typescript
// Update page.tsx
```typescript // src/app/page.tsx
...
```

// Update layout.tsx
```typescript // src/app/layout.tsx
...
```

// Create new component
```typescript // src/components/Hero.tsx
...
```
```

## Testing

### Test 1: New Project First Message

```
1. Create project ✓
2. Base template saved (8 files) ✓
3. Open project
4. Files loaded into state ✓
5. Send message "Create a landing page"
6. AI receives file list ✓
7. AI updates page.tsx (not creates new) ✓
8. Preview shows updated page ✓
```

### Test 2: Subsequent Updates

```
1. Project has 10 files ✓
2. Send message "Add a navbar"
3. AI sees existing files ✓
4. AI creates components/Navbar.tsx ✓
5. AI updates layout.tsx to include navbar ✓
6. Files saved correctly ✓
```

### Test 3: Dependency Addition

```
1. Send "Add Framer Motion"
2. AI sees existing package.json ✓
3. AI updates package.json with new dep ✓
4. E2B installs dependency ✓
5. Can use framer-motion in code ✓
```

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **File awareness** | AI guesses what exists | AI knows exact files |
| **Updates** | May recreate files | Surgical updates |
| **Efficiency** | Regenerates configs | Reuses base template |
| **Consistency** | Varies per request | Standardized base |
| **Token usage** | Higher (regenerating) | Lower (targeted) |
| **User experience** | Slower, inconsistent | Faster, predictable |

## Files Modified

1. `src/lib/ai/system-prompts.ts` - Added projectFiles parameter, builds file list context
2. `src/app/api/chat/route.ts` - Accepts projectFiles, passes to system prompt
3. `src/components/coding-interface/ChatPanel.tsx` - Accepts and sends projectFiles
4. `src/components/CodingInterface.tsx` - Passes projectFiles to ChatPanel

## Future Enhancements

- [ ] Show file diff in chat (what changed)
- [ ] Allow AI to request specific file contents
- [ ] File tree view in chat UI
- [ ] Undo/redo for file changes
- [ ] AI can suggest file structure improvements
