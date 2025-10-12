# Published Version Tracking - Update

## Summary

Added the ability to track and toggle whether a version is published/live.

## Changes Made

### 1. Database Schema

- ✅ Added `isPublished` field to `ProjectVersion` model (boolean, defaults to false)
- ✅ Added index on `[projectId, isPublished]` for efficient queries
- ✅ Created migration: `20251012063710_add_is_published_to_versions`

### 2. API Endpoints Updated

#### GET `/api/projects/[id]/versions`

- Now returns `isPublished` field for each version

#### PATCH `/api/projects/[id]/versions/[versionId]`

- Now accepts `isPublished` in request body
- Can toggle published status along with bookmark and name

### 3. UI Updates

#### VersionHistoryPanel Component

- ✅ Added `isPublished` to ProjectVersion interface
- ✅ Added `handleTogglePublished` function
- ✅ Added publish button to version cards (Upload icon)
- ✅ Added "Published" badge next to version name when published
- ✅ Publish button highlights when version is published

#### Visual Changes

```
Version Card (Published):
┌─────────────────────────────────────────────────┐
│ Version 2  [Current] [📤 Published]             │
│ 2 hours ago · 12 files                          │
│                          [🔖] [📤] [↻]          │
└─────────────────────────────────────────────────┘
```

## Usage

### Marking a Version as Published

Users can click the Upload icon (📤) on any version to mark it as published. This is useful for:

1. **Production Deployments**: Mark which version is currently live
2. **Version Control**: Track which versions have been deployed
3. **Collaboration**: Team members can see which version is published
4. **Rollback Safety**: Easily identify the last known good published version

### API Usage

```typescript
// Mark a version as published
await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ isPublished: true }),
});

// Unpublish a version
await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ isPublished: false }),
});

// Query only published versions
const publishedVersions = await prisma.projectVersion.findMany({
  where: {
    projectId,
    isPublished: true,
  },
});
```

## Design System Compliance

✅ All new UI elements follow Craft design system:

- **Colors**: Neutral palette only
- **Published Badge**: `bg-neutral-200 dark:bg-neutral-700`
- **Rounded Elements**: All buttons use `rounded-lg` or `rounded-full`
- **Icons**: Lucide React `Upload` icon
- **Dark Mode**: Full support with `dark:` variants

## Use Cases

### 1. Production Tracking

```
Version 5 [📤 Published] ← Currently live in production
Version 6 ← Testing in staging
Version 7 ← Latest development
```

### 2. Deployment Workflow

1. Developer creates new version (auto-saved)
2. Test in preview
3. If good, click publish button
4. Deploy the published version
5. If issues, restore to previous published version

### 3. Team Collaboration

- Designers can see which version is live
- Developers know which version to deploy
- Stakeholders can identify the production version

## Future Enhancements

Potential additions:

- [ ] Deployment history (track when versions were published)
- [ ] Published version notifications
- [ ] Automatic unpublish when restoring to different version
- [ ] API endpoint to get only published versions
- [ ] Published version analytics
- [ ] Multi-environment support (dev, staging, production)
- [ ] Published version deployment integration

## Testing

To test the feature:

1. Open version history panel
2. Click the Upload icon (📤) on any version
3. Verify "Published" badge appears
4. Click the Upload icon again
5. Verify "Published" badge disappears
6. Refresh page and confirm state persists

## Files Modified

- `prisma/schema.prisma` - Added isPublished field
- `src/app/api/projects/[id]/versions/route.ts` - Return isPublished
- `src/app/api/projects/[id]/versions/[versionId]/route.ts` - Accept isPublished updates
- `src/components/coding-interface/VersionHistoryPanel.tsx` - UI for publish toggle

## Migration

```bash
# Migration already applied:
npx prisma migrate dev --name add_is_published_to_versions

# Regenerate Prisma client (already done):
npx prisma generate
```

## Backward Compatibility

✅ All existing versions will have `isPublished = false` by default
✅ No breaking changes to existing API endpoints
✅ UI gracefully handles both published and unpublished versions

---

**Status**: ✅ Complete and ready for use!
