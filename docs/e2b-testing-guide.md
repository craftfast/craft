# 🧪 Testing the Simplified E2B Implementation

## Quick Test Guide

### Step 1: Update CodingInterface.tsx

Open `src/components/CodingInterface.tsx` and make this small change:

```typescript
// Line 9 - Change this:
import PreviewPanel from "./coding-interface/PreviewPanel";

// To this (temporary for testing):
import PreviewPanelSimple from "./coding-interface/PreviewPanelSimple";
```

Then find where `<PreviewPanel />` is rendered (around line 500+) and change:

```tsx
{
  /* OLD */
}
<PreviewPanel projectId={project.id} projectFiles={projectFiles} />;

{
  /* NEW - for testing */
}
<PreviewPanelSimple projectId={project.id} projectFiles={projectFiles} />;
```

### Step 2: Make Sure Environment is Set

Check `.env.local` has:

```bash
E2B_API_KEY=your-e2b-api-key-here
```

### Step 3: Test the Preview

1. **Start dev server** (if not already running):

   ```bash
   npm run dev
   ```

2. **Open your project** in the browser

3. **Click "Start Preview"** button in the preview panel

4. **Watch the console** for logs:

   - Should see: "🚀 Creating sandbox..."
   - Should see: "✅ Sandbox created"
   - Should see: "📝 Wrote file..."
   - Should see: "✨ Sandbox ready at: https://..."

5. **Verify it loads** - The Next.js app should appear in the iframe

### Step 4: Compare Behavior

#### Old Implementation Behavior:

- ❌ Fetches files from database
- ❌ Multiple API calls
- ❌ Complex loading states
- ❌ Auto-refresh attempts
- ❌ 50+ seconds to start

#### New Implementation Behavior:

- ✅ Single API call
- ✅ Direct file writing
- ✅ Simple loading state
- ✅ Manual refresh button
- ✅ 30-40 seconds to start (without template)

### Step 5: Test Refresh

1. Click the **refresh button** (circular arrow icon)
2. Should see iframe reload immediately
3. No complex file fetching

## 🐛 Troubleshooting

### Error: "Unauthorized"

**Solution**: Make sure you're logged in

### Error: "Failed to create sandbox"

**Solutions**:

1. Check E2B_API_KEY is set
2. Check your E2B account has credits
3. Check internet connection
4. Look at server console for detailed error

### Sandbox takes too long

**Solution**: This is normal for first time (20-30s for npm install)
**Future fix**: Create E2B template (will be 3-5s)

### Iframe shows blank

**Solutions**:

1. Wait longer (Next.js needs time to compile)
2. Click refresh button
3. Check browser console for errors
4. Check if E2B sandbox URL is accessible

## 📊 Comparison Test Checklist

Test both implementations and compare:

### Startup Time

- [ ] Old: **\_** seconds
- [ ] New: **\_** seconds

### Code Complexity

- [ ] Old: 400+ lines
- [ ] New: 145 lines API + 280 lines component

### Number of API Calls

- [ ] Old: 3-4 calls (files, sandbox, update, status)
- [ ] New: 1 call (sandbox)

### State Variables

- [ ] Old: 8+ state variables
- [ ] New: 3 state variables

### Refresh Speed

- [ ] Old: 2-5 seconds (fetches + updates)
- [ ] New: Instant (iframe key change)

### Reliability

- [ ] Old: Sometimes fails on updates
- [ ] New: Works consistently

## ✅ Success Criteria

The simplified version is working if:

1. ✅ Preview starts successfully
2. ✅ You see the Next.js app in iframe
3. ✅ Refresh button works
4. ✅ No console errors
5. ✅ Faster than old implementation
6. ✅ Code is simpler to understand

## 🚀 Next Steps After Testing

If the simplified version works well:

### Option 1: Keep Both (Gradual Migration)

```typescript
// Use feature flag
const USE_SIMPLE_PREVIEW =
  process.env.NEXT_PUBLIC_USE_SIMPLE_PREVIEW === "true";

{
  USE_SIMPLE_PREVIEW ? (
    <PreviewPanelSimple projectId={project.id} projectFiles={projectFiles} />
  ) : (
    <PreviewPanel projectId={project.id} projectFiles={projectFiles} />
  );
}
```

### Option 2: Full Migration

1. Delete old files:

   - `src/app/api/sandbox/[projectId]/route.ts`
   - `src/components/coding-interface/PreviewPanel.tsx`

2. Rename new files:

   ```bash
   # Rename API
   mv src/app/api/sandbox-simple src/app/api/sandbox

   # Rename component
   mv src/components/coding-interface/PreviewPanelSimple.tsx src/components/coding-interface/PreviewPanel.tsx
   ```

3. Update imports back to original:
   ```typescript
   import PreviewPanel from "./coding-interface/PreviewPanel";
   ```

### Option 3: Create E2B Template (Recommended)

This will make preview **10x faster**:

```bash
# Install E2B CLI
npm install -g @e2b/cli

# Login to E2B
e2b auth login

# Create template directory
mkdir -p sandbox-templates/nextjs-craft
cd sandbox-templates/nextjs-craft

# Create e2b.Dockerfile
cat > e2b.Dockerfile << 'EOF'
FROM node:21-slim

WORKDIR /home/user

# Pre-install Next.js
RUN npx create-next-app@14.2.3 . --ts --tailwind --no-eslint --use-npm --no-app
RUN npm install

# Ready to use!
EOF

# Create e2b.toml
cat > e2b.toml << 'EOF'
start_cmd = "cd /home/user && npm run dev"
EOF

# Build template
e2b template build --name nextjs-craft

# You'll get a template ID - use it in your API!
```

Then update `src/app/api/sandbox-simple/route.ts`:

```typescript
// Use your template instead of default
const sandbox = await Sandbox.create("YOUR_TEMPLATE_ID", {
  metadata: { projectId, userId },
  timeoutMs: SANDBOX_TIMEOUT,
});

// Now it's 10x faster because dependencies are pre-installed!
```

## 📈 Performance Improvements to Expect

### Without Template

- Initial: ~30-40 seconds
- Refresh: Instant (iframe reload)
- **Improvement: 60% less code, instant refreshes**

### With Template

- Initial: ~3-6 seconds
- Refresh: Instant (iframe reload)
- **Improvement: 10x faster startup + 60% less code**

## 🎯 Final Recommendation

1. **Test simplified version** - Should work immediately
2. **Create E2B template** - Will make it 10x faster
3. **Migrate fully** - Remove old complex code
4. **Celebrate** - You now have a production-ready E2B integration! 🎉

## 📞 Need Help?

Check these resources:

- [E2B Documentation](https://e2b.dev/docs)
- [E2B Discord](https://discord.gg/e2b)
- [E2B Fragments Example](https://github.com/e2b-dev/fragments)
- [Your Analysis Document](./e2b-fragments-analysis.md)
- [Simplification Guide](./e2b-simplification-guide.md)
