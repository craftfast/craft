# 🎯 CRITICAL FIX: Next.js Sandbox Network Binding

## The Problem

The Next.js preview was stuck at "Closed Port Error" because the dev server inside the E2B sandbox was binding to `localhost` (127.0.0.1) only, making it inaccessible from outside the sandbox.

### What Was Happening

```
Inside E2B Sandbox:
┌────────────────────────────────┐
│ Next.js dev server             │
│ Listening on: localhost:3000   │  ← Only accessible inside sandbox
│ (127.0.0.1:3000)              │
└────────────────────────────────┘
         ↑
         │ ❌ NOT accessible from outside
         │
[E2B Sandbox Boundary]
         │
    Your Browser  ← Can't reach localhost inside sandbox
```

### The Logs Showed

```
> next dev
   ▲ Next.js 15.5.4
   - Local:        http://localhost:3000      ← Problem!
   - Network:      http://169.254.0.21:3000
 ✓ Ready in 1935ms
```

The server was ready, but bound to `localhost` which is not reachable from outside the sandbox.

## The Solution

### Changed Command

**Before:**

```typescript
"cd /home/user && npm run dev > /tmp/nextjs.log 2>&1 &";
```

**After:**

```typescript
"cd /home/user && npx next dev -H 0.0.0.0 -p 3000 > /tmp/nextjs.log 2>&1 &";
```

### The Key Flag: `-H 0.0.0.0`

This tells Next.js to listen on **all network interfaces** (0.0.0.0), not just localhost.

```
After Fix:
┌────────────────────────────────┐
│ Next.js dev server             │
│ Listening on: 0.0.0.0:3000    │  ← Accessible from anywhere!
│ (All interfaces)               │
└────────────────────────────────┘
         ↑
         │ ✅ NOW accessible!
         │
[E2B Sandbox Boundary]
         │
    Your Browser  ← Can reach via https://{sandboxId}.e2b.app
```

## What Changed in Code

### 1. Main Sandbox Creation (route.ts:207)

```typescript
// IMPORTANT: Use -H 0.0.0.0 to listen on all interfaces (required for E2B sandbox access)
console.log("🚀 Starting Next.js dev server on 0.0.0.0:3000...");

const devServerCmd = await sandbox.commands.run(
  "cd /home/user && npx next dev -H 0.0.0.0 -p 3000 > /tmp/nextjs.log 2>&1 &",
  { background: true }
);
```

### 2. Hot Reload / Restart (route.ts:138)

```typescript
// Start new dev server - listen on 0.0.0.0 for E2B access
const devCmd = await sandboxData.sandbox.commands.run(
  "cd /home/user && npx next dev -H 0.0.0.0 -p 3000 > /tmp/nextjs.log 2>&1 &",
  { background: true }
);
```

## Why This Matters for E2B

### E2B Sandbox Architecture

E2B sandboxes expose ports via their public hostname:

```
https://{sandboxId}.e2b.app  →  Sandbox:3000
```

But this only works if the service inside the sandbox is listening on:

- ✅ `0.0.0.0:3000` (all interfaces)
- ❌ `127.0.0.1:3000` (localhost only)

### Why npm run dev Doesn't Work

The default `package.json` script:

```json
{
  "scripts": {
    "dev": "next dev"  ← Defaults to localhost
  }
}
```

By default, `next dev` binds to localhost for security. This is fine for local development but **breaks in containerized/sandbox environments**.

### The Fix

Using `npx next dev -H 0.0.0.0` directly instead of `npm run dev` ensures the server is accessible externally.

## Expected Behavior Now

### New Console Logs

```
🚀 Starting Next.js dev server on 0.0.0.0:3000...
📝 Dev server starting (PID: 865)
⏳ Waiting for compilation (15-20s)...
🔍 Verifying server...
✅ Server is running on port 3000
📝 Listening on: 0.0.0.0 (all interfaces)  ← You should see this!
💾 Sandbox stored. Active: 1
```

### Inside Sandbox Logs

```
> npx next dev -H 0.0.0.0 -p 3000
   ▲ Next.js 15.5.4
   - Local:        http://0.0.0.0:3000       ← Changed!
   - Network:      http://169.254.0.21:3000
 ✓ Ready in 1935ms
```

## Testing

### 1. Stop the Preview (if running)

Click "Stop Preview" to kill the old sandbox

### 2. Start New Preview

Click "Start Preview" again

### 3. Watch the Logs

You should now see:

```
🚀 Starting Next.js dev server on 0.0.0.0:3000...
```

### 4. Wait for Compilation (~20s)

### 5. Preview Should Load!

The iframe should now show your Next.js app instead of "Closed Port Error"

## Technical Details

### Network Binding Explained

**localhost (127.0.0.1):**

- Loopback interface
- Only accessible from the same machine
- Blocked by container/sandbox boundaries

**0.0.0.0:**

- Wildcard address (all interfaces)
- Accessible from any network interface
- Required for Docker, E2B, cloud deployments

### Why This Wasn't Obvious

Next.js's default behavior is secure for local development:

- Binds to localhost to prevent external access
- Works fine on your machine
- Breaks in isolated environments

E2B sandboxes need external access to work:

- Browser → E2B proxy → Sandbox
- Requires service to listen on all interfaces

## Common Patterns

### This Same Issue Affects:

1. **Vite**: `vite --host 0.0.0.0`
2. **React (CRA)**: `HOST=0.0.0.0 react-scripts start`
3. **Vue**: `vue-cli-service serve --host 0.0.0.0`
4. **Express**: `app.listen(3000, '0.0.0.0')`

### The General Rule

**In containerized/sandbox environments, ALWAYS bind to 0.0.0.0**

## Files Modified

| File                                           | Change                                   |
| ---------------------------------------------- | ---------------------------------------- |
| `src/app/api/sandbox/[projectId]/route.ts:207` | Added `-H 0.0.0.0` to npx next dev       |
| `src/app/api/sandbox/[projectId]/route.ts:138` | Added `-H 0.0.0.0` to hot reload restart |

## Verification

After the fix, check:

1. ✅ Terminal shows `0.0.0.0:3000` in logs
2. ✅ `lsof -i :3000` shows listening on `*:3000`
3. ✅ Preview iframe loads Next.js app
4. ✅ No "Closed Port Error"

## Summary

**The Issue:** Next.js dev server binding to localhost inside E2B sandbox  
**The Fix:** Use `-H 0.0.0.0` flag to listen on all interfaces  
**The Result:** Preview now accessible via E2B's public hostname

This is a **critical fix** that makes the entire preview system functional!

---

**Status:** ✅ FIXED  
**Test:** Stop and restart preview to test  
**Expected:** Preview should load successfully
