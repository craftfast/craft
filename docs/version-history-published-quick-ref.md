# Published Version Tracking - Quick Reference

## For Developers

### How to Mark a Version as Published

```typescript
// Option 1: Via UI (recommended for users)
// Click the Upload button (📤) on any version in the history panel

// Option 2: Via API
await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ isPublished: true }),
});
```

### How to Query Published Versions

```typescript
// Get all published versions for a project
const publishedVersions = await prisma.projectVersion.findMany({
  where: {
    projectId: "project-id",
    isPublished: true,
  },
  orderBy: { version: "desc" },
});

// Get the latest published version
const latestPublished = await prisma.projectVersion.findFirst({
  where: {
    projectId: "project-id",
    isPublished: true,
  },
  orderBy: { version: "desc" },
});
```

### How to Integrate with Deployment

```typescript
// Example deployment integration
async function deployPublishedVersion(projectId: string) {
  // 1. Get the published version
  const publishedVersion = await prisma.projectVersion.findFirst({
    where: { projectId, isPublished: true },
    orderBy: { version: "desc" },
  });

  if (!publishedVersion) {
    throw new Error("No published version found");
  }

  // 2. Deploy the files
  const files = publishedVersion.files as Record<string, string>;
  await deployToProduction(files);

  // 3. Log deployment
  console.log(`Deployed version ${publishedVersion.version}`);
}
```

## For Users

### What Does "Published" Mean?

The "Published" status helps you track which version is:

- ✅ Live in production
- ✅ Ready for deployment
- ✅ The "official" version
- ✅ Safe to share with users

### How to Publish a Version

1. Open version history (click ⏰ icon)
2. Find the version you want to publish
3. Click the Upload icon (📤)
4. The version is now marked as published
5. A "Published" badge appears

### How to Unpublish a Version

1. Open version history
2. Find the published version
3. Click the Upload icon (📤) again
4. The "Published" badge disappears

### Best Practices

#### ✅ DO:

- Mark your production version as published
- Update published status when deploying
- Keep only one version published (usually)
- Unpublish old versions when deploying new ones

#### ❌ DON'T:

- Publish untested versions
- Forget to update published status
- Leave multiple versions published (confusing)
- Publish broken versions

## Common Workflows

### Workflow 1: Development to Production

```
Step 1: Develop
├─ Make changes with AI
├─ Version 1 created (unpublished)
└─ Test in preview

Step 2: Review
├─ Bookmark working version
├─ Show to stakeholders
└─ Approve for production

Step 3: Publish
├─ Click 📤 on approved version
├─ Version marked as published
└─ Deploy published version

Step 4: Monitor
├─ Check if working
├─ If issues: restore + publish previous version
└─ If good: continue development
```

### Workflow 2: Hotfix

```
Problem: Bug in production!

Step 1: Identify
├─ Find published version (Version 3)
└─ Bug is in this version

Step 2: Fix
├─ Ask AI to fix the bug
├─ Version 4 created
└─ Test the fix

Step 3: Deploy
├─ Unpublish Version 3 (click 📤)
├─ Publish Version 4 (click 📤)
└─ Deploy Version 4

Step 4: Verify
└─ Check production is fixed
```

### Workflow 3: Rollback

```
Problem: New version has issues!

Step 1: Current State
├─ Version 5 [Current] [Published] ← Has bug!
└─ Version 4 [Published] ← Last known good

Step 2: Rollback
├─ Click ↻ on Version 4
├─ Confirm restore
└─ Version 4 becomes current

Step 3: Re-publish
├─ Version 4 is auto-published (already was)
├─ Deploy Version 4
└─ Production is stable again
```

## UI Quick Reference

### Version Card States

```
Unpublished:
┌─────────────────────────────────┐
│ Version 2          [🔖] [📤] [↻] │
│ 2 hours ago · 12 files          │
└─────────────────────────────────┘

Published:
┌──────────────────────────────────────┐
│ Version 2  [📤 Published]  [🔖] [📤] [↻] │
│ 2 hours ago · 12 files               │
└──────────────────────────────────────┘
                     ↑ Badge   ↑ Highlighted button

Current + Published:
┌────────────────────────────────────────────┐
│ Version 2  [Current] [📤 Published]  [🔖] [📤] │
│ 2 hours ago · 12 files                     │
└────────────────────────────────────────────┘
```

## Keyboard Shortcuts (Future)

Planned shortcuts:

- `P` - Toggle publish on selected version
- `Cmd/Ctrl + P` - Quick publish current version
- `Cmd/Ctrl + Shift + P` - View all published versions

## Integration Examples

### Example 1: Deployment Script

```bash
# Get published version and deploy
curl -X GET "https://api.craft.tech/projects/${PROJECT_ID}/versions" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq -r '.versions[] | select(.isPublished == true) | .files' \
  | deploy-to-production
```

### Example 2: CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
deploy:
  steps:
    - name: Get published version
      run: |
        VERSION=$(curl -X GET "${API_URL}/projects/${PROJECT_ID}/versions" \
          | jq -r '.versions[] | select(.isPublished == true) | .version' \
          | head -1)
        echo "DEPLOY_VERSION=$VERSION" >> $GITHUB_ENV

    - name: Deploy
      run: deploy.sh $DEPLOY_VERSION
```

### Example 3: Custom Deployment UI

```typescript
// Custom deployment dashboard
function DeploymentDashboard() {
  const [publishedVersion, setPublishedVersion] = useState(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/versions`)
      .then((res) => res.json())
      .then((data) => {
        const published = data.versions.find((v) => v.isPublished);
        setPublishedVersion(published);
      });
  }, []);

  return (
    <div>
      <h2>Currently Published</h2>
      {publishedVersion ? (
        <div>
          <p>Version {publishedVersion.version}</p>
          <p>{publishedVersion.name}</p>
          <button onClick={deployVersion}>Deploy to Production</button>
        </div>
      ) : (
        <p>No version is currently published</p>
      )}
    </div>
  );
}
```

## Troubleshooting

### Issue: Can't find published version

**Solution**: Check filters and sorting

```typescript
// Make sure to query with isPublished: true
const versions = await prisma.projectVersion.findMany({
  where: { projectId, isPublished: true },
});
```

### Issue: Multiple versions published

**Solution**: This is allowed! But you might want to enforce single published version

```typescript
// Unpublish all others when publishing a new version
async function publishVersion(projectId: string, versionId: string) {
  // Unpublish all versions
  await prisma.projectVersion.updateMany({
    where: { projectId, isPublished: true },
    data: { isPublished: false },
  });

  // Publish selected version
  await prisma.projectVersion.update({
    where: { id: versionId },
    data: { isPublished: true },
  });
}
```

### Issue: Published badge not showing

**Solution**: Check the API response

1. Open browser DevTools
2. Check Network tab
3. Verify `isPublished: true` in response
4. If not, regenerate Prisma client: `npx prisma generate`

## Summary

✅ **Added**: `isPublished` boolean field
✅ **UI**: Upload button to toggle
✅ **Badge**: "Published" indicator
✅ **API**: PATCH endpoint support
✅ **Database**: Indexed for queries
✅ **Docs**: Complete documentation

**Ready to use!** Start marking your production versions as published.
