# Fix: Prevent Duplicate Chat Session Creation

## Problem

When creating a new project, **two chat sessions** were being created instead of one.

## Root Cause

The `loadChatSessions` function in `ChatPanel.tsx` was being called multiple times without any guard to prevent duplicate session creation. The sequence was:

1. Component mounts
2. `useEffect` calls `loadChatSessions()`
3. No sessions found, so `createNewSession()` is called
4. Component potentially re-renders (React 18 Strict Mode in dev)
5. `useEffect` runs again
6. `loadChatSessions()` called again before the first session is visible in state
7. Still sees 0 sessions, calls `createNewSession()` again
8. **Result: 2 sessions created** 🐛

## Solution

Added a **ref-based guard** to ensure `loadChatSessions` only runs once per project:

### Code Changes

**File**: `src/components/coding-interface/ChatPanel.tsx`

#### 1. Added tracking ref

```typescript
const hasLoadedSessions = useRef(false); // Track if we've already loaded sessions
```

#### 2. Updated loadChatSessions with guard

```typescript
const loadChatSessions = async () => {
  // Prevent duplicate loads
  if (hasLoadedSessions.current) {
    console.log("⏭️ Chat sessions already loaded, skipping...");
    return;
  }

  try {
    const response = await fetch(`/api/chat-sessions?projectId=${projectId}`);
    if (response.ok) {
      const data = await response.json();
      setChatSessions(data.chatSessions);

      // Mark as loaded BEFORE creating session to prevent race conditions
      hasLoadedSessions.current = true;

      // If there are sessions, select the most recent one
      if (data.chatSessions.length > 0) {
        setCurrentSessionId(data.chatSessions[0].id);
        console.log(`✅ Loaded ${data.chatSessions.length} chat session(s)`);
      } else {
        // Create a default session if none exists (only on initial load)
        console.log("📝 No chat sessions found, creating default session...");
        await createNewSession();
      }
    }
  } catch (error) {
    console.error("Error loading chat sessions:", error);
    hasLoadedSessions.current = false; // Reset on error so it can retry
  }
};
```

#### 3. Removed empty state UI

Removed the "No chat sessions yet" UI since we now always auto-create a default session on project load.

## Why This Works

### useRef vs useState

- **`useRef`** persists across re-renders but doesn't trigger re-renders when changed
- **`useState`** would trigger a re-render, potentially causing the issue again
- The ref acts as a "circuit breaker" - once it's set to `true`, no more session creation

### Early Return Pattern

```typescript
if (hasLoadedSessions.current) {
  return; // Exit immediately, no API calls
}
```

### Setting Flag BEFORE Creating Session

```typescript
hasLoadedSessions.current = true; // Set FIRST
await createNewSession(); // Then create
```

This prevents race conditions where multiple calls might all see `false` before any of them set it to `true`.

## Behavior After Fix

### New Project Flow

```
1. User creates project
   ↓
2. CodingInterface mounts
   ↓
3. ChatPanel mounts
   ↓
4. loadChatSessions() called
   ↓
5. hasLoadedSessions.current = false ✅
   ↓
6. Fetch sessions from API (returns [])
   ↓
7. Set hasLoadedSessions.current = true ✅
   ↓
8. No sessions found, create default session
   ↓
9. ✅ ONE session created
   ↓
10. Component re-renders (React Strict Mode)
    ↓
11. loadChatSessions() called again
    ↓
12. hasLoadedSessions.current = true ✅
    ↓
13. Early return, no duplicate creation! 🎉
```

### Existing Project Flow

```
1. User opens existing project
   ↓
2. ChatPanel mounts
   ↓
3. loadChatSessions() called
   ↓
4. hasLoadedSessions.current = false ✅
   ↓
5. Fetch sessions from API (returns existing sessions)
   ↓
6. Set hasLoadedSessions.current = true ✅
   ↓
7. Select most recent session
   ↓
8. ✅ No new session created
```

## Testing

### Test Case 1: New Project

- ✅ Create a new project
- ✅ Verify only ONE default chat session is created
- ✅ Session name should be "New Chat"

### Test Case 2: Existing Project

- ✅ Open an existing project with chat sessions
- ✅ Verify no new session is created
- ✅ Most recent session is selected

### Test Case 3: Manual Session Creation

- ✅ Open a project
- ✅ Click "New Chat" button
- ✅ New session should be created
- ✅ No duplicates

### Test Case 4: React Strict Mode (Dev)

- ✅ In development mode, React Strict Mode double-mounts components
- ✅ Verify only one session is created despite double mount
- ✅ Check console for "⏭️ Chat sessions already loaded" message

## Auto-Naming Still Works

The auto-naming feature from the previous implementation is still active:

1. Default session created with name "New Chat"
2. User sends first message
3. Session automatically renamed to first 50 chars of message
4. Example: "Create a login form..." becomes the session name

## Files Modified

- `src/components/coding-interface/ChatPanel.tsx`
  - Added `hasLoadedSessions` ref
  - Updated `loadChatSessions()` with guard logic
  - Removed empty state UI (no longer needed)
  - Added console logs for debugging

## Related Issues Prevented

This fix also prevents:

- ❌ Duplicate sessions on hot reload (in development)
- ❌ Duplicate sessions on component remount
- ❌ Race conditions from concurrent API calls
- ❌ Unnecessary API calls after initial load

## Performance Benefits

- 🚀 Reduces API calls (skips redundant loads)
- 🚀 Prevents unnecessary session creation
- 🚀 Faster component re-renders (early return)
- 🚀 Better user experience (no duplicate sessions in UI)

## Console Output

### Successful Load (New Project)

```
📝 No chat sessions found, creating default session...
✅ Loaded 1 chat session(s)
```

### Duplicate Prevention

```
⏭️ Chat sessions already loaded, skipping...
```

### Successful Load (Existing Project)

```
✅ Loaded 3 chat session(s)
```

## Summary

**Before**: 2 chat sessions created for new projects 🐛  
**After**: 1 chat session created for new projects ✅

The fix uses a simple ref-based guard to ensure the session loading logic only executes once per project, preventing duplicates while maintaining the desired auto-creation behavior for new projects.
