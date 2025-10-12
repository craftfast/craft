# Version History Quick Reference

## For Developers

### Adding Version History to New Features

If you're building a new feature that modifies project files:

1. **Use the existing `/api/files` endpoint** with `finalizeGeneration: true`
2. **Version snapshots are created automatically** - no extra code needed
3. **Files are tracked in the database** - accessible via version history

### Example: Creating Files with Auto-Versioning

```typescript
// In your AI generation code
const files = [
  { path: "app/page.tsx", content: "..." },
  { path: "app/layout.tsx", content: "..." },
];

// Save files one by one
for (const file of files) {
  await fetch("/api/files", {
    method: "POST",
    body: JSON.stringify({
      projectId,
      filePath: file.path,
      content: file.content,
      skipGenerationTracking: true, // Don't update on each file
    }),
  });
}

// Finalize (this creates the version snapshot)
await fetch("/api/files", {
  method: "POST",
  body: JSON.stringify({
    projectId,
    finalizeGeneration: true, // ✨ Creates version snapshot
  }),
});
```

### Accessing Version History in Components

```typescript
import VersionHistoryPanel from "@/components/coding-interface/VersionHistoryPanel";

function MyComponent({ projectId, currentVersion }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <button onClick={() => setShowHistory(true)}>Version History</button>

      {showHistory && (
        <VersionHistoryPanel
          projectId={projectId}
          currentVersion={currentVersion}
          onRestore={async () => {
            // Reload files after restore
            await loadFiles();
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
}
```

### API Quick Reference

```typescript
// Get all versions
const response = await fetch(`/api/projects/${projectId}/versions`);
const { versions, currentVersion } = await response.json();

// Restore a version
await fetch(`/api/projects/${projectId}/versions/${versionId}/restore`, {
  method: "POST",
});

// Bookmark a version
await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
  method: "PATCH",
  body: JSON.stringify({ isBookmarked: true }),
});

// Rename a version
await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
  method: "PATCH",
  body: JSON.stringify({ name: "My Important Version" }),
});
```

### Database Queries

```typescript
import { prisma } from "@/lib/db";

// Get all versions for a project
const versions = await prisma.projectVersion.findMany({
  where: { projectId },
  orderBy: [{ isBookmarked: "desc" }, { version: "desc" }],
});

// Get a specific version
const version = await prisma.projectVersion.findUnique({
  where: { id: versionId },
});

// Create a version snapshot
await prisma.projectVersion.create({
  data: {
    projectId,
    version: currentVersion,
    name: "Version Name",
    files: projectFiles as object,
    isBookmarked: false,
  },
});

// Bookmark a version
await prisma.projectVersion.update({
  where: { id: versionId },
  data: { isBookmarked: true },
});
```

## For Users

### How to Use Version History

1. **Click the clock icon** (⏰) in the top navigation
2. **Browse your versions** - organized by bookmarked and unpublished
3. **Bookmark important versions** - click the bookmark icon
4. **Restore a previous version** - click the restore icon (↻)
5. **Close the panel** - click the X button

### When Are Versions Created?

Versions are automatically created when:

- You ask AI to create or modify files
- AI finishes generating the response
- The files are saved to your project

### What's Saved in Each Version?

Each version contains:

- All project files at that point in time
- Version number (1, 2, 3, ...)
- Timestamp (when it was created)
- Number of files

### Can I Restore Without Losing Current Work?

Yes! When you restore a version:

1. Your current work is **automatically saved** as a new version
2. The selected version's files are restored
3. You can always restore back to the auto-saved version

### Can I Rename Versions?

Currently, versions are named automatically (e.g., "Version 1", "Version 2").
Custom naming is planned for a future update.

## Common Use Cases

### 1. Experimenting Safely

```
Version 2: Working app ← Bookmark this
   ↓
Version 3: Try new feature
   ↓
Feature didn't work?
   ↓
Restore to Version 2 ✓
```

### 2. Before Major Changes

```
Before: Version 5 ← Bookmark as "Before redesign"
   ↓
Make big changes
   ↓
Version 6: New design
   ↓
Don't like it?
   ↓
Restore to Version 5 ✓
```

### 3. Finding What Broke

```
Version 8: Everything works ← Bookmark
Version 9: Added feature A
Version 10: Added feature B ← Something broke!
   ↓
Restore to Version 9
   ↓
Still broken? Restore to Version 8
```

## Tips & Best Practices

### For Developers

1. **Always call `finalizeGeneration`** after saving all files
2. **Don't create manual snapshots** unless necessary - auto-snapshots are sufficient
3. **Test restore functionality** in your features that modify files
4. **Handle restore in parent components** - reload files after restore

### For Users

1. **Bookmark working versions** before making big changes
2. **Use descriptive bookmarks** (via API - UI coming soon)
3. **Don't worry about losing work** - restore creates auto-save
4. **Check version history** before asking AI to fix something

## Troubleshooting

### Versions Not Appearing

**Problem**: Made changes but no version created

**Solution**: Check that:

- AI actually generated files (check `/api/files` calls)
- `finalizeGeneration: true` was called
- No errors in browser console
- Database migration ran successfully

### Restore Not Working

**Problem**: Clicked restore but files didn't change

**Solution**: Check that:

- You confirmed the restore dialog
- No errors in browser console
- Preview refreshed after restore
- Try hard refresh (Ctrl+F5)

### Bookmarks Not Persisting

**Problem**: Bookmarked a version but it's not at the top

**Solution**:

- Refresh the version history panel
- Check browser console for errors
- Verify API call succeeded

## Future Enhancements

Planned features:

- [ ] Custom version names in UI
- [ ] Version comparison (diff view)
- [ ] File-level history
- [ ] Version tags (Production, Staging, etc.)
- [ ] Export version as ZIP
- [ ] Undo restore (quick rollback)
- [ ] Version notes/comments
- [ ] Keyboard shortcuts

## Need Help?

- Check `/docs/version-history-implementation.md` for full details
- Check `/docs/version-history-visual-guide.md` for UI flow
- Search existing issues on GitHub
- Create new issue with "version-history" label
