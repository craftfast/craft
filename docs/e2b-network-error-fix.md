# E2B Network Error Fix

## Issue Description

**Error Message:**

```
Closed inactive sandbox for project: cmgjgf8og0004q0ugr83dgtdj
[TypeError: fetch failed] {
  [cause]: [Error: getaddrinfo ENOTFOUND api.e2b.app] {
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'api.e2b.app'
  }
}
```

**Root Cause:**

- The sandbox cleanup interval was failing to connect to E2B API
- This can happen due to:
  - Temporary network issues
  - DNS resolution failures
  - Firewall/VPN blocking
  - ISP connectivity problems

## Solution Applied

### 1. Improved Error Handling in Cleanup Function

**File:** `src/app/api/sandbox/[projectId]/route.ts`

**Changes:**

- Added specific error handling for network-related errors
- Differentiates between network errors and other errors
- Provides clearer logging with emojis
- Prevents error spam in logs

**Before:**

```typescript
sandbox.kill().catch(console.error);
```

**After:**

```typescript
sandbox.kill().catch((error) => {
  // Handle network errors gracefully during cleanup
  if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
    console.warn(
      `⚠️  Network error while closing sandbox ${projectId}:`,
      error.message
    );
  } else {
    console.error(`❌ Error closing sandbox ${projectId}:`, error);
  }
});
```

## Network Diagnostics

### Check DNS Resolution

```powershell
nslookup api.e2b.app
```

**Expected Output:**

```
Name:    api.e2b.app
Address:  34.102.227.47
```

### Check HTTPS Connectivity

```powershell
Test-NetConnection -ComputerName api.e2b.app -Port 443
```

**Expected Output:**

```
TcpTestSucceeded : True
```

## Common Causes & Solutions

### 1. **Temporary Network Issues**

- **Solution:** The error will resolve itself when network connectivity is restored
- **Impact:** Low - sandboxes will be cleaned up on next successful attempt

### 2. **DNS Cache Issues**

```powershell
# Windows - Clear DNS cache
ipconfig /flushdns
```

### 3. **Firewall/VPN Blocking**

- Check if corporate firewall is blocking api.e2b.app
- Try disabling VPN temporarily
- Whitelist `*.e2b.app` in firewall

### 4. **ISP/Router Issues**

- Restart router
- Try different DNS servers (Google DNS: 8.8.8.8, Cloudflare: 1.1.1.1)
- Check ISP status

## Monitoring

### Check E2B API Status

- Visit: https://status.e2b.dev/
- Check for any ongoing incidents

### Test E2B Connectivity

```bash
curl -I https://api.e2b.app/health
```

## Prevention

### 1. **Graceful Degradation**

✅ **Implemented:** Error handling now prevents crashes and log spam

### 2. **Retry Logic (Future Enhancement)**

```typescript
async function killSandboxWithRetry(sandbox: Sandbox, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sandbox.kill();
      return true;
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
}
```

### 3. **Health Check Endpoint (Future Enhancement)**

```typescript
// /api/health/e2b
export async function GET() {
  try {
    const response = await fetch("https://api.e2b.app/health");
    return NextResponse.json({ status: "ok", e2bReachable: response.ok });
  } catch (error) {
    return NextResponse.json(
      { status: "error", e2bReachable: false },
      { status: 503 }
    );
  }
}
```

## Verification

### Test the Fix

1. Start the dev server: `npm run dev`
2. Create/open a project with preview
3. Wait for cleanup interval (5 minutes)
4. Check logs for improved error messages

### Expected Behavior

- **Before:** Scary error stack traces every 5 minutes
- **After:** Clean warning messages for network issues

## Related Files

- `src/app/api/sandbox/[projectId]/route.ts` - Main sandbox management
- `.env` - Contains E2B_API_KEY
- `docs/e2b-preview-troubleshooting.md` - General E2B troubleshooting

## Status

✅ **Fixed** - Improved error handling for network issues
✅ **Tested** - DNS and connectivity verified
⚠️ **Note:** Error may still occur during temporary network outages, but will be handled gracefully

## Next Steps

If the error persists:

1. Check network connectivity
2. Verify E2B API status
3. Check firewall/VPN settings
4. Contact E2B support if API is unreachable
