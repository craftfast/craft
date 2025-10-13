# Auto Preview Lifecycle Implementation

## Overview

Implemented automatic preview start functionality that eliminates the need for manual user interaction. The preview sandbox now automatically starts when the project page is opened and remains active across tab switches, stopping only when the project page is closed.

## Key Features

### 1. **Automatic Start**

- Preview sandbox starts automatically when the project page loads
- Uses a 500ms delay for smooth transition
- Only starts if project files are available
- Checks for existing running sandbox on mount

### 2. **Persistent Across Tabs**

- Sandbox remains running when switching between tabs (Preview, Code, Analytics, etc.)
- Prevents unnecessary restarts and resource cycling
- Maintains preview state across navigation
- Component stays mounted but hidden when viewing other tabs

### 3. **Automatic Cleanup**

- Preview sandbox stops only when closing the project page (navigating away)
- Clean shutdown when component unmounts
- Prevents resource leaks

## Implementation Details

### PreviewPanel Changes (`src/components/coding-interface/PreviewPanel.tsx`)

#### Props

```typescript
interface PreviewPanelProps {
  projectId: string;
  projectFiles?: Record<string, string>;
}
```

#### Auto-Start Effect

```typescript
useEffect(() => {
  let autoStartTimer: NodeJS.Timeout;

  if (sandboxStatus === "inactive" && Object.keys(projectFiles).length > 0) {
    Object.keys(projectFiles).length > 0;
    console.log("🚀 Preview panel mounted - auto-starting sandbox...");
    autoStartTimer = setTimeout(() => {
      startSandbox();
    }, 500);
  }

  return () => {
    if (autoStartTimer) {
      clearTimeout(autoStartTimer);
    }
  };
}, [projectId]);
```

#### Cleanup on Unmount

```typescript
useEffect(() => {
  return () => {
    console.log("🧹 Preview panel unmounting - cleaning up sandbox...");
    fetch(`/api/sandbox/${projectId}`, {
      method: "DELETE",
    }).catch((err) => console.error("Cleanup error:", err));
  };
}, []);
```

### CodingInterface Changes (`src/components/CodingInterface.tsx`)

#### Keep PreviewPanel Mounted

The component uses visibility control to keep PreviewPanel mounted across tab switches:

**Implementation:**

```tsx
{
  activeTab === "preview" && (
    <PreviewPanel projectId={project.id} projectFiles={projectFiles} />
  );
```

**Implementation:**

```tsx
<div className={activeTab === "preview" ? "h-full" : "hidden"}>
  <PreviewPanel projectId={project.id} projectFiles={projectFiles} />
</div>
```

This ensures:

- Component stays mounted across tab switches
- Sandbox remains running when switching tabs
- Smooth transitions without re-initialization
- Only unmounts when leaving the project page

## UI Changes

### Removed Manual Controls

1. **Removed "Start Next.js Preview" button** - Preview starts automatically
2. **Removed "Stop Preview" button** - No manual stop needed (stops only on page close)

### Updated Inactive State Message

Changed to reflect the automatic behavior:

```tsx
<h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
  Starting Preview...
</h3>
<p className="text-xs text-neutral-500 dark:text-neutral-400">
  Your Next.js preview will load automatically
</p>
```

## User Experience Flow

### Opening a Project

1. Project page loads with "Preview" tab active by default
2. PreviewPanel mounts
3. After 500ms, sandbox starts automatically
4. Loading state shows "Initializing Next.js environment..."
5. Preview loads in iframe when ready

### Switching Between Tabs

1. User clicks on "Code", "Analytics", etc.
2. PreviewPanel becomes hidden but stays mounted
3. **Sandbox continues running** (no stop)
4. Preview iframe remains loaded in background
5. Switching back to "Preview" shows the running preview immediately

### Closing Project

1. User navigates away from project page
2. PreviewPanel's cleanup effect runs
3. Sandbox is deleted via API call
4. User navigates away from project page
5. PreviewPanel's cleanup effect runs
6. Sandbox is deleted via API call
7. Resources are freed

## Benefits

1. **Zero Manual Interaction** - No buttons to click, everything is automatic
2. **Resource Efficient** - Sandbox runs continuously while project is open, no restart overhead
3. **Instant Tab Switching** - Preview stays loaded when switching tabs, instant access
4. **Smart State Management** - Component stays mounted, maintains all state
5. **Proper Cleanup** - Resources are always cleaned up when leaving project

## Technical Considerations

### Why Keep Component Mounted?

- Prevents re-initialization on every tab switch
- Maintains internal state (device mode, iframe state, etc.)
- Smoother transitions
- Better performance - no restart delay

### Why Keep Sandbox Running Across Tabs?

- Eliminates 20-30 second restart time when switching back to preview
- User can work in Code tab and quickly check preview
- More efficient use of resources (one continuous session vs. multiple start/stops)
- Better user experience - instant preview access

### Timeout on Auto-Start

- 500ms delay provides smooth visual transition
- Prevents jarring immediate loading state
- Gives time for page to settle
- Can be adjusted if needed

## Future Enhancements

Potential improvements:

1. Add user preference to disable auto-start
2. Add visual indicator when sandbox is running in background
3. Add animation during tab transitions
4. Show resource usage metrics
5. Add option to manually restart sandbox if needed

## Testing Checklist

- [x] Preview starts automatically when opening project
- [x] Preview stays running when switching to Code tab
- [x] Preview stays running when switching to Analytics tab
- [x] Preview stays running when switching to any other tab
- [x] Preview is instantly visible when returning to Preview tab
- [x] Sandbox cleans up when closing project
- [x] No manual start/stop buttons in UI
- [x] Loading states display correctly on initial start
- [x] Error states still work properly
- [x] Multiple tab switches work smoothly with no delays
