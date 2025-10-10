# E2B Preview Loading - Diagnostic Update

## Problem Analysis

The Next.js server **IS starting successfully** (confirmed by "✅ Ready in 2.2s" logs), but the preview iframe isn't loading. This is NOT a server startup issue - it's an iframe loading issue.

## Changes Made

### 1. **Frontend Timing Optimization** (`PreviewPanel.tsx`)

**Problem:** Component was waiting unnecessarily long:

- 8 seconds for npm install (already done by API)
- 12 seconds for Next.js compilation (already done by API)
- Total 20+ seconds before even trying to connect

**Solution:** Reduced waits and added better logging:

```typescript
// Before: Wait 8 seconds + 12 seconds = 20 seconds
// After: Wait 2 seconds + 5 retry attempts with 1.5s each = ~10 seconds max

await new Promise((resolve) => setTimeout(resolve, 2000)); // Quick initial wait
// Then 5 retries instead of 10
```

### 2. **Enhanced Frontend Logging**

Added detailed console logs to track:

- ✅ When sandbox is created
- ✅ What URL is returned from API
- ✅ Each connection attempt
- ✅ When iframe loads
- ✅ Any iframe errors

```typescript
console.log("📦 Sandbox created:", data);
console.log("🔗 Preview URL:", data.url);
console.log(`🔍 Attempt ${retries + 1}/${maxRetries}: Testing ${data.url}`);
console.log("✅ Server responded!");
console.log("🎉 Setting preview URL:", data.url);
```

### 3. **Iframe Error Handling**

Added event handlers to catch iframe issues:

```typescript
<iframe
  onLoad={() => console.log("✅ Iframe loaded successfully!")}
  onError={(e) => console.error("❌ Iframe error:", e)}
/>
```

## Testing Instructions

### Step 1: Clear Old Sandboxes

```bash
# In your terminal, restart the dev server
npm run dev
```

### Step 2: Open Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Clear any old logs

### Step 3: Start Preview

1. Click "Start Next.js Preview" button
2. Watch BOTH:
   - **Terminal logs** (backend)
   - **Browser console logs** (frontend)

### Step 4: Collect Diagnostic Info

**From Terminal (Backend):**

```
Look for:
✅ Dependencies installed
✅ Next.js dev server started (PID: ...)
✅ Next.js server is ready and compiled!
✅ Port 3000 is listening
🌐 Sandbox URL: https://[sandbox-id].e2b.app
📍 Sandbox ID: [id]
```

**From Browser Console (Frontend):**

```
Look for:
📦 Sandbox created: {...}
🔗 Preview URL: https://[sandbox-id].e2b.app
🔍 Attempt 1/5: Testing https://...
✅ Server responded!
🎉 Setting preview URL: https://...
✅ Iframe loaded successfully!
```

### Step 5: Manual URL Test

Copy the sandbox URL from the console logs and:

1. Open it in a **new browser tab** (not iframe)
2. Does the Next.js page load?
3. Are there any errors in the console?
4. Take a screenshot if there are issues

## Expected Results

### ✅ Success Case

```
Terminal: ✅ Ready in 2.2s
Browser:  📦 Sandbox created
Browser:  🔍 Attempt 1/5: Testing https://...
Browser:  ✅ Server responded!
Browser:  🎉 Setting preview URL
Browser:  ✅ Iframe loaded successfully!
Preview:  Shows Next.js app
```

### ❌ Failure Scenarios

**Scenario A: URL Test Fails**

```
Manual URL test → Shows error page
→ Problem: E2B sandbox networking issue
→ Solution: Check E2B getHost() method, verify port exposure
```

**Scenario B: URL Works, Iframe Fails**

```
Manual URL test → Works!
Iframe → Blank/stuck
→ Problem: CORS or X-Frame-Options blocking iframe
→ Solution: Add headers to Next.js config
```

**Scenario C: Connection Timeout**

```
Browser: 🔍 Attempt 1/5: Testing https://...
Browser: ⚠️  Attempt 1 failed
Browser: (repeats 5 times)
→ Problem: Sandbox not accessible from internet
→ Solution: Verify E2B firewall rules, check 0.0.0.0 binding
```

## Common Issues & Solutions

### Issue 1: "Mixed Content" Error

**Symptom:** Console shows "blocked loading mixed active content"
**Cause:** Trying to load HTTP iframe from HTTPS page
**Solution:** Ensure sandbox URL uses HTTPS (it should: `https://[id].e2b.app`)

### Issue 2: "Refused to Frame" Error

**Symptom:** Console shows "Refused to display in a frame"
**Cause:** X-Frame-Options header blocking iframe
**Solution:** Add to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
      ],
    },
  ];
}
```

### Issue 3: CORS Error

**Symptom:** Console shows "CORS policy blocked"
**Cause:** Cross-origin restrictions
**Solution:** This shouldn't happen with E2B URLs, but if it does, the iframe sandbox attribute should handle it

### Issue 4: Blank Iframe

**Symptom:** Iframe loads (onLoad fires) but shows white screen
**Cause:** JavaScript error in Next.js app, or React hydration issue
**Solution:** Check browser console for React/Next.js errors inside iframe context

## Next Steps

After collecting the diagnostic info above, we can:

1. **If URL works in new tab but not iframe** → Fix iframe security headers
2. **If URL doesn't work at all** → Fix E2B port exposure or getHost() method
3. **If iframe loads but is blank** → Debug Next.js app itself

## Quick Debug Checklist

- [ ] Terminal shows "✅ Ready in 2.2s"
- [ ] Terminal shows "🌐 Sandbox URL: https://..."
- [ ] Browser console shows "📦 Sandbox created"
- [ ] Browser console shows preview URL
- [ ] Can open URL in new tab manually
- [ ] URL loads Next.js app in new tab
- [ ] Iframe shows preview (or blank screen)
- [ ] Browser console shows iframe errors (if any)

## Files Modified

1. `src/components/coding-interface/PreviewPanel.tsx`

   - Reduced unnecessary wait times
   - Added comprehensive console logging
   - Added iframe error handlers

2. `src/app/api/sandbox/[projectId]/route.ts` (previous fix)
   - Already logging sandbox URL and ID
   - Server starts successfully in 2-3 seconds

## Performance Improvements

- **Before:** 20-30 seconds minimum wait time
- **After:** 2-10 seconds typical load time
- **Benefit:** Much faster preview startup, better user experience
