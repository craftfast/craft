# E2B Fragments Analysis - Key Learnings

## Overview

Analysis of the e2b-dev/fragments repository to understand the correct way to implement E2B integration for running AI-generated code online.

**Repository**: https://github.com/e2b-dev/fragments

## Key Differences from Current Implementation

### 1. **API Architecture**

#### E2B Fragments Approach:

```typescript
// app/api/sandbox/route.ts
export async function POST(req: Request) {
  const { fragment, userID, teamID, accessToken } = await req.json();

  // Create sandbox with template
  const sbx = await Sandbox.create(fragment.template, {
    metadata: { template, userID, teamID },
    timeoutMs: sandboxTimeout,
    ...(teamID && accessToken
      ? {
          headers: {
            "X-Supabase-Team": teamID,
            "X-Supabase-Token": accessToken,
          },
        }
      : {}),
  });

  // Install dependencies if needed
  if (fragment.has_additional_dependencies) {
    await sbx.commands.run(fragment.install_dependencies_command);
  }

  // Write files to sandbox
  await sbx.files.write(fragment.file_path, fragment.code);

  // Return sandbox URL
  return new Response(
    JSON.stringify({
      sbxId: sbx.sandboxId,
      template: fragment.template,
      url: `https://${sbx.getHost(fragment.port || 80)}`,
    })
  );
}
```

**Key Points:**

- ✅ Single API endpoint that handles everything
- ✅ Uses E2B's `Sandbox.create()` method
- ✅ Writes files directly to the sandbox filesystem
- ✅ Returns the sandbox URL immediately
- ✅ No complex state management needed

#### Current Implementation Issues:

- ❌ Trying to fetch files from database
- ❌ Trying to update existing sandboxes
- ❌ Complex refresh logic
- ❌ Multiple API calls for same sandbox

### 2. **Sandbox Templates**

E2B Fragments uses **custom sandbox templates** that are pre-built with E2B CLI:

```dockerfile
# sandbox-templates/nextjs-developer/e2b.Dockerfile
FROM node:21-slim

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

RUN npx create-next-app@14.2.20 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-app --no-src-dir
COPY _app.tsx pages/_app.tsx

RUN npx shadcn@2.1.7 init -d
RUN npx shadcn@2.1.7 add --all
RUN npm install posthog-js

# Move the Nextjs app to the home directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app
```

**Template Configuration:**

```toml
# e2b.toml
start_cmd = "cd /home/user && npx next --turbo"
```

**Benefits:**

- ⚡ Fast startup (no npm install on each run)
- 📦 Pre-installed dependencies
- 🔄 Auto-reload on file changes
- 🚀 Production-ready setup

### 3. **File Management**

#### E2B Fragments:

```typescript
// Write files directly to sandbox
await sbx.files.write(fragment.file_path, fragment.code);
```

#### Current Implementation:

- ❌ Fetching files from API
- ❌ Storing files in database
- ❌ Complex file sync logic

**Recommendation:** AI generates code → Write directly to sandbox → Done!

### 4. **Preview Panel Architecture**

#### E2B Fragments:

```tsx
// components/fragment-web.tsx
export function FragmentWeb({ result }: { result: ExecutionResultWeb }) {
  const [iframeKey, setIframeKey] = useState(0);

  function refreshIframe() {
    setIframeKey((prevKey) => prevKey + 1);
  }

  return (
    <div className="flex flex-col w-full h-full">
      <iframe
        key={iframeKey}
        className="h-full w-full"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
        src={result.url}
      />
      {/* Simple refresh button */}
      <Button onClick={refreshIframe}>
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

**Key Points:**

- ✅ Simple iframe with key-based refresh
- ✅ No complex state management
- ✅ Sandbox URL comes from API
- ✅ No file watching needed

#### Current Implementation Issues:

- ❌ Complex auto-refresh logic
- ❌ Multiple state variables
- ❌ File change detection
- ❌ Manual update buttons

### 5. **Data Flow**

#### E2B Fragments Flow:

```
1. AI generates code
   ↓
2. Send to /api/sandbox with code
   ↓
3. Create E2B sandbox
   ↓
4. Write files to sandbox
   ↓
5. Return sandbox URL
   ↓
6. Display in iframe
```

#### Current Implementation:

```
1. AI generates code
   ↓
2. Save to database
   ↓
3. Fetch from database
   ↓
4. Send to sandbox API
   ↓
5. Try to update sandbox
   ↓
6. Complex refresh logic
```

## Implementation Recommendations

### 1. **Simplify API Route**

Replace `src/app/api/sandbox/[projectId]/route.ts` with:

```typescript
// app/api/sandbox/route.ts
import { Sandbox } from "@e2b/code-interpreter";

export async function POST(req: Request) {
  const { code, template = "nextjs-developer" } = await req.json();

  // Create sandbox
  const sbx = await Sandbox.create(template, {
    timeoutMs: 10 * 60 * 1000, // 10 minutes
  });

  // Write files
  if (Array.isArray(code)) {
    for (const file of code) {
      await sbx.files.write(file.path, file.content);
    }
  } else {
    await sbx.files.write("pages/index.tsx", code);
  }

  // Return URL
  return Response.json({
    url: `https://${sbx.getHost(3000)}`,
    sandboxId: sbx.sandboxId,
  });
}
```

### 2. **Simplify Preview Panel**

```tsx
// components/PreviewPanel.tsx
interface PreviewPanelProps {
  projectId: string;
  onStart: () => Promise<{ url: string }>;
}

export default function PreviewPanel({
  projectId,
  onStart,
}: PreviewPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const { url } = await onStart();
      setPreviewUrl(url);
    } finally {
      setIsLoading(false);
    }
  };

  if (!previewUrl) {
    return <button onClick={handleStart}>Start Preview</button>;
  }

  return <iframe src={previewUrl} className="w-full h-full" />;
}
```

### 3. **Create E2B Template**

```bash
# 1. Install E2B CLI
npm install -g @e2b/cli

# 2. Create template directory
mkdir sandbox-templates/nextjs-craft
cd sandbox-templates/nextjs-craft

# 3. Initialize template
e2b template init

# 4. Create e2b.Dockerfile
# (See example above)

# 5. Build template
e2b template build --name nextjs-craft

# 6. Get template ID and use in code
```

### 4. **Update Integration Flow**

Instead of:

1. ❌ Database storage
2. ❌ File API
3. ❌ Complex syncing

Do this:

1. ✅ AI generates code
2. ✅ Send code to `/api/sandbox`
3. ✅ Display URL in iframe

## Code Comparison

### Current Approach (Complex):

```typescript
// Multiple API calls, complex state
const [iframeUrl, setIframeUrl] = useState("");
const [previewUrl, setPreviewUrl] = useState("");
const [isRefreshing, setIsRefreshing] = useState(false);
const [sandboxStatus, setSandboxStatus] = useState("inactive");

// Check sandbox status
useEffect(() => {
  checkSandboxStatus();
}, [projectId]);

// Auto-refresh on file changes
useEffect(() => {
  updatePreview();
}, [projectFiles]);

// Update sandbox files
const updateSandboxFiles = async () => {
  const filesResponse = await fetch(`/api/files?projectId=${projectId}`);
  const response = await fetch(`/api/sandbox/${projectId}`, {
    method: "POST",
    body: JSON.stringify({ files: filesToUpdate }),
  });
  // Complex refresh logic...
};
```

### E2B Fragments (Simple):

```typescript
// Single state, single action
const [iframeKey, setIframeKey] = useState(0);

function refreshIframe() {
  setIframeKey((prev) => prev + 1);
}

return <iframe key={iframeKey} src={result.url} />;
```

## Environment Variables

```env
# .env.local
E2B_API_KEY=your-e2b-api-key

# Optional: Use custom templates
E2B_TEMPLATE_ID=nextjs-craft
```

## Benefits of E2B Fragments Approach

1. **Simplicity**: 90% less code
2. **Reliability**: No complex state management
3. **Performance**: Pre-built templates = faster startup
4. **Maintainability**: Easier to understand and debug
5. **Scalability**: E2B handles all the infrastructure

## Migration Path

### Phase 1: Simplify API

- Remove file storage API
- Simplify sandbox API to match E2B Fragments

### Phase 2: Update Preview Panel

- Remove auto-refresh logic
- Simplify to single iframe with URL

### Phase 3: Create Custom Template

- Build E2B template with dependencies
- Update API to use template

### Phase 4: Remove Database Complexity

- Stop storing files in database
- Let E2B handle file storage

## Conclusion

The E2B Fragments approach is significantly simpler and more reliable than our current implementation. The key insight is:

> **Don't fight E2B's design - embrace it!**

Instead of trying to manage files, state, and updates ourselves, we should:

1. Generate code with AI
2. Send it to E2B
3. Display the URL
4. Let E2B handle the rest

This is exactly how E2B was designed to work, and it's proven in production with Fragments.
