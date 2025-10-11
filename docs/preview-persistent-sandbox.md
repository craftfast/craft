# Preview Lifecycle - Updated Behavior

## Summary of Changes

The preview sandbox lifecycle has been updated to provide a better user experience by keeping the sandbox running while you work on your project.

## New Behavior

### ✅ Sandbox Stays Active Across Tabs

- **Opens automatically** when you open a project
- **Stays running** when you switch between tabs (Preview, Code, Analytics, Logs, etc.)
- **Stops only** when you close the project or navigate away

### Benefits

1. **Instant Preview Access** - No 20-30 second wait when switching back to Preview tab
2. **Better Workflow** - Edit code, instantly check preview, repeat
3. **Single Session** - One sandbox session per project visit instead of multiple restarts
4. **Resource Efficient** - Avoids unnecessary start/stop cycles

## User Experience

```
Opening Project
    ↓
Preview starts (500ms delay)
    ↓
[20-30 seconds loading]
    ↓
Preview Running ✓
    ↓
Switch to Code tab → Preview keeps running in background
    ↓
Switch to Preview tab → Instantly visible (no loading!)
    ↓
Switch to Analytics tab → Preview keeps running
    ↓
Switch to Preview tab → Instantly visible!
    ↓
Close project → Sandbox stops and cleans up
```

## Implementation

### PreviewPanel Component

```typescript
// Auto-starts on mount
useEffect(() => {
  if (sandboxStatus === "inactive" && Object.keys(projectFiles).length > 0) {
    setTimeout(() => startSandbox(), 500);
  }
}, [projectId]);

// Cleans up only on unmount (leaving project)
useEffect(() => {
  return () => {
    fetch(`/api/sandbox/${projectId}`, { method: "DELETE" });
  };
}, []);
```

### CodingInterface Component

```tsx
{
  /* Component stays mounted, just hidden when not active */
}
<div className={activeTab === "preview" ? "h-full" : "hidden"}>
  <PreviewPanel projectId={project.id} projectFiles={projectFiles} />
</div>;
```

## Comparison: Before vs After

### Before (Auto Start/Stop on Tab Switch)

```
Open Project → Start Sandbox (30s) → Preview ✓
Switch to Code → Stop Sandbox
Switch to Preview → Start Sandbox (30s) → Preview ✓
Switch to Analytics → Stop Sandbox
Switch to Preview → Start Sandbox (30s) → Preview ✓
```

**Problems:**

- ❌ Long waits every time you return to preview
- ❌ Constant starting/stopping wastes resources
- ❌ Interrupts workflow

### After (Persistent Sandbox)

```
Open Project → Start Sandbox (30s) → Preview ✓
Switch to Code → Preview keeps running
Switch to Preview → Instant! ✓
Switch to Analytics → Preview keeps running
Switch to Preview → Instant! ✓
Close Project → Stop Sandbox
```

**Benefits:**

- ✅ Only one 30-second wait per project session
- ✅ Instant preview access when switching tabs
- ✅ Better resource management (one session instead of many)
- ✅ Smoother workflow

## Technical Details

### Component Lifecycle

1. **Mount** (Project Opens)

   - PreviewPanel mounts
   - Checks for existing sandbox
   - Starts new sandbox if none exists (500ms delay)

2. **Tab Switching**

   - Component visibility changes (`h-full` ↔ `hidden`)
   - Component stays mounted
   - Sandbox keeps running
   - Iframe stays loaded

3. **Unmount** (Project Closes)
   - User navigates away from project
   - Cleanup effect triggers
   - DELETE request sent to sandbox API
   - Resources freed

### Why This Approach?

- **User Perspective**: Switching tabs should be instant, not trigger 30-second loading
- **Developer Workflow**: Common pattern is to edit code and quickly check preview
- **Resource Management**: One continuous session is more efficient than multiple restarts
- **State Preservation**: Maintains preview state, scroll position, etc.

## Files Modified

- `src/components/coding-interface/PreviewPanel.tsx` - Removed auto-stop on tab switch
- `src/components/CodingInterface.tsx` - Keep PreviewPanel mounted across tabs
- `docs/auto-preview-lifecycle.md` - Updated documentation

## Migration Notes

If you were relying on the sandbox stopping when switching tabs (for testing, etc.), note that:

- Sandbox now stays active until you close the project
- You can still check running sandboxes via the API
- Resource cleanup still happens automatically on project close
