# Next.js-Only Preview System - Implementation Summary

## Changes Made

### 1. Sandbox API Route (`src/app/api/sandbox/[projectId]/route.ts`)

#### Removed Support For:

- ❌ Static HTML projects (http-server)
- ❌ Generic Node.js projects
- ❌ Project type detection logic
- ❌ Default "Preview Ready" HTML page

#### Added Next.js-Only Features:

- ✅ Always creates Next.js 14 project structure
- ✅ Default Next.js template with TypeScript + Tailwind
- ✅ Smart dependency installation (only when package.json changes)
- ✅ Proper Next.js dev server startup on port 3000
- ✅ Longer compilation wait time (15 seconds for Next.js)
- ✅ `--legacy-peer-deps` flag for reliable npm install

**Key Code Changes:**

```typescript
// Old: Detected project type
const hasPackageJson = files && "package.json" in files;
const hasIndexHtml = files && "index.html" in files;

// New: Always Next.js
console.log("⚡ Setting up Next.js project...");
const projectFiles = files || DEFAULT_NEXTJS_TEMPLATE;
```

**Default Template Includes:**

- `package.json` - Next.js 14.2.5, React 18, TypeScript 5
- `tsconfig.json` - TypeScript config with App Router support
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `postcss.config.mjs` - PostCSS config
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Welcome page
- `src/app/globals.css` - Global styles

### 2. Preview Panel (`src/components/coding-interface/PreviewPanel.tsx`)

#### Updated Messaging:

- ❌ "Start Preview" → ✅ "Start Next.js Preview"
- ❌ "Loading project files..." → ✅ "Initializing Next.js environment..."
- ❌ "Creating sandbox..." → ✅ "Setting up Next.js project..."
- ❌ "Installing dependencies..." → ✅ "Installing Next.js dependencies..."
- ❌ "Starting dev server..." → ✅ "Starting Next.js dev server..."

#### Adjusted Timing:

```typescript
// Old timing (for generic projects)
await new Promise((resolve) => setTimeout(resolve, 2000)); // Too short

// New timing (for Next.js compilation)
await new Promise((resolve) => setTimeout(resolve, 8000)); // npm install
await new Promise((resolve) => setTimeout(resolve, 12000)); // Next.js compile
```

#### User Expectations:

- Old: "This may take up to 10 seconds..."
- New: "Setting up Next.js (this may take 20-30 seconds)..."

### 3. File Update Logic

#### Smarter Updates:

```typescript
// Only reinstall if package.json changed
const packageJsonUpdated = "package.json" in files;

if (packageJsonUpdated) {
  await sandboxData.sandbox.runCode(`
    subprocess.run(['npm', 'install', '--legacy-peer-deps'], ...)
  `);
}

// Next.js HMR handles everything else automatically
```

#### Previous Behavior:

- Every file update triggered full refresh
- No dependency change detection
- Slower update cycle

#### New Behavior:

- File changes → Write to filesystem → Next.js HMR reloads
- Package.json changes → npm install → restart
- Much faster updates (< 1 second for code changes)

## Benefits

### Performance

- **First load**: Slightly slower (20-30s) but more reliable
- **Subsequent updates**: Much faster (< 1s) thanks to HMR
- **Dependency management**: Only when actually needed

### Reliability

- **Consistent environment**: Every project is Next.js
- **No project type guessing**: Eliminates edge cases
- **Standard workflow**: Predictable behavior

### User Experience

- **Clear expectations**: Users know they're building Next.js apps
- **Better messaging**: Loading states reflect actual Next.js setup
- **Auto-updates**: Files appear in preview automatically

## Migration Notes

### For Existing Projects

If a project was created before this update:

1. **Stop the preview** (sandbox cleanup)
2. **Start preview again** (creates new Next.js sandbox)
3. **Files remain intact** (stored in database)
4. **Preview now uses Next.js**

### For New Projects

- All new projects automatically get Next.js setup
- Default welcome page shows immediately
- Chat with AI to customize the app

## Testing Checklist

- [x] New project starts with Next.js template
- [x] Default page shows welcome message
- [x] File creation via AI updates preview
- [x] File modification via AI triggers HMR
- [x] package.json changes reinstall dependencies
- [x] Code changes don't trigger npm install
- [x] Loading messages reflect Next.js setup
- [x] Timing accommodates Next.js compilation
- [x] Sandbox persists across file updates
- [x] Preview auto-switches when files created

## Known Limitations

### Current Constraints

1. **Single Framework**: Only supports Next.js (by design)
2. **Port 3000**: Fixed to Next.js default port
3. **App Router**: Template uses App Router (not Pages Router)
4. **Compilation Time**: First load takes 20-30 seconds
5. **Sandbox Timeout**: Inactive sandboxes close after 30 minutes

### Not Supported

- Static HTML projects
- Other frameworks (Vue, Svelte, Angular)
- Custom build tools (Vite, Webpack standalone)
- Pages Router structure
- Custom Next.js versions < 14

## Recommendations

### For Users

1. **Be patient on first load** - Next.js setup takes time
2. **Use AI for file creation** - Automatic preview updates
3. **Follow Next.js conventions** - App Router file structure
4. **Leverage Tailwind** - Pre-configured and ready

### For Developers

1. **Monitor sandbox logs** - Useful for debugging
2. **Extend default template** - Add more dependencies as needed
3. **Optimize wait times** - May be able to reduce compilation wait
4. **Handle errors gracefully** - Show Next.js build errors in UI

## Future Improvements

### Short Term

- Show Next.js compilation errors in preview UI
- Display real-time build logs
- Add TypeScript error overlay

### Medium Term

- Support Next.js 15 when stable
- Add server-side rendering preview
- Enable API route testing

### Long Term

- Preview multiple pages/routes
- Mobile device simulation
- Performance monitoring integration

## Conclusion

The preview system is now **exclusively optimized for Next.js**, providing:

✅ **Faster development** with Next.js HMR  
✅ **Reliable environment** with consistent setup  
✅ **Better UX** with clear messaging and auto-updates  
✅ **Modern stack** with Next.js 14, TypeScript, and Tailwind

All previous support for other project types has been removed to focus on delivering the best Next.js development experience.
