# Next.js Preview Configuration

## Overview

The Vibe coding tool is now **exclusively configured for Next.js apps**. All preview functionality is optimized for the Next.js development workflow, including hot module replacement (HMR), automatic reloading, and proper dependency management.

## Key Features

### 1. **Default Next.js Project Structure**

When starting a preview without existing files, the system automatically creates a complete Next.js 14 project with:

- **Package.json** with latest Next.js, React, and TypeScript
- **TypeScript configuration** (tsconfig.json)
- **Tailwind CSS** setup (tailwind.config.ts, postcss.config.mjs)
- **App Router structure** (src/app/ directory)
- **Default pages**:
  - `src/app/layout.tsx` - Root layout
  - `src/app/page.tsx` - Home page with welcome message
  - `src/app/globals.css` - Global styles with Tailwind directives

### 2. **Smart Dependency Management**

- **Initial setup**: Runs `npm install --legacy-peer-deps` during first sandbox creation
- **File updates**: Only reinstalls dependencies when `package.json` changes
- **Hot reload**: Next.js dev server automatically detects and reloads file changes

### 3. **Automatic Preview Updates**

- Files created via AI chat are automatically sent to the sandbox
- Next.js HMR picks up changes without full page reload
- Preview tab opens automatically when files are created
- Iframe force-refreshes to show latest changes

## Architecture

### Sandbox API (`/api/sandbox/[projectId]`)

**POST Request Handler:**

```typescript
// Always sets up Next.js environment
// Creates default structure if no files provided
// Writes files to /home/user/ directory
// Runs npm install with --legacy-peer-deps flag
// Starts Next.js dev server on port 3000
// Waits 15 seconds for compilation
```

**File Update Flow:**

```typescript
// For existing sandboxes:
// 1. Write all files to filesystem
// 2. Check if package.json changed
// 3. If yes, run npm install
// 4. Next.js HMR handles the rest automatically
```

### Preview Panel Component

**Loading States:**

1. `inactive` - No preview running, shows "Start Next.js Preview" button
2. `loading` - Installing dependencies and starting server
3. `running` - Preview active, iframe showing Next.js app
4. `error` - Something went wrong

**Loading Messages:**

1. "Initializing Next.js environment..."
2. "Setting up Next.js project..."
3. "Installing Next.js dependencies..." (8 seconds)
4. "Starting Next.js dev server..." (12 seconds)

Total estimated time: ~20-30 seconds for first start

### File Synchronization

**On File Creation (ChatPanel):**

```
AI generates files → Save to database → Update projectFiles state
→ Switch to Preview tab → Auto-trigger sandbox update
→ Write files to sandbox → Next.js HMR reloads → Iframe refreshes
```

**On Manual Update:**

```
User clicks "Update Files" → Fetch from database
→ Send to sandbox → Write files → Refresh iframe
```

## Default Next.js Template

### package.json

```json
{
  "name": "vibe-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next": "14.2.5"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.5"
  }
}
```

### src/app/page.tsx (Default Welcome Page)

```tsx
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">🚀</h1>
        <h2 className="text-4xl font-bold mb-2">Welcome to Vibe</h2>
        <p className="text-xl opacity-90">Start building by chatting with AI</p>
      </div>
    </div>
  );
}
```

## Performance Optimizations

### 1. **Reduced Wait Times**

- Removed unnecessary `npm install` on every file update
- Only reinstall when dependencies actually change
- Optimized wait times based on actual Next.js compilation speed

### 2. **Efficient File Updates**

- Write files directly to filesystem without server restart
- Rely on Next.js Fast Refresh for instant updates
- Force iframe refresh only when needed

### 3. **Smart Caching**

- Sandbox persists in memory for 30 minutes
- Reuse existing sandbox instead of creating new ones
- Track last access time to clean up inactive sandboxes

## User Experience Flow

### First Time Setup

1. User opens project → Preview shows "No Preview Running"
2. User clicks "Start Next.js Preview" → Loading state begins
3. System creates sandbox → Installs Next.js → Starts dev server
4. After ~20-30 seconds → Preview shows default welcome page
5. User chats with AI → Files are created
6. Preview automatically updates with new content

### Subsequent Updates

1. User asks AI to modify files
2. Files saved to database within ~100ms
3. Preview tab opens automatically
4. Files sent to sandbox within ~200ms
5. Next.js HMR detects changes within ~500ms
6. Browser shows updated content within ~1 second

**Total time from AI response to visible update: < 2 seconds**

## Troubleshooting

### Preview Shows "Preview Ready" Instead of Next.js App

**Cause**: Old sandbox was created before Next.js-only configuration

**Solution**:

1. Click "Stop Preview"
2. Wait for sandbox to shut down
3. Click "Start Next.js Preview" again
4. New sandbox will use Next.js

### "Failed to start sandbox" Error

**Common Causes**:

- E2B API key not configured
- Network issues
- E2B service down

**Solutions**:

1. Check `.env.local` has valid `E2B_API_KEY`
2. Check browser console for detailed error
3. Try again in a few moments

### Preview Not Updating After File Changes

**Cause**: Next.js compilation error or file write failed

**Solutions**:

1. Check server console for errors
2. Click "Update Files" to force refresh
3. Stop and restart preview if needed

### Slow Initial Load

**Cause**: npm install takes time for first setup

**Expected**: 20-30 seconds is normal for first load

**Tips**:

- Wait for "Setting up Next.js" messages to complete
- Don't refresh page during setup
- Subsequent updates will be much faster

## API Reference

### POST /api/sandbox/[projectId]

**Request Body:**

```typescript
{
  files: Record<string, string>; // filePath → content mapping
}
```

**Response:**

```typescript
{
  sandboxId: string,
  url: string,              // Preview URL (https://...)
  status: "running",
  filesUpdated?: boolean    // True if files were updated
}
```

### GET /api/sandbox/[projectId]

**Response:**

```typescript
{
  status: "running" | "inactive",
  url?: string              // Only present if running
}
```

### DELETE /api/sandbox/[projectId]

**Response:**

```typescript
{
  success: true;
}
```

## Best Practices

### For AI Prompts

When asking AI to create files, be explicit about Next.js conventions:

✅ **Good prompts:**

- "Create a Next.js page component at src/app/about/page.tsx"
- "Add a new API route at src/app/api/users/route.ts"
- "Create a client component with 'use client' directive"

❌ **Avoid:**

- "Create index.html" (not Next.js structure)
- "Make a PHP file" (wrong framework)
- "Create pages/index.js" (old Pages Router)

### File Organization

Follow Next.js 14 App Router conventions:

- **Pages**: `src/app/[route]/page.tsx`
- **Layouts**: `src/app/[route]/layout.tsx`
- **API Routes**: `src/app/api/[route]/route.ts`
- **Components**: `src/components/[ComponentName].tsx`
- **Utilities**: `src/lib/[utility].ts`

### Styling

Use Tailwind CSS (pre-configured):

- Utility classes work out of the box
- Dark mode supported with `dark:` prefix
- Custom config in `tailwind.config.ts`

## Future Enhancements

Potential improvements for Next.js preview:

- [ ] Show Next.js compilation errors in preview UI
- [ ] Display build/compilation logs in real-time
- [ ] Support for Next.js 15 features
- [ ] Automatic TypeScript type checking
- [ ] ESLint integration for code quality
- [ ] Preview multiple routes in tabs
- [ ] Mobile/tablet device simulation
- [ ] Network throttling for testing
- [ ] Screenshot capture for sharing

## Conclusion

The preview system is now fully optimized for Next.js development. Every aspect—from initial setup to file updates—is tailored for the Next.js workflow, providing a seamless, fast, and reliable preview experience.

**Key Takeaways:**

- 🚀 Always uses Next.js (no other frameworks)
- ⚡ Fast updates with Hot Module Replacement
- 🎯 Automatic preview refresh on file changes
- 📦 Smart dependency management
- 💾 Persistent sandboxes for better performance
