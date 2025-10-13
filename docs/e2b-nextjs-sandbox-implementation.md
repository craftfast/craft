# E2B Next.js Sandbox Implementation

## Overview

This document describes the improved E2B sandbox implementation for running Next.js projects in Craft, following E2B best practices and the patterns used in the official [E2B Fragments](https://github.com/e2b-dev/fragments) project.

## Key Improvements

### 1. **Proper Use of Commands API**

**Before:** Using `runCode()` with Python subprocess wrappers

```typescript
// ❌ Old approach - unnecessary complexity
await sandbox.runCode(`
import subprocess
subprocess.run(['npm', 'install'])
`);
```

**After:** Using `commands.run()` directly (E2B best practice)

```typescript
// ✅ New approach - direct shell command execution
const result = await sandbox.commands.run(
  "cd /home/user && npm install --legacy-peer-deps",
  { timeoutMs: 120000 }
);
```

**Benefits:**

- Simpler code, less abstraction
- Better error handling with exit codes
- Direct access to stdout/stderr
- No Python interpreter overhead
- Follows E2B documentation recommendations

### 2. **Background Process Management**

**Before:** Complex Python subprocess with file handles

```typescript
// ❌ Old approach - complicated
process = subprocess.Popen(
  ["npm", "run", "dev"],
  (stdout = log_file),
  (stderr = err_file)
);
```

**After:** Built-in background flag

```typescript
// ✅ New approach - clean and simple
const devServerCmd = await sandbox.commands.run(
  "cd /home/user && npm run dev > /tmp/nextjs.log 2>&1 &",
  { background: true }
);
const pid = devServerCmd.pid; // Track for later management
```

**Benefits:**

- Native E2B support for background processes
- Automatic PID tracking
- Can kill/restart processes easily
- Cleaner log management

### 3. **Better Error Handling**

**Before:** Try-catch with generic error messages

```typescript
// ❌ Old approach
try {
    await sandbox.runCode(...)
} catch (error) {
    console.error("Error:", error);
    // Continue anyway
}
```

**After:** Exit code validation and cleanup on failure

```typescript
// ✅ New approach
if (installCmd.exitCode !== 0) {
  console.error("❌ npm install failed:", installCmd.stderr);
  await sandbox.kill().catch(() => {});
  throw new Error(`npm install failed with exit code ${installCmd.exitCode}`);
}
```

**Benefits:**

- Validates command success
- Provides detailed error context
- Cleans up failed sandboxes
- Doesn't create broken states

### 4. **Filesystem Operations**

Uses E2B's native filesystem API consistently:

```typescript
// Write files directly to sandbox filesystem
await sandbox.files.write("/home/user/package.json", content);

// No database dependency for file operations
// Files passed directly in request or from DB as needed
```

**Benefits:**

- Fast file operations
- No intermediate database queries
- Direct control over sandbox state
- Follows E2B Fragments pattern

### 5. **Sandbox Lifecycle Management**

```typescript
// Store sandbox with metadata
activeSandboxes.set(projectId, {
  sandbox,
  lastAccessed: new Date(),
  devServerPid, // Track dev server for restart capability
});

// Cleanup with timeout
setInterval(() => {
  // Kill sandboxes idle > 15 minutes
}, 5 * 60 * 1000);
```

**Benefits:**

- Efficient resource usage
- Cost optimization
- Ability to restart dev server
- Graceful cleanup

## API Endpoints

### POST `/api/sandbox/[projectId]`

Creates or reuses a sandbox for a project.

**Request:**

```json
{
  "files": {
    "package.json": "{ ... }",
    "src/app/page.tsx": "export default function...",
    ...
  }
}
```

**Response:**

```json
{
  "sandboxId": "project-id",
  "url": "https://sandbox-id.e2b.app",
  "status": "created" | "running",
  "filesUpdated": true
}
```

**Flow:**

1. Verify project ownership
2. Check for existing sandbox
   - If exists: Update files and return
   - If not: Create new sandbox
3. Write all files to sandbox
4. Install dependencies using `commands.run()`
5. Start Next.js dev server in background
6. Wait for compilation (~20s)
7. Verify server is running
8. Return sandbox URL

### GET `/api/sandbox/[projectId]`

Check sandbox status.

**Response:**

```json
{
  "sandboxId": "project-id",
  "url": "https://sandbox-id.e2b.app",
  "status": "running" | "inactive"
}
```

### DELETE `/api/sandbox/[projectId]`

Stop and remove sandbox.

**Response:**

```json
{
  "status": "closed"
}
```

### PATCH `/api/sandbox/[projectId]`

Health check endpoint.

**Response:**

```json
{
  "healthy": true,
  "status": "running",
  "sandboxId": "project-id",
  "idleTime": 120,
  "timeoutIn": 780
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Request                       │
│                 POST /api/sandbox/[projectId]                │
│                     { files: {...} }                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Route Handler                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Authenticate & verify project ownership           │   │
│  │ 2. Check for existing sandbox in memory              │   │
│  │ 3. If exists: Update files → Hot reload              │   │
│  │ 4. If not: Create new sandbox                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    E2B Sandbox Creation                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Sandbox.create({ metadata, timeoutMs: 10min })       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Write Files to Sandbox                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ sandbox.files.write(path, content)                   │   │
│  │ - package.json, tsconfig.json, etc.                  │   │
│  │ - All Next.js files                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Install Dependencies                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ sandbox.commands.run(                                │   │
│  │   'npm install --legacy-peer-deps',                  │   │
│  │   { timeoutMs: 120000 }                              │   │
│  │ )                                                    │   │
│  │ → Check exitCode === 0                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Start Next.js Dev Server                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ sandbox.commands.run(                                │   │
│  │   'npm run dev > /tmp/nextjs.log 2>&1 &',           │   │
│  │   { background: true }                               │   │
│  │ )                                                    │   │
│  │ → Store PID for later management                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 Wait for Compilation                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ await delay(20000) // ~20 seconds                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Verify Server Running                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ sandbox.commands.run('lsof -i :3000')                │   │
│  │ → Check if port 3000 is listening                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Store Sandbox Reference                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ activeSandboxes.set(projectId, {                     │   │
│  │   sandbox,                                           │   │
│  │   lastAccessed: Date,                                │   │
│  │   devServerPid: number                               │   │
│  │ })                                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Return to Client                          │
│  {                                                           │
│    sandboxId: "project-id",                                  │
│    url: "https://sandbox-id.e2b.app",                        │
│    status: "created"                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices Applied

### From E2B Documentation

1. **Use `commands.run()` for shell commands** - More reliable than wrapping in Python
2. **Use `files` API for filesystem operations** - Fast and direct
3. **Set appropriate timeouts** - 10 minutes default, can be extended
4. **Handle background processes properly** - Use `background: true` flag
5. **Validate command exit codes** - Don't assume success
6. **Clean up on errors** - Kill failed sandboxes

### From E2B Fragments Project

1. **Sandbox per project** - Not per user or global
2. **Reuse sandboxes** - Update files rather than recreate
3. **Store minimal state** - Just sandbox ref and metadata
4. **Hot reload support** - Next.js handles file changes
5. **Graceful cleanup** - Timeout-based with intervals

## Performance Characteristics

### Initial Sandbox Creation

- **Sandbox creation**: ~150ms (E2B VM startup)
- **File writing**: ~50-100ms (10-20 files)
- **npm install**: ~30-60s (network dependent)
- **Next.js compilation**: ~15-20s (initial build)
- **Total**: ~45-80 seconds

### Subsequent Updates (Reusing Sandbox)

- **File writing**: ~50-100ms
- **Hot reload**: ~1-2s (automatic)
- **Total**: <2 seconds ✨

### With Custom Template (Future)

- **Sandbox creation with template**: ~3-6s (pre-installed deps)
- **Next.js compilation**: ~5-10s (incremental)
- **Total**: ~8-16 seconds 🚀

## Cost Optimization

1. **Sandbox reuse** - Don't create new sandboxes unnecessarily
2. **15-minute timeout** - Balance between UX and cost
3. **Cleanup interval** - Every 5 minutes to catch idle sandboxes
4. **Graceful shutdown** - Proper cleanup prevents orphaned resources
5. **Efficient file updates** - Only write changed files

## Error Handling

### Command Execution Errors

```typescript
if (cmd.exitCode !== 0) {
  console.error("Command failed:", cmd.stderr);
  await sandbox.kill().catch(() => {});
  throw new Error(`Command failed with exit code ${cmd.exitCode}`);
}
```

### Network Errors

```typescript
sandbox.kill().catch((error) => {
  if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
    console.warn("Network error during cleanup:", error.message);
  } else {
    console.error("Cleanup error:", error);
  }
});
```

### Timeout Errors

```typescript
const installCmd = await sandbox.commands.run(cmd, {
  timeoutMs: 120000, // 2 minutes for npm install
});
```

## Monitoring & Debugging

### Logs

- npm install progress
- Dev server PID tracking
- File update confirmations
- Verification status
- Cleanup events

### Health Checks

```typescript
// PATCH /api/sandbox/[projectId]
// Returns:
// - healthy: boolean
// - status: string
// - idleTime: number (seconds)
// - timeoutIn: number (seconds until auto-cleanup)
```

### Debugging Commands

```typescript
// Check server status
await sandbox.commands.run("lsof -i :3000");

// View logs
await sandbox.commands.run("tail -20 /tmp/nextjs.log");

// Check processes
await sandbox.commands.run("ps aux | grep node");
```

## Future Enhancements

### 1. Custom E2B Template

Create a pre-configured template with Next.js pre-installed:

```dockerfile
# e2b.Dockerfile
FROM node:21-slim

WORKDIR /home/user
RUN npx create-next-app@14.2.20 . --ts --tailwind --use-npm
RUN npm install

# Template starts in 3-6s instead of 45-80s
```

### 2. Incremental File Updates

Only update changed files:

```typescript
const changedFiles = detectChanges(oldFiles, newFiles);
for (const [path, content] of changedFiles) {
  await sandbox.files.write(path, content);
}
```

### 3. Sandbox Pooling

Pre-warm sandboxes for faster startup:

```typescript
const pool = new SandboxPool({ size: 3, template: "nextjs" });
const sandbox = await pool.acquire();
```

### 4. WebSocket Updates

Real-time build status:

```typescript
// Stream npm install progress
const cmd = await sandbox.commands.run("npm install", {
  onStdout: (data) => ws.send({ type: "progress", data }),
});
```

## Migration from Old Implementation

The old implementation has been backed up to `route.backup.ts`. Key changes:

1. ✅ Replaced `runCode()` with `commands.run()`
2. ✅ Removed Python subprocess wrappers
3. ✅ Added proper exit code validation
4. ✅ Added background process management
5. ✅ Added cleanup on failures
6. ✅ Improved error messages
7. ✅ Added dev server PID tracking
8. ✅ Simplified hot reload logic

## Testing

### Test Scenarios

1. **Create New Sandbox**
   - POST with files → Should create sandbox and return URL
   - Wait 20s → Should be accessible
2. **Update Existing Sandbox**

   - POST again with changed files → Should update files
   - Next.js should hot reload → Changes visible in <2s

3. **Dependency Changes**
   - Update package.json → Should reinstall and restart dev server
4. **Cleanup**
   - Wait 15 minutes → Sandbox should auto-cleanup
5. **Error Cases**
   - Invalid package.json → Should fail gracefully
   - Network timeout → Should clean up and report error

### Manual Testing

```bash
# 1. Start dev server
npm run dev

# 2. Create a project and start preview
# Click "Start Preview" in UI

# 3. Check logs
# Should see: "Installing dependencies", "Dev server starting", etc.

# 4. Update a file
# Make changes in editor, preview should update

# 5. Check health
curl http://localhost:3000/api/sandbox/[projectId] -X PATCH
```

## References

- [E2B Documentation](https://e2b.dev/docs)
- [E2B Fragments Source](https://github.com/e2b-dev/fragments)
- [E2B Sandbox API](https://e2b.dev/docs/sandbox)
- [E2B Commands API](https://e2b.dev/docs/commands)
- [E2B Filesystem API](https://e2b.dev/docs/filesystem)

## Conclusion

This implementation follows E2B best practices and patterns from production applications like E2B Fragments. It's simpler, more reliable, and better performing than the previous implementation.

Key takeaways:

- Use the right tools for the job (`commands.run()` > `runCode()` for shell commands)
- Validate everything (exit codes, server status, etc.)
- Clean up properly (on errors and timeouts)
- Track state for better management (PIDs, last accessed, etc.)
- Follow proven patterns from production code

The result is a robust, production-ready E2B integration that provides fast, reliable Next.js previews for Craft users.
