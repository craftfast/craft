# Auto-Update Project Name Feature

## Overview

This feature automatically updates the project name in the chat interface when a user creates a new project for the first time. When a project is created with the default name "New Project", the system generates a better name using AI in the background, and the UI automatically reflects this change without requiring a page refresh.

## Implementation Details

### How It Works

1. **Project Creation Flow**:

   - User creates a new project with name "New Project" and a description
   - Backend creates the project immediately with "New Project" as the name
   - Backend triggers AI name generation in the background (fire-and-forget)
   - User is redirected to `/chat/[project-id]` page

2. **Automatic Name Update**:
   - The `CodingInterface` component detects when the project name is "New Project"
   - It starts polling the API every 2 seconds to check for name updates
   - When the AI-generated name is saved to the database, the next poll detects it
   - The UI automatically updates to show the new project name
   - Polling stops after either:
     - The name is updated (no longer "New Project")
     - 30 polling attempts (60 seconds total)

### Code Changes

#### `src/components/CodingInterface.tsx`

**Added imports**:

```typescript
import { useState, useEffect, useRef } from "react";
```

**Added state and refs**:

```typescript
const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
const pollCountRef = useRef(0);
const hasStartedPollingRef = useRef(false); // Prevents re-polling
```

**Added polling effect**:

- Only runs once on component mount (empty dependency array)
- Monitors when initial `project.name === "New Project"`
- Polls `/api/projects/${projectId}` every 2 seconds
- Updates local project state when name changes
- Includes cleanup on component unmount
- Prevents re-polling when state updates via `hasStartedPollingRef`
- Enhanced console logs for debugging (🔄📡📊✅⏱️)

### User Experience

1. User creates a new project with a description
2. They are immediately taken to the chat interface
3. Initially, they see "New Project" in the header
4. Within a few seconds, the name smoothly updates to the AI-generated name
5. No page refresh or manual action required

### Performance Considerations

- **Polling Frequency**: 2 seconds (reasonable balance between responsiveness and server load)
- **Max Duration**: 60 seconds (30 polls × 2 seconds)
- **Automatic Cleanup**: Interval is cleared when component unmounts
- **Smart Detection**: Only polls when name is "New Project"

### API Endpoints Used

- **GET `/api/projects/[id]`**: Fetches current project data including the updated name

### Edge Cases Handled

1. **AI Generation Fails**: If name generation fails, polling stops after 60 seconds
2. **User Navigates Away**: Polling is cleaned up when component unmounts
3. **Already Named Project**: Polling never starts if project has a custom name
4. **Multiple Tabs**: Each tab polls independently (minimal impact)

## Testing

To test this feature:

1. Create a new project with a description
2. Observe the header in the chat interface
3. The project name should update automatically within 2-10 seconds
4. Check browser console for polling logs

## Future Improvements

Potential enhancements:

1. **WebSocket/SSE**: Replace polling with real-time updates for better efficiency
2. **Loading Indicator**: Show a subtle indicator while name is being generated
3. **Manual Override**: Allow users to manually refresh if needed
4. **Smarter Polling**: Use exponential backoff for reduced server load

## Related Files

- `src/components/CodingInterface.tsx` - Main implementation
- `src/app/api/projects/route.ts` - Project creation and name generation
- `src/app/api/projects/[id]/route.ts` - Project fetch endpoint
- `src/app/api/projects/generate-name/route.ts` - AI name generation endpoint
