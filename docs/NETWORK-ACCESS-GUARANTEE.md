# 🌐 Network Access Guarantee for E2B Sandboxes

## How to Ensure Your App is Always Accessible from Outside

When AI updates your code in the E2B sandbox, the app must remain accessible from the network. Here's how we guarantee that:

---

## 🔑 The Critical Configuration: `-H 0.0.0.0`

### What It Does

The `-H 0.0.0.0` flag tells Next.js to bind to **all network interfaces**, not just `localhost`.

```bash
# ❌ Wrong - Only accessible inside sandbox
npx next dev -p 3000

# ✅ Correct - Accessible from anywhere
npx next dev -H 0.0.0.0 -p 3000
```

### Why It Matters

```
┌─────────────────────────────────────────────────────┐
│              E2B Sandbox Container                  │
│                                                     │
│  ❌ localhost:3000                                  │
│     └─ Only accessible INSIDE the container        │
│                                                     │
│  ✅ 0.0.0.0:3000                                   │
│     └─ Accessible from ANYWHERE (internet)         │
│                                                     │
└─────────────────────────────────────────────────────┘
                        │
                        │ Port 3000 mapped to
                        │ https://sandbox-id.e2b.app
                        ↓
                 🌍 Internet
```

---

## 📍 Where We Use It

### 1. **Initial Sandbox Creation**

When a new sandbox is created:

```typescript
// src/app/api/sandbox/[projectId]/route.ts:213
const devServerCmd = await sandbox.commands.run(
  "cd /home/user && npx next dev -H 0.0.0.0 -p 3000 > /tmp/nextjs.log 2>&1 &",
  { background: true }
);
```

### 2. **After Dependency Changes**

When `package.json` is updated and dependencies are reinstalled:

```typescript
// src/app/api/sandbox/[projectId]/route.ts:141
const devCmd = await sandboxData.sandbox.commands.run(
  "cd /home/user && npx next dev -H 0.0.0.0 -p 3000 > /tmp/nextjs.log 2>&1 &",
  { background: true }
);
```

### 3. **Dev Server Health Checks** ⭐ NEW

When AI updates code files, we now verify the server is still running:

```typescript
// Check if dev server is responding
const healthCheck = await sandboxData.sandbox.commands.run(
  'curl -s http://0.0.0.0:3000 > /dev/null && echo "healthy" || echo "down"',
  { timeoutMs: 5000 }
);

if (healthCheck.stdout.includes("down")) {
  // Restart dev server with -H 0.0.0.0
  const devCmd = await sandboxData.sandbox.commands.run(
    "cd /home/user && npx next dev -H 0.0.0.0 -p 3000 > /tmp/nextjs.log 2>&1 &",
    { background: true }
  );
}
```

---

## 🔄 How File Updates Work

### Scenario 1: Normal Code Changes (Hot Reload)

```
AI updates page.tsx
       ↓
File written to sandbox
       ↓
Health check: Server still running? ✅
       ↓
Next.js detects change → Hot reload
       ↓
App updates automatically (no restart needed)
```

### Scenario 2: Dependency Changes

```
AI updates package.json
       ↓
File written to sandbox
       ↓
Detected: package.json changed
       ↓
npm install --legacy-peer-deps
       ↓
Kill old dev server (PID tracked)
       ↓
Start new server: npx next dev -H 0.0.0.0 -p 3000
       ↓
App running on new process
```

### Scenario 3: Dev Server Crashed

```
AI updates files
       ↓
Files written to sandbox
       ↓
Health check: curl http://0.0.0.0:3000 → FAIL ❌
       ↓
Detected: Server is down
       ↓
Restart: npx next dev -H 0.0.0.0 -p 3000
       ↓
App back online ✅
```

---

## 🛡️ Guarantees

### ✅ Always Uses 0.0.0.0

Every place that starts the dev server uses `-H 0.0.0.0`:

1. **Initial creation** ✅
2. **After npm install** ✅
3. **Health check recovery** ✅

### ✅ Health Monitoring

After each file update (except package.json changes which trigger full restart):

- Checks if server is responding on `0.0.0.0:3000`
- Auto-restarts if down
- Always restarts with correct network binding

### ✅ Process Tracking

We track the dev server PID (Process ID):

```typescript
sandboxData.devServerPid = devCmd.pid;
```

This allows us to:

- Kill old processes cleanly before restarting
- Avoid port conflicts
- Know when we need to restart vs. hot reload

---

## 🧪 Testing the Configuration

### From Inside the Sandbox

```bash
# Check what's listening on port 3000
netstat -tuln | grep :3000

# Should show:
# tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN
#             ^^^^^^^^
#             This means ALL interfaces!
```

### From Outside (Your Browser)

```javascript
// The sandbox API returns this URL:
const sandboxUrl = `https://${sandbox.getHost(3000)}`;
// Example: https://igjhc6wdf2t9heorq63f3.e2b.app

// This URL is publicly accessible because:
// 1. Server binds to 0.0.0.0 (all interfaces)
// 2. E2B maps port 3000 to the public URL
// 3. HTTPS is automatically handled by E2B
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Using `npm run dev` from package.json

```json
{
  "scripts": {
    "dev": "next dev" // ❌ Defaults to localhost only!
  }
}
```

### ✅ Always Use Explicit Command

```typescript
// ✅ Direct command with explicit host
"npx next dev -H 0.0.0.0 -p 3000";
```

### ❌ Not Checking Server Health

```typescript
// ❌ Bad: Just update files and hope it works
await sandbox.files.write(path, content);
// Server might have crashed!
```

### ✅ Verify Server is Running

```typescript
// ✅ Good: Update files + verify + restart if needed
await sandbox.files.write(path, content);
const health = await sandbox.commands.run('curl -s http://0.0.0.0:3000');
if (health fails) {
  restart server with -H 0.0.0.0
}
```

---

## 📋 Checklist: Is My App Network-Accessible?

- [ ] Server started with `-H 0.0.0.0` flag
- [ ] Using `0.0.0.0` in health checks (not `localhost`)
- [ ] Health checks run after file updates
- [ ] Auto-restart logic includes `-H 0.0.0.0`
- [ ] PID tracking to kill old processes
- [ ] Logs show "Listening on 0.0.0.0:3000"

---

## 🎯 Summary

**The Golden Rule**: Always use `-H 0.0.0.0` when starting Next.js in E2B sandboxes.

**Why**: E2B sandboxes are containers. Binding to `localhost` makes your app only accessible inside the container. Binding to `0.0.0.0` makes it accessible from the internet via E2B's public URL.

**When**:

- ✅ Initial sandbox creation
- ✅ After dependency installs
- ✅ After server crashes (health check recovery)

**Result**: Your app is always accessible at `https://{sandbox-id}.e2b.app`, even when AI updates the code.
