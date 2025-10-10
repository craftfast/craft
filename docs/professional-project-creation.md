# Professional Project Creation System

## Overview

This document outlines the standardized, professional project creation workflow that:

1. Creates a Next.js template using `create-next-app` standards
2. Allows AI to edit code based on user requirements
3. Runs edited code in an E2B sandbox
4. Saves all code changes to the database for future reference

## Architecture

### 1. Project Creation Flow

```
User Input (Description)
         ↓
  Generate Project Name (AI)
         ↓
  Create Database Entry
         ↓
  Initialize Standard Next.js Template
         ↓
  Save Template to Database
         ↓
  Redirect to Coding Interface
         ↓
  AI Auto-sends First Prompt
         ↓
  AI Edits Code Based on Requirements
         ↓
  Code Synced to Database
         ↓
  Code Deployed to E2B Sandbox
         ↓
  Preview Available + Files Saved
```

### 2. Standard Next.js Template

Every project starts with the same, production-ready Next.js template that mirrors `create-next-app@latest` with TypeScript and Tailwind CSS.

**Template Structure:**

```
project-root/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles with Tailwind
├── public/
│   └── (static assets)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind configuration
├── postcss.config.mjs      # PostCSS configuration
└── next.config.ts          # Next.js configuration
```

## Implementation Details

### Phase 1: Database Schema Enhancement

The `Project` model already supports file storage via the `files` JSON field:

```prisma
model Project {
  id           String        @id @default(cuid())
  name         String
  description  String?
  type         String        @default("document")
  status       String        @default("active")
  userId       String
  files        Json          @default("{}")  // Stores all project files
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  chatSessions ChatSession[]
}
```

**Files Structure:**

```json
{
  "app/layout.tsx": "file content here...",
  "app/page.tsx": "file content here...",
  "app/globals.css": "file content here...",
  "package.json": "file content here...",
  "tsconfig.json": "file content here...",
  "tailwind.config.ts": "file content here...",
  "postcss.config.mjs": "file content here...",
  "next.config.ts": "file content here..."
}
```

### Phase 2: Template Generation Service

**Location:** `src/lib/templates/nextjs.ts`

This service provides the standard Next.js template that all projects start with.

**Features:**

- Consistent file structure across all projects
- TypeScript + Tailwind CSS by default
- Production-ready configuration
- Easy to update globally

### Phase 3: Enhanced Project API

**Location:** `src/app/api/projects/route.ts`

**POST /api/projects** - Enhanced to:

1. Generate AI project name
2. Create project in database
3. Initialize with standard Next.js template
4. Save template files to database
5. Return project with files

### Phase 4: AI Code Editing Integration

**Location:** `src/app/api/chat/route.ts`

The AI chat already:

- Receives user prompts
- Generates code based on requirements
- Returns code in structured format

**Enhancement:** Ensure code changes are properly formatted for file storage.

### Phase 5: File Synchronization

**Location:** `src/app/api/files/route.ts`

**POST /api/files** - Save/Update files:

```typescript
{
  projectId: string,
  files: {
    [filepath]: content
  }
}
```

**GET /api/files?projectId=xxx** - Retrieve project files

**Features:**

- Incremental updates (only changed files)
- Full project snapshots
- Version history (future)
- Conflict resolution

### Phase 6: Sandbox Deployment

**Location:** `src/app/api/sandbox/[projectId]/route.ts`

Already implemented:

- Creates E2B sandbox with project files
- Runs Next.js dev server
- Auto-updates on file changes
- Provides live preview URL

**Enhancement:** Ensure files are always synced from database first.

## User Experience Flow

### 1. Creating a Project

```
User: "Create a modern landing page with hero section and pricing"
  ↓
System generates name: "Modern Landing Page"
  ↓
Creates project with standard Next.js template
  ↓
Saves to database with template files
  ↓
Redirects to /chat/[project-id]
```

### 2. AI Editing Phase

```
AI receives initial prompt automatically
  ↓
"I'll create a modern landing page with hero section and pricing..."
  ↓
AI generates/modifies files:
  - app/page.tsx (landing page)
  - app/components/Hero.tsx
  - app/components/Pricing.tsx
  - app/globals.css (updated styles)
  ↓
Files saved to database immediately
  ↓
User sees file tree update in real-time
```

### 3. Preview Phase

```
User clicks "Start Preview"
  ↓
System fetches latest files from database
  ↓
Creates/updates E2B sandbox with files
  ↓
Installs dependencies (first time only)
  ↓
Starts Next.js dev server
  ↓
Returns preview URL
  ↓
User sees live preview in iframe
```

### 4. Continuous Editing

```
User: "Make the hero section more colorful"
  ↓
AI edits app/page.tsx and app/globals.css
  ↓
Changes saved to database
  ↓
File tree updates in UI
  ↓
Sandbox auto-detects changes via HMR
  ↓
Preview updates automatically
```

## Benefits

### For Users

- **Consistent Experience**: Every project starts the same way
- **Professional Output**: Production-ready code from the start
- **No Setup Time**: Skip the `npx create-next-app` process
- **AI-Powered Editing**: Let AI handle the code
- **Instant Previews**: See changes immediately
- **Persistent Storage**: All code saved automatically

### For Developers

- **Standardization**: One template to maintain
- **Scalability**: Easy to update all future projects
- **Modularity**: Clear separation of concerns
- **Testability**: Predictable file structure
- **Extensibility**: Easy to add more templates

## Technical Considerations

### Performance

1. **Initial Load**: Template generation is instant (pre-defined)
2. **AI Generation**: Parallel name generation during project creation
3. **Database Writes**: Batch file updates when possible
4. **Sandbox Creation**: ~10-15 seconds for first deployment
5. **HMR Updates**: Instant file updates via Next.js HMR

### Scalability

1. **File Storage**: JSON field supports up to ~1MB per project (sufficient for most projects)
2. **Sandbox Limits**: E2B provides 100 hours/month free tier
3. **Database Size**: Monitor file storage growth, consider file compression
4. **API Rate Limits**: Implement request throttling for AI calls

### Security

1. **Project Ownership**: All APIs verify project belongs to user
2. **Sandbox Isolation**: E2B provides containerized environments
3. **Code Injection**: Sanitize AI-generated code before saving
4. **File Paths**: Validate file paths to prevent directory traversal

## Migration Strategy

### For Existing Projects

1. **Detect Legacy Projects**: Projects without standardized file structure
2. **Offer Migration**: "Upgrade to new template" button
3. **Preserve Custom Code**: Merge existing files with template
4. **Backward Compatible**: Old projects continue to work

### Implementation Phases

**Phase 1 (Current)**:

- ✅ Database schema ready
- ✅ Sandbox API functional
- ✅ File sync system working

**Phase 2 (Next)**:

- 🔄 Create Next.js template service
- 🔄 Enhance project creation API
- 🔄 Integrate template initialization

**Phase 3 (Future)**:

- ⏳ Add more templates (React, Vue, Vanilla JS)
- ⏳ Implement version control
- ⏳ Add project export functionality

## Testing Checklist

- [ ] Create project with description
- [ ] Verify AI-generated name
- [ ] Confirm template files in database
- [ ] Check file structure in coding interface
- [ ] Test AI code editing
- [ ] Verify file sync to database
- [ ] Start sandbox preview
- [ ] Confirm files loaded correctly
- [ ] Test HMR on file changes
- [ ] Verify persistence after refresh

## Example API Calls

### Create Project

```bash
POST /api/projects
Content-Type: application/json

{
  "name": "New Project",
  "description": "A modern portfolio website with dark mode"
}

Response:
{
  "project": {
    "id": "abc123",
    "name": "Modern Portfolio Site",
    "description": "A modern portfolio website with dark mode",
    "files": {
      "app/layout.tsx": "...",
      "app/page.tsx": "...",
      // ... all template files
    }
  }
}
```

### Save Files

```bash
POST /api/files
Content-Type: application/json

{
  "projectId": "abc123",
  "files": {
    "app/page.tsx": "updated content...",
    "app/components/Hero.tsx": "new file..."
  }
}
```

### Get Files

```bash
GET /api/files?projectId=abc123

Response:
{
  "files": {
    "app/layout.tsx": "...",
    "app/page.tsx": "...",
    "app/components/Hero.tsx": "..."
  }
}
```

### Start Preview

```bash
POST /api/sandbox/abc123
Content-Type: application/json

{
  "files": {
    // Files automatically fetched from database
  }
}

Response:
{
  "sandboxId": "abc123",
  "url": "https://sandbox-abc123.e2b.dev",
  "status": "running"
}
```

## Future Enhancements

1. **Multiple Templates**: React, Vue, Svelte, Vanilla JS
2. **Template Marketplace**: Community-contributed templates
3. **Version Control**: Git-like commit history
4. **Branching**: Experiment with different approaches
5. **Collaboration**: Multiple users on same project
6. **Export**: Download project as ZIP
7. **Deploy**: One-click deploy to Vercel/Netlify
8. **Analytics**: Track popular templates and patterns

---

**Status**: Ready for Implementation  
**Priority**: High  
**Complexity**: Medium  
**Estimated Time**: 4-6 hours
