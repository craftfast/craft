# Sandbox Template Loading Fix

## Problem

The sandbox was loading the default Next.js template instead of waiting for AI to generate files.

### Root Cause

When a project was created, the system automatically saved the **entire Next.js template** to the database:

```typescript
// ❌ OLD: Project creation saved full template immediately
const templateFiles = getNextJsTemplate(); // 15+ files
const project = await prisma.project.create({
  data: {
    files: templateFiles, // Full template saved to DB
  },
});
```

**Flow:**

1. User creates project → Full template (15+ files) saved to database
2. AI starts generating files → Database already has complete template
3. Sandbox loads → Fetches files from database → Gets default template files
4. Result: User sees default template, not AI-generated code

## Solution

### Hybrid Approach: Minimal Base Template + AI Customization

**File:** `src/app/api/projects/route.ts`

```typescript
// ✅ NEW: Minimal base template, AI customizes everything
import { getMinimalNextJsTemplate } from "@/lib/templates/nextjs";

const baseTemplate = getMinimalNextJsTemplate(); // Only 4 essential files
const project = await prisma.project.create({
  data: {
    files: baseTemplate, // Minimal template for sandbox compatibility
  },
});
```

**Base Template Includes (4 files only):**

1. `package.json` - Required dependencies for Next.js to run
2. `tsconfig.json` - TypeScript configuration
3. `src/app/layout.tsx` - Minimal root layout
4. `src/app/page.tsx` - Simple placeholder page

**New Flow:**

1. User creates project → Minimal template (4 files) in database
2. AI receives base template as context
3. AI modifies/replaces page.tsx and creates new files
4. Preview panel waits for AI to finish
5. Sandbox loads → Gets AI-customized code
6. Result: User sees AI's creation with working Next.js setup ✅

## How It Works Now

### 1. Project Creation

- Creates project with **minimal base template** (4 essential files)
- Includes package.json with all required Next.js dependencies
- Provides working TypeScript and layout structure
- Simple placeholder page ready for AI to replace

### 2. AI File Generation

- AI receives project description
- AI is **informed about base template** in system prompt
- AI can:
  - ✅ Modify existing files (like page.tsx)
  - ✅ Create new components, pages, APIs
  - ✅ Add new dependencies to package.json if needed
  - ✅ Override any base template file
- Each change is saved to database via `/api/files`

### 3. AI System Prompt Context

The AI is told:

```
## Base Template Files

Every project starts with these essential files (you can modify or extend them):

**package.json** - Contains Next.js 15, React 19, TypeScript 5
**tsconfig.json** - TypeScript configuration
**src/app/layout.tsx** - Root layout (minimal, ready to customize)
**src/app/page.tsx** - Home page (simple placeholder, ready to replace)

**IMPORTANT:**
- ✅ You can modify ANY of these files to match the user's requirements
- ✅ The package.json has all necessary dependencies - just edit the code
- ✅ Create additional files as needed (components, pages, APIs, etc.)
```

This ensures AI knows it can modify the base files freely.

### 4. Preview Auto-Start

The `PreviewPanel` component already has smart logic:

```typescript
const shouldAutoStart =
  sandboxStatus === "inactive" &&
  Object.keys(projectFiles).length > 0 &&
  !isGeneratingFiles; // ✅ Waits for AI to finish

if (shouldAutoStart) {
  startSandbox(); // Auto-starts when files are ready
}
```

**Conditions:**

- ✅ Sandbox not running
- ✅ Files exist in database (base template + AI additions)
- ✅ AI finished generating/modifying files

### 5. Sandbox Creation

- Fetches files from database (base template + AI modifications)
- Deploys to E2B sandbox
- Runs `npm install` (dependencies from package.json)
- Starts Next.js dev server
- Shows live preview of AI's work

## Benefits

✅ **Working Sandbox**: package.json ensures Next.js runs properly
✅ **AI Freedom**: AI can modify any file or create new ones
✅ **No Template Pollution**: Base template is minimal (4 files vs 15+)
✅ **Proper Context**: AI knows what it's working with
✅ **Fast Setup**: Essential configs pre-configured
✅ **Automatic**: Preview starts when AI finishes
✅ **Flexible**: Works for any Next.js project type

## Testing

### Create a New Project

1. Click "New Project"
2. Enter description: "Create a simple counter app"
3. Click Create
4. **Expected:** 4 base template files in database
5. AI receives description and modifies page.tsx, creates components
6. Preview auto-starts with AI-customized code

### Verify Database

```sql
-- Check files field after project creation
SELECT id, name, files FROM projects WHERE id = 'xxx';

-- Should have 4 base files initially:
-- - package.json
-- - tsconfig.json
-- - src/app/layout.tsx
-- - src/app/page.tsx

-- Then AI adds/modifies files
```

## What Changed vs Previous Approaches

### Before (Full Template)

- ❌ 15+ template files saved
- ❌ AI had to work around existing files
- ❌ User saw default template first

### Attempt 1 (Empty Project)

- ❌ No files initially
- ❌ AI had to create package.json (often incomplete)
- ❌ Sandbox failed due to missing dependencies

### Current (Minimal Base Template)

- ✅ 4 essential files only
- ✅ Working package.json with all dependencies
- ✅ AI modifies/extends freely
- ✅ Sandbox works immediately
- ✅ User sees AI's customization from the start

## Migration Notes

### Existing Projects

- Projects created with full template will continue to work
- Consider adding "Reset to minimal template" option for cleanup
- Old projects have 15+ files, new ones have 4+ (base + AI additions)

### Template Service

- `src/lib/templates/nextjs.ts` exports two functions:
  - `getNextJsTemplate()` - Full template (15+ files) - kept for reference
  - `getMinimalNextJsTemplate()` - Minimal template (4 files) - **now used**
- Minimal template provides:
  - Complete package.json with all dependencies
  - TypeScript configuration
  - Basic app structure
  - Simple placeholder content for AI to replace

## Related Files

- `src/app/api/projects/route.ts` - Project creation with minimal template
- `src/lib/templates/nextjs.ts` - Minimal template definition
- `src/lib/ai/system-prompts.ts` - AI context about base template
- `src/components/coding-interface/PreviewPanel.tsx` - Auto-start logic
- `src/components/CodingInterface.tsx` - File generation tracking

## Summary

The fix ensures that:

1. Projects start with **minimal base template** (4 essential files)
2. Base template provides **working package.json** for sandbox compatibility
3. AI knows about base template and **modifies/extends freely**
4. Preview waits for AI completion then **auto-starts**
5. Sandbox loads **AI-customized code** with proper dependencies

This gives AI creative control while ensuring the sandbox environment works correctly with all required Next.js dependencies.
