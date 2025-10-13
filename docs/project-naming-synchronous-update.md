# Project Naming Synchronous Update

## Overview

Changed the project naming flow from asynchronous polling to synchronous API call during project creation.

## Changes Made

### 1. API Route (`src/app/api/projects/route.ts`)

#### Before:

- Created project with default "New Project" name
- Triggered background async function to generate name
- Client had to poll to get the updated name

#### After:

- Generates AI name **synchronously** before creating the project
- Returns the project with the final name immediately
- No need for client-side polling

**Key Changes:**

- Refactored `generateProjectName()` function:
  - Changed signature from `(projectId: string, description: string): Promise<void>` to `(description: string): Promise<string | null>`
  - Returns the generated name instead of updating the database
  - Removed database update logic from this function
- Modified POST endpoint:
  - Calls `generateProjectName()` synchronously if name is "New Project"
  - Uses the generated name when creating the project
  - Returns project with final name in the response

### 2. Coding Interface Component (`src/components/CodingInterface.tsx`)

#### Before:

- Used `useEffect` to poll for project name updates every 2 seconds
- Continued polling up to 30 times (60 seconds)
- Updated state when name changed

#### After:

- Removed all polling logic
- Removed `useEffect`, `useRef` imports (no longer needed)
- Project name is already final when component mounts

**Key Changes:**

- Removed state refs: `pollIntervalRef`, `pollCountRef`, `hasStartedPollingRef`
- Removed entire polling `useEffect` hook
- Cleaned up unused imports

### 3. Benefits

✅ **Simpler Architecture**: No complex polling logic
✅ **Better UX**: User sees the final project name immediately
✅ **Reduced API Calls**: One request instead of up to 30
✅ **Less Code**: Removed ~70 lines of polling logic
✅ **More Predictable**: Synchronous flow is easier to understand and debug

### 4. Tradeoffs

⚠️ **Longer Initial Load**: Project creation now waits for AI name generation (typically 2-3 seconds)

- This is acceptable because the user expects some processing time
- Still faster than waiting for multiple poll cycles

⚠️ **Error Handling**: If AI fails, user gets "New Project" name

- This is the same fallback behavior as before
- Logs indicate when AI generation fails

## Testing

To test the changes:

1. Create a new project with a description
2. Verify the project name is generated and appears immediately
3. Check that no polling occurs (check browser console)
4. Verify the project appears in the dashboard with the correct name

## Technical Details

### AI Name Generation Flow

```
User submits project →
API receives request →
Generate name via AI (if needed) →
Create project with final name →
Return project to client →
Client displays final name immediately
```

### Error Handling

The AI name generation has built-in fallbacks:

1. Try Grok model first
2. If Grok fails, fallback to Claude
3. If both fail, use "New Project" as default
4. All errors are logged for debugging

## Migration Notes

No database migration needed - this is purely a logic change.

Existing projects are unaffected - this only changes the creation flow for new projects.
