# Preview Auto-Update Fix

## Problem

The preview panel wasn't automatically updating when files were created or modified through the AI chat. Users had to manually click "Update Files" to see changes in the preview.

## Root Causes

1. **No automatic preview refresh**: When files were created via chat, the interface switched to the Code tab instead of Preview
2. **Manual update required**: The PreviewPanel had code to detect file changes but only logged a message instead of auto-updating
3. **No iframe refresh**: Even when files were updated in the sandbox, the iframe wasn't being refreshed to show the changes

## Changes Made

### 1. CodingInterface.tsx

**Auto-switch to Preview tab after file creation:**

```typescript
// Changed from setActiveTab("code") to setActiveTab("preview")
setActiveTab("preview");
```

**Better file loading logging:**

- Added detailed logging when files are loaded on mount
- Shows file list when files are present

### 2. PreviewPanel.tsx

**Automatic preview updates:**

```typescript
// Changed from just logging to actually updating
useEffect(() => {
  const updatePreview = async () => {
    if (sandboxStatus === "running" && Object.keys(projectFiles).length > 0) {
      console.log(
        `📝 Project files updated (${
          Object.keys(projectFiles).length
        } files), auto-updating preview...`
      );
      await updateSandboxFiles();
    }
  };
  updatePreview();
}, [projectFiles]);
```

**Force iframe refresh after update:**

```typescript
// Added iframe URL reset to force refresh
setIframeUrl("");
setTimeout(() => {
  setIframeUrl(previewUrl);
  setIsRefreshing(false);
}, 100);
```

### 3. Sandbox API Route

**Removed unnecessary npm install on every update:**

- Removed the automatic `npm install` that was running on every file update
- This was slowing down updates unnecessarily
- Dev servers (Vite, Next.js) hot-reload automatically anyway

**Better logging:**

- Added file list logging for debugging
- Added detection of project type (Node.js vs static HTML)

## How It Works Now

1. **User creates files via AI chat** → Files are saved to database
2. **CodingInterface updates projectFiles state** → Triggers re-render
3. **Interface switches to Preview tab** → User sees preview immediately
4. **PreviewPanel detects projectFiles change** → Auto-triggers updateSandboxFiles()
5. **Files are sent to sandbox** → Sandbox writes files to filesystem
6. **Iframe is force-refreshed** → User sees updated preview

## User Experience Improvements

✅ **Automatic updates**: No need to manually click "Update Files"  
✅ **Immediate feedback**: Preview shows right after file creation  
✅ **Faster updates**: Removed unnecessary npm install on every update  
✅ **Better visibility**: Console logs show what's happening

## Testing

To test the fix:

1. Start a new chat and ask AI to create a simple HTML file
2. Watch the preview panel - it should:
   - Automatically switch to Preview tab
   - Show the new content without manual intervention
3. Ask AI to modify the file
4. Preview should auto-update with the changes

## Notes

- The auto-update happens when the sandbox is already running
- If sandbox hasn't been started yet, user still needs to click "Start Preview"
- This is intentional to avoid starting expensive sandbox resources unnecessarily
