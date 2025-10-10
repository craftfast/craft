# Browser-Based Sandbox vs E2B - Complete Comparison

## Overview

Comparing **client-side browser execution** (WebContainers/WebAssembly) vs **server-side cloud sandboxes** (E2B) for running Next.js previews in Craft.

---

## 🌐 Browser-Based Solutions (WebContainers/WASM)

### What Is It?

Runs **entire Node.js environment inside the user's browser** using WebAssembly. No backend required!

**Technologies:**

- **WebContainers** by StackBlitz (proprietary, $500-2000/yr)
- **Nodebox** by CodeSandbox (open-source alternative)
- **WebAssembly** (WASM) - Low-level runtime

### How It Works

```
┌─────────────────────────────────────────┐
│         User's Browser                  │
│  ┌───────────────────────────────────┐  │
│  │   WebContainer (WASM)             │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Node.js Runtime            │  │  │
│  │  │  npm, Next.js, React        │  │  │
│  │  │  File System (Virtual)      │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  → Runs on localhost:3000        │  │
│  │  → Hot Module Reload built-in    │  │
│  │  → No server needed!             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Architecture Example

```typescript
// Using WebContainers API
import { WebContainer } from "@webcontainer/api";

// 1. Boot WebContainer in browser
const webContainer = await WebContainer.boot();

// 2. Mount files directly
await webContainer.mount({
  "package.json": {
    file: { contents: JSON.stringify(packageJson) },
  },
  "src/app/page.tsx": {
    file: { contents: pageCode },
  },
});

// 3. Install dependencies
await webContainer.spawn("npm", ["install"]);

// 4. Start dev server
await webContainer.spawn("npm", ["run", "dev"]);

// 5. Get localhost URL (runs in browser!)
const url = "http://localhost:3000"; // Actually works!
```

### ✅ Advantages

1. **Zero Backend Cost**

   - Runs entirely in user's browser
   - No cloud compute needed
   - No E2B subscription required

2. **Instant Startup**

   - No container spin-up time
   - <1 second to ready
   - Cached across sessions

3. **True Hot Module Reload**

   - Built-in file watching
   - Instant updates
   - No iframe refresh needed

4. **Offline Capable**

   - Works without internet
   - Cache dependencies
   - Local-first experience

5. **Unlimited Scale**

   - Each user runs their own sandbox
   - No server load
   - No concurrent limits

6. **Perfect for Demos**
   - StackBlitz-like experience
   - Share URL, opens instantly
   - No server dependency

### ❌ Disadvantages

1. **License Costs**

   - WebContainers: $500-2000/year (commercial license)
   - Not free for production use
   - Per-developer pricing

2. **Browser Requirements**

   - Requires modern browser (Chrome 90+, Firefox 88+)
   - ~100MB initial download
   - RAM intensive (512MB - 2GB per tab)
   - Mobile browsers limited/unsupported

3. **Limited Environment**

   - No native binaries
   - No system calls
   - No real file system access
   - Can't run databases (Postgres, etc.)
   - Limited to Node.js ecosystem

4. **Slow First Load**

   - Initial WebContainer download: 10-30 seconds
   - npm install in browser slower than server
   - First project takes 30-60s

5. **Limited Backend Features**

   - No real networking (fetch works, but limited)
   - Can't connect to external databases
   - No server-side secrets
   - API routes limited

6. **Not All Packages Work**
   - Some npm packages fail in WASM
   - Native dependencies broken
   - Sharp, canvas, etc. problematic

### Example Implementation

```tsx
// PreviewPanel.tsx using WebContainers
"use client";

import { WebContainer } from "@webcontainer/api";
import { useState, useEffect } from "react";

export default function PreviewPanel({ files }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("booting");

  useEffect(() => {
    async function startContainer() {
      // 1. Boot WebContainer (happens once per page load)
      const webContainer = await WebContainer.boot();

      // 2. Mount project files
      await webContainer.mount(files);

      // 3. Install dependencies
      setStatus("installing");
      const install = await webContainer.spawn("npm", ["install"]);
      await install.exit;

      // 4. Start dev server
      setStatus("starting");
      const dev = await webContainer.spawn("npm", ["run", "dev"]);

      // 5. Wait for server ready
      webContainer.on("server-ready", (port, url) => {
        setUrl(url);
        setStatus("running");
      });
    }

    startContainer();
  }, [files]);

  // 6. Auto-updates on file change!
  useEffect(() => {
    if (webContainer) {
      // WebContainers handle hot-reload automatically
      webContainer.fs.writeFile("src/app/page.tsx", files["src/app/page.tsx"]);
    }
  }, [files]);

  return <iframe src={url} />;
}
```

---

## ☁️ E2B (Current Implementation)

### What Is It?

**Cloud-based Docker containers** that run your code on E2B's servers.

### How It Works

```
┌─────────────────────────────────────────┐
│         User's Browser                  │
│  ┌───────────────────────────────────┐  │
│  │   <iframe src=e2b.dev/>           │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│      Your Next.js API                   │
│  /api/sandbox/[projectId]               │
└──────────────┬──────────────────────────┘
               │ E2B SDK
               ▼
┌─────────────────────────────────────────┐
│         E2B Cloud                       │
│  ┌───────────────────────────────────┐  │
│  │   Docker Container                │  │
│  │  - Real Ubuntu environment        │  │
│  │  - Full Node.js                   │  │
│  │  - Real file system               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### ✅ Advantages

1. **True Full-Stack**

   - Real Linux environment
   - Any package works
   - Native binaries supported
   - Can run databases

2. **Pay-As-You-Go**

   - $0.025/hour per sandbox
   - Free tier: 100 hours/month
   - Only pay when running
   - ~$18/month per active user

3. **No Client Requirements**

   - Works on any browser
   - Works on mobile
   - No WASM download
   - Low client memory usage

4. **Fast After First Time**

   - With templates: 3-5 seconds
   - Pre-installed dependencies
   - Shared compute resources

5. **Better for AI**
   - Can run arbitrary code safely
   - Isolated per user
   - No browser limits
   - Full environment control

### ❌ Disadvantages

1. **Requires Backend**

   - Need API route
   - Need E2B API key
   - State management complexity
   - More code to maintain

2. **Costs Scale with Usage**

   - More users = more cost
   - Always-on projects expensive
   - Need to manage timeouts

3. **Manual Refresh**

   - No auto hot-reload
   - Need iframe key trick
   - Slower iteration

4. **Startup Time**

   - 2-3 seconds minimum
   - 20-30s without template
   - Network dependent

5. **Infrastructure Dependency**
   - E2B must be online
   - Your API must be online
   - More failure points

---

## 📊 Direct Comparison

| Feature                   | WebContainers       | E2B                  | Winner           |
| ------------------------- | ------------------- | -------------------- | ---------------- |
| **Cost (1000 users)**     | $500-2000/year      | ~$18k/year           | 🟢 WebContainers |
| **Cost (100 users)**      | $500-2000/year      | ~$1.8k/year          | 🟡 Tie           |
| **Cost (10 users)**       | $500-2000/year      | ~$180/year           | 🔴 E2B           |
| **Initial Startup**       | 10-30s (first load) | 3-5s (with template) | 🟢 E2B           |
| **Subsequent Startup**    | <1s (cached)        | 3-5s                 | 🟢 WebContainers |
| **Hot Reload**            | ✅ Automatic        | ⚠️ Manual refresh    | 🟢 WebContainers |
| **Full-Stack Support**    | ⚠️ Limited          | ✅ Full              | 🔴 E2B           |
| **Offline Mode**          | ✅ Works            | ❌ Requires internet | 🟢 WebContainers |
| **Mobile Support**        | ❌ Limited          | ✅ Full              | 🔴 E2B           |
| **Browser Requirements**  | Modern only         | Any browser          | 🔴 E2B           |
| **Client RAM Usage**      | 512MB - 2GB         | <50MB                | 🔴 E2B           |
| **Package Compatibility** | ⚠️ ~90%             | ✅ 100%              | 🔴 E2B           |
| **Database Support**      | ❌ No               | ✅ Yes               | 🔴 E2B           |
| **Backend Code**          | ✅ Client-only      | ⚠️ Need API          | 🟢 WebContainers |
| **Scalability**           | ✅ Unlimited        | ⚠️ Pay per use       | 🟢 WebContainers |
| **Security**              | ⚠️ Browser sandbox  | ✅ Full isolation    | 🔴 E2B           |

---

## 🎯 Recommendation for Craft

### Current Situation

- You're building an **AI coding assistant**
- Users create **Next.js projects**
- Need **live preview**
- **Simple projects** (no complex backends initially)

### Best Choice: **WebContainers** 🎉

**Why:**

1. **Better UX**

   - Instant hot-reload
   - Faster iteration for users
   - Feels more responsive
   - Offline capability

2. **Better Economics at Scale**

   ```
   E2B Cost:
   - 1 user  = $18/month
   - 100 users = $1,800/month
   - 1000 users = $18,000/month

   WebContainers Cost:
   - Any users = $500-2000/year = $42-167/month
   ```

3. **Perfect for Your Use Case**

   - Next.js is well-supported
   - React/Tailwind work perfectly
   - No databases needed (initially)
   - Simple API routes work

4. **Competitive Advantage**
   - StackBlitz-quality experience
   - Instant sharing
   - Works offline
   - Lower latency

### Implementation Path

**Phase 1: Start with E2B (Current)** ✅

- You already have this working
- Validates the product
- No upfront license cost
- Good for MVP/testing

**Phase 2: Add WebContainers (When Growing)**

```typescript
// Hybrid approach - best of both worlds!

// Use WebContainers for simple projects
if (project.type === "nextjs" && !project.hasDatabase) {
  return <PreviewPanelWebContainer />;
}

// Use E2B for complex projects
if (project.hasDatabase || project.hasNativeDeps) {
  return <PreviewPanelE2B />;
}
```

**Phase 3: Optimize**

- Buy WebContainers license ($500-2000/year)
- Move 80% of projects to WebContainers
- Keep E2B for complex projects
- Save $15k+/year at scale

---

## 💻 Implementation Difficulty

### WebContainers: **Medium Difficulty** ⚙️

**Time Estimate:** 2-3 weeks

**What You Need to Build:**

```typescript
// 1. Install package
npm install @webcontainer/api

// 2. Boot container (100 lines)
// src/lib/webcontainer.ts
export async function bootWebContainer() {
  const wc = await WebContainer.boot();
  return wc;
}

// 3. Mount files (50 lines)
export async function mountFiles(wc, files) {
  await wc.mount(files);
}

// 4. Install & start (50 lines)
export async function startDevServer(wc) {
  await wc.spawn('npm', ['install']);
  await wc.spawn('npm', ['run', 'dev']);
}

// 5. Update preview component (200 lines)
// src/components/PreviewPanelWebContainer.tsx
// - Boot container
// - Mount files
// - Start server
// - Handle updates
```

**Total: ~400 lines** (vs 493 for E2B route)

**Challenges:**

- License purchase
- Browser compatibility testing
- Error handling for failed packages
- Fallback for unsupported browsers

**Benefits:**

- Simpler than building custom sandbox
- Well-documented API
- Active community
- Used by StackBlitz, CodeSandbox

### E2B: **Already Done** ✅

You have this working! Just optimize with templates.

---

## 🚀 Recommended Timeline

### Immediate (This Month)

✅ **Keep E2B, optimize with templates**

- Create E2B template (1 day)
- Get 10x faster startups
- Validate product-market fit

### Next Quarter (When Revenue > $1k/month)

🎯 **Add WebContainers**

- Buy license: $500-2000
- Implement hybrid system: 2-3 weeks
- A/B test user preference

### Future (When Users > 1000)

💰 **Economics force the decision**

- WebContainers saves ~$15k/year
- Keep E2B as premium tier?
- Or migrate fully to WebContainers

---

## 🔧 Code Comparison

### E2B (Current)

```typescript
// Backend API route required
// /api/sandbox/[projectId]/route.ts (493 lines)
const sandbox = await Sandbox.create();
await sandbox.files.write(path, content);
return { url: `https://${sandbox.getHost(3000)}` };
```

### WebContainers (Alternative)

```typescript
// Client-side only, no backend!
// PreviewPanel.tsx (~400 lines)
const wc = await WebContainer.boot();
await wc.mount(files);
await wc.spawn("npm", ["run", "dev"]);
// URL is localhost:3000 in browser!
```

---

## 🎓 Final Verdict

**For Craft specifically:**

| Stage             | Use                  | Why                            |
| ----------------- | -------------------- | ------------------------------ |
| **Now** (MVP)     | E2B                  | Already working, validate idea |
| **Month 2-3**     | E2B + Templates      | 10x faster, optimize current   |
| **Revenue > $1k** | Test WebContainers   | Better UX, prepare for scale   |
| **Users > 500**   | Hybrid (Both)        | Simple → WC, Complex → E2B     |
| **Users > 2000**  | Mostly WebContainers | Economics force it             |

**Bottom Line:**

- **Don't build custom** - Way too hard ($250k+)
- **Keep E2B now** - Working is better than perfect
- **Plan WebContainers** - Better long-term economics
- **Hybrid is best** - Use right tool for each project

---

## 📚 Resources

### WebContainers

- [StackBlitz WebContainers](https://webcontainers.io/)
- [WebContainer API Docs](https://webcontainers.io/api)
- [Nodebox (Open Source)](https://sandpack.codesandbox.io/)
- [Tutorial](https://webcontainers.io/tutorial/1-build-your-first-webcontainer-app)

### E2B

- [E2B Docs](https://e2b.dev/docs)
- [Templates Guide](https://e2b.dev/docs/templates)
- [Pricing](https://e2b.dev/pricing)

### Comparisons

- [StackBlitz Blog: WebContainers](https://blog.stackblitz.com/posts/introducing-webcontainers/)
- [CodeSandbox: Nodebox](https://codesandbox.io/blog/announcing-sandpack-2)

---

**Last Updated**: October 10, 2025
**Status**: Recommendation - Use E2B now, plan WebContainers for scale
