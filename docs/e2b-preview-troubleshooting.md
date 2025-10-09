# E2B Preview Troubleshooting Guide

## Common Issue: "Connection refused on port 3000"

### Problem

The sandbox is created successfully, but when you try to access it, you see:

```
Connection refused on port 3000
Please ensure that your service is properly configured and running on the specified port.
```

### Root Cause

The sandbox container was created, but **no web server was started** inside it. The E2B sandbox needs an active HTTP server listening on port 3000 to serve your application.

### Solution (Implemented)

We've updated the sandbox creation to automatically:

1. **Detect project type**:

   - Node.js/React/Next.js (has `package.json`)
   - Static HTML (has `index.html`)
   - Default (creates a welcome page)

2. **Start appropriate server**:

   - **Node.js projects**: Run `npm install` then `npm run dev`
   - **Static HTML**: Use `http-server` on port 3000
   - **Default**: Create HTML page and serve with `http-server`

3. **Wait for server to be ready** before returning the preview URL

### How It Works Now

```typescript
// 1. Create sandbox
const sandbox = await Sandbox.create();

// 2. Write files to /home/user
await sandbox.files.write("/home/user/index.html", content);

// 3. Start HTTP server using Python subprocess
await sandbox.runCode(`
import subprocess
import os

os.chdir('/home/user')

# Install http-server
subprocess.run(['npm', 'install', '-g', 'http-server'], check=True)

# Start server on port 3000 in background
subprocess.Popen(['http-server', '-p', '3000'])

print("Server started on port 3000")
`);

// 4. Wait for server to start (3 seconds)
await new Promise((resolve) => setTimeout(resolve, 3000));

// 5. Return preview URL
return { url: `https://${sandbox.getHost(3000)}` };
```

### Testing the Fix

1. **Stop any existing sandbox**:

   ```
   Click "Stop Preview" button in the UI
   ```

2. **Clear the old sandbox** (if needed):

   ```bash
   # In your terminal, restart the dev server
   # This clears the in-memory sandbox cache
   npm run dev
   ```

3. **Start fresh preview**:
   - Click "Preview" tab
   - Click "Start Preview"
   - Wait 5-10 seconds (shows progress messages)
   - Preview should load successfully!

### Expected Timeline

| Step                    | Duration  | What's Happening              |
| ----------------------- | --------- | ----------------------------- |
| Creating sandbox        | 1-2s      | E2B spins up container        |
| Installing dependencies | 0-5s      | npm install (if package.json) |
| Starting server         | 2-3s      | Server boots up               |
| Verification            | 1-2s      | Check if server is ready      |
| **Total**               | **5-10s** | Preview appears!              |

### Progress Messages

You'll see these messages while loading:

1. "Creating sandbox environment..."
2. "Installing dependencies..."
3. "Starting development server..."
4. "Waiting for server... (1/10)"
5. ✅ Preview loads!

### Still Not Working?

#### Check 1: Verify Files Were Written

Look at server logs in your terminal:

```
Creating sandbox for project: abc123
Setting up static HTML project...
Starting HTTP server...
```

#### Check 2: View Sandbox Logs

E2B provides a logs link when there's an error. Click:

```
Check the sandbox logs for more information →
```

Common log errors:

- `npm: command not found` → Node.js not available
- `Permission denied` → File write issues
- `EADDRINUSE` → Port 3000 already in use

#### Check 3: Test with Simple HTML

Create a minimal test in the chat:

```
Create a simple HTML file that displays "Hello World" in big text
```

Then try the preview. If this works, the issue might be with your project files.

#### Check 4: Sandbox Timeout

If you see "Connection refused" after waiting:

- Server might have failed to start
- Check if package.json has a "dev" script
- Verify all file paths are correct

### Manual Debug Mode

You can execute commands manually using the execute API:

```bash
# Using curl or Postman
POST /api/sandbox/[projectId]/execute
{
  "command": "ls -la /home/user"
}
```

This shows what files are actually in the sandbox.

### Different Project Types

#### For Static HTML Projects

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
```

✅ **Automatically starts** `http-server` on port 3000

#### For React/Vite Projects

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

✅ **Automatically runs** `npm install && npm run dev`

#### For Next.js Projects

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
```

✅ **Automatically runs** `npm install && npm run dev`

### Performance Tips

#### Faster Startup

- **Reuse sandboxes**: Don't stop preview unless necessary
- **Minimal dependencies**: Fewer packages = faster install
- **Use CDN**: Link external CSS/JS instead of npm packages

#### Cost Optimization

- **Auto-timeout**: Sandboxes stop after 30 minutes
- **Stop when done**: Click "Stop Preview" when finished
- **Share sandboxes**: One sandbox per project, not per session

### Error Messages Explained

| Error               | Meaning           | Solution                  |
| ------------------- | ----------------- | ------------------------- |
| Connection refused  | No server running | Wait longer or check logs |
| 502 Bad Gateway     | Server crashed    | Check code for errors     |
| 504 Gateway Timeout | Server too slow   | Optimize startup time     |
| 403 Forbidden       | Permission issue  | Check file permissions    |

### Advanced Debugging

#### Enable Verbose Logging

Edit `route.ts`:

```typescript
console.log("Sandbox created:", sandbox.id);
console.log("Files written:", Object.keys(files));
console.log("Server started, waiting...");
```

#### Check Server Health

The preview panel now includes health checks:

```typescript
// Tries up to 10 times to ping the server
while (retries < maxRetries && !isReady) {
  try {
    await fetch(data.url, { mode: "no-cors" });
    isReady = true;
  } catch {
    retries++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
```

### Known Limitations

1. **Python-based execution**: E2B Code Interpreter uses Python to run commands
2. **Background processes**: Need to use `subprocess.Popen` for servers
3. **Port restrictions**: Only port 3000 is exposed by default
4. **Timeout limits**: Maximum 30 minutes of runtime

### Getting Help

If you're still stuck:

1. **Check server logs**: Look in your terminal for error messages
2. **E2B Dashboard**: Visit https://e2b.dev/dashboard for sandbox logs
3. **E2B Discord**: https://discord.gg/U7KEcGErtQ
4. **Open an issue**: With full error messages and steps to reproduce

### Success Checklist

Before reporting an issue, verify:

- [ ] E2B_API_KEY is set in `.env.local`
- [ ] Dev server was restarted after adding the key
- [ ] You're logged in to the app
- [ ] Project exists and you own it
- [ ] Waited at least 10 seconds for preview
- [ ] Checked browser console for errors (F12)
- [ ] Checked server terminal for logs
- [ ] Tried with a simple HTML file first

## Quick Reference

### Restart Everything

```bash
# 1. Stop dev server (Ctrl+C)
# 2. Clear and restart
npm run dev
```

### Check Sandbox Status

```bash
# GET request to check if running
curl http://localhost:3000/api/sandbox/[your-project-id]
```

### Force Stop Sandbox

```bash
# DELETE request to kill sandbox
curl -X DELETE http://localhost:3000/api/sandbox/[your-project-id]
```

### View All Active Sandboxes

Check your terminal output for:

```
Creating sandbox for project: abc123
Closed inactive sandbox for project: xyz789
```

---

**Last Updated**: October 9, 2025  
**Status**: Connection refused issue fixed ✅
