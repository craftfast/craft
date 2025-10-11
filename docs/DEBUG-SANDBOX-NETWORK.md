# 🔍 Debug: Sandbox Network Issues

## The Issue You're Seeing

Your screenshot shows:

```
Closed Port Error
The sandbox igjhc6wdf2t9heorq63f3 is running but there's
no service running on port 3000.
```

This means:

- ✅ E2B sandbox container is running
- ❌ Next.js dev server inside is NOT listening on port 3000

---

## 🔍 How to Debug This

### Step 1: Check the Sandbox Logs

The sandbox startup logs go to `/tmp/nextjs.log` inside the container.

**Add this to your PreviewPanel.tsx debugging:**

```typescript
// After starting sandbox, check the logs
const logsCmd = await sandbox.commands.run("cat /tmp/nextjs.log");
console.log("📋 Next.js Logs:", logsCmd.stdout);
console.log("📋 Error Logs:", logsCmd.stderr);
```

### Step 2: Check What's Listening on Port 3000

```typescript
const portCheck = await sandbox.commands.run(
  'netstat -tuln | grep :3000 || echo "Nothing on port 3000"'
);
console.log("🔍 Port 3000 status:", portCheck.stdout);
```

**What to look for:**

✅ **Good** - Server is bound to all interfaces:

```
tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN
```

❌ **Bad** - Server is bound to localhost only:

```
tcp  0  0  127.0.0.1:3000  0.0.0.0:*  LISTEN
```

❌ **Bad** - Nothing listening:

```
Nothing on port 3000
```

### Step 3: Check if Process is Running

```typescript
const processCheck = await sandbox.commands.run(
  'ps aux | grep "next dev" | grep -v grep'
);
console.log("🔍 Next.js process:", processCheck.stdout);
```

### Step 4: Try to Connect Locally (Inside Sandbox)

```typescript
const localCheck = await sandbox.commands.run(
  'curl -s http://0.0.0.0:3000 || echo "Connection failed"'
);
console.log("🔍 Local connection test:", localCheck.stdout);
```

---

## 🛠️ Common Causes & Fixes

### Cause 1: Server Not Started

**Symptoms:**

- No process found
- Nothing on port 3000

**Fix:**
The server command might have failed. Check `/tmp/nextjs.log` for errors:

```bash
# Common errors in logs:
# - "Cannot find module 'next'"  → npm install failed
# - "Port 3000 is already in use" → need to kill old process
# - "Invalid configuration"      → next.config.js has errors
```

### Cause 2: Server Bound to Localhost

**Symptoms:**

- Port shows `127.0.0.1:3000` instead of `0.0.0.0:3000`

**Fix:**
The `-H 0.0.0.0` flag wasn't used. Check the startup command in the API route.

### Cause 3: Server Crashed After Starting

**Symptoms:**

- Process was running, now it's not
- Logs show errors

**Fix:**
Could be a code error. Check for:

- TypeScript compilation errors
- React component errors
- Missing dependencies

### Cause 4: Wrong Working Directory

**Symptoms:**

- Command runs but can't find files
- Logs show "Cannot find package.json"

**Fix:**
Make sure all commands use `cd /home/user &&` prefix:

```bash
cd /home/user && npx next dev -H 0.0.0.0 -p 3000
```

---

## 🚀 Quick Fix: Restart with Debugging

Add this enhanced startup to your sandbox API:

```typescript
// Enhanced startup with full debugging
console.log("🚀 Starting Next.js with full diagnostics...");

// 1. Verify files exist
const lsCmd = await sandbox.commands.run("ls -la /home/user");
console.log("📁 Project files:", lsCmd.stdout);

// 2. Verify package.json
const pkgCheck = await sandbox.commands.run("cat /home/user/package.json");
console.log("📦 package.json:", pkgCheck.stdout);

// 3. Start server with verbose logging
const devServerCmd = await sandbox.commands.run(
  "cd /home/user && npx next dev -H 0.0.0.0 -p 3000 2>&1 | tee /tmp/nextjs.log &",
  { background: true }
);

console.log(`📝 Dev server PID: ${devServerCmd.pid}`);

// 4. Wait and check logs
await new Promise((resolve) => setTimeout(resolve, 5000));
const logsCmd = await sandbox.commands.run("cat /tmp/nextjs.log");
console.log("📋 Startup logs:", logsCmd.stdout);

// 5. Verify port is listening
const portCmd = await sandbox.commands.run("netstat -tuln | grep 3000");
console.log("🔍 Port status:", portCmd.stdout);

// 6. Test local connection
const curlCmd = await sandbox.commands.run("curl -s http://0.0.0.0:3000");
console.log("🌐 Local curl test:", curlCmd.stdout.substring(0, 200));
```

---

## 🎯 The Most Likely Issue

Based on your error, the most likely cause is:

1. **NPM install failed** → Dependencies not installed → Next.js can't start
2. **Files not written** → package.json missing → Can't run `next dev`
3. **Wrong command** → Using `npm run dev` instead of `npx next dev -H 0.0.0.0`

---

## ✅ Verification Steps

After implementing the fix, verify:

```bash
# 1. Inside sandbox, check what's listening:
netstat -tuln | grep 3000
# Should show: 0.0.0.0:3000

# 2. Test local connection:
curl http://0.0.0.0:3000
# Should return HTML

# 3. Test from outside (your browser):
# Visit: https://igjhc6wdf2t9heorq63f3.e2b.app
# Should show your Next.js app
```

---

## 📋 Debugging Checklist

When you see "Closed Port Error":

- [ ] Check `/tmp/nextjs.log` for errors
- [ ] Verify files were written (`ls -la /home/user`)
- [ ] Verify `npm install` completed successfully
- [ ] Check if process is running (`ps aux | grep next`)
- [ ] Check port binding (`netstat -tuln | grep 3000`)
- [ ] Test local connection (`curl http://0.0.0.0:3000`)
- [ ] Verify using `-H 0.0.0.0` flag in startup command
- [ ] Check working directory is `/home/user`

---

## 🔧 Immediate Action

**Add this to your sandbox API route to get detailed logs:**

```typescript
// After starting dev server, add comprehensive logging
const diagnostics = {
  logs: await sandbox.commands.run("cat /tmp/nextjs.log"),
  port: await sandbox.commands.run("netstat -tuln | grep 3000"),
  process: await sandbox.commands.run("ps aux | grep next | grep -v grep"),
  files: await sandbox.commands.run("ls -la /home/user"),
  curl: await sandbox.commands.run("curl -s http://0.0.0.0:3000"),
};

console.log("🔍 DIAGNOSTICS:", JSON.stringify(diagnostics, null, 2));
```

This will tell you exactly what's happening inside the sandbox.
