# Preview Panel File Synchronization

## Overview

Enhanced the PreviewPanel component to ensure it displays previews based on the actual project files stored in the database and provides better file synchronization with the E2B sandbox.

## Changes Made

### 1. PreviewPanel Component (`src/components/coding-interface/PreviewPanel.tsx`)

#### Added Features:

1. **File Update Detection**
   - Added a `useEffect` hook that monitors changes to `projectFiles` prop
   - Logs when files change so users are aware updates are available
2. **Update Files Functionality**
   - New `updateSandboxFiles()` function that:
     - Fetches the latest files from the database
     - Sends updated files to the sandbox API
     - Refreshes the preview iframe to show changes
3. **Manual Update Button**

   - Added "Update Files" button in the toolbar
   - Located next to the refresh button
   - Only enabled when sandbox is running
   - Shows "Updating..." state while processing

4. **Improved File Loading**
   - Enhanced `startSandbox()` to prioritize database files
   - Falls back to `projectFiles` prop if API doesn't return files
   - Better logging of file counts for debugging

### 2. Sandbox API (`src/app/api/sandbox/[projectId]/route.ts`)

#### Enhanced File Update Logic:

1. **Smart Sandbox Reuse**
   - When sandbox already exists, now checks if files are provided
   - If files are provided, updates them in the running sandbox
   - Avoids unnecessary sandbox recreation
2. **Automatic Dependency Management**

   - Detects if `package.json` was updated
   - Automatically runs `npm install` when dependencies change
   - Ensures packages are always in sync with project files

3. **Better File Writing**
   - Writes all provided files to the sandbox
   - Normalizes file paths properly
   - Handles both absolute and relative paths

## How It Works

### Workflow

1. **Initial Preview Start**

   ```
   User clicks "Start Preview"
   ↓
   PreviewPanel fetches files from /api/files?projectId=...
   ↓
   Sends files to /api/sandbox/[projectId] (POST)
   ↓
   Sandbox creates or reuses environment
   ↓
   Writes all files to sandbox
   ↓
   Returns preview URL
   ↓
   User sees live preview
   ```

2. **File Updates During Session**
   ```
   AI creates/modifies files via ChatPanel
   ↓
   Files saved to database via /api/files
   ↓
   CodingInterface updates projectFiles state
   ↓
   PreviewPanel receives updated projectFiles prop
   ↓
   Console logs "files updated" message
   ↓
   User clicks "Update Files" button when ready
   ↓
   PreviewPanel fetches latest from database
   ↓
   Sends updated files to existing sandbox
   ↓
   Sandbox writes new/modified files
   ↓
   Preview iframe refreshes automatically
   ↓
   User sees updated app
   ```

### File Sources Priority

The PreviewPanel uses this priority for loading files:

1. **Database** (via `/api/files?projectId=...`) - Most reliable, always up-to-date
2. **Props** (`projectFiles` from CodingInterface) - Fallback if API fails
3. **Empty Object** - If neither available, shows default preview page

## User Interface

### Preview Toolbar Buttons

| Button           | Icon        | Function                                | When Enabled    |
| ---------------- | ----------- | --------------------------------------- | --------------- |
| **Refresh**      | ↻           | Reloads iframe without updating files   | Sandbox running |
| **Update Files** | Text button | Fetches & updates files, then refreshes | Sandbox running |

### Button States

- **Update Files** button:
  - Normal: "Update Files"
  - During update: "Updating..."
  - Disabled when: sandbox not running or already updating

## Benefits

### For Users

1. **Accurate Previews** - Always shows the actual project files from database
2. **Manual Control** - Users decide when to update (won't interrupt their work)
3. **Clear Feedback** - Console logs and button states show what's happening
4. **Fast Updates** - Reuses existing sandbox, just updates files

### For Developers

1. **Better Debugging** - Console logs show file counts and update status
2. **Reliable State** - Always syncs with database as source of truth
3. **Error Resilience** - Falls back to props if API fails
4. **Performance** - Only updates files, doesn't recreate sandbox

## Console Messages

Users will see these helpful logs:

```javascript
// When preview starts
"📁 Loaded 5 files for preview"; // From database
"📁 Using 5 files from props"; // Fallback to props

// When files change
"📝 Project files updated, you can click 'Update Files' to refresh the preview with latest changes";

// When updating
"Updating 5 files in existing sandbox for project: abc123"; // Server-side
```

## Technical Details

### File Normalization

All file paths are normalized to work in the E2B sandbox:

```typescript
const normalizedPath = filePath.startsWith("/")
  ? `/home/user${filePath}`
  : `/home/user/${filePath}`;
```

This ensures files like:

- `index.html` → `/home/user/index.html`
- `/src/App.tsx` → `/home/user/src/App.tsx`
- `package.json` → `/home/user/package.json`

### Dependency Detection

When updating files, the system checks for `package.json`:

```typescript
const hasPackageJson = "package.json" in files;
if (hasPackageJson) {
  // Run npm install to update dependencies
}
```

## Testing Checklist

- [x] Preview starts with database files
- [x] Preview falls back to props if API fails
- [x] Update Files button works correctly
- [x] Files are written to sandbox correctly
- [x] npm install runs when package.json changes
- [x] Iframe refreshes after update
- [x] Console messages are helpful
- [x] Button states update correctly
- [ ] Test with multiple file types (HTML, React, Next.js)
- [ ] Test with large projects (50+ files)
- [ ] Test concurrent updates

## Future Enhancements

Potential improvements for later:

1. **Auto-Update Option** - Toggle for automatic updates on file change
2. **File Diff Preview** - Show what files changed before updating
3. **Selective Updates** - Choose which files to update
4. **Hot Module Replacement** - For React/Next.js projects (requires framework support)
5. **Update Notifications** - Badge showing "X files changed"
6. **Rollback Feature** - Undo last update if preview breaks

## Troubleshooting

### Preview doesn't show latest changes

**Solution**: Click the "Update Files" button to sync with database

### "Update Files" button is disabled

**Possible causes**:

- Sandbox not running - click "Start Preview" first
- Update already in progress - wait for it to complete

**Solution**: Start the preview first, then use update button

### Files update but preview doesn't change

**Possible causes**:

- Browser cache
- Build errors in the code

**Solution**:

1. Click the refresh button (↻)
2. Check browser console for errors
3. Try stopping and restarting preview

## Related Files

- `src/components/coding-interface/PreviewPanel.tsx` - UI component
- `src/components/CodingInterface.tsx` - Parent component
- `src/app/api/sandbox/[projectId]/route.ts` - Sandbox API
- `src/app/api/files/route.ts` - File storage API

---

**Last Updated**: October 9, 2025  
**Status**: Implemented ✅
