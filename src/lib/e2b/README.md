# Craft E2B Template

Optimized E2B sandbox template for Craft with Node.js 24 and pnpm pre-installed.

## 🚀 Benefits

- **Fast Spawning**: ~150ms vs 60-90s for default sandbox + Node.js installation
- **Pre-configured**: Node.js 24 + pnpm 9.15.4 ready to use
- **Flexible**: AI can scaffold any framework (Next.js, Vite, Remix, etc.)
- **Clean**: No pre-installed projects - AI has full control

## 📦 What's Included

- **Node.js 24** (slim variant) - Latest LTS version
- **pnpm 9.15.4** - Fast, disk-efficient package manager
- **Empty workspace** - `/home/user/project` ready for scaffolding
- **Optimized environment** - Development-ready configuration

## 🏗️ Building the Template

### Development Template

Build and test the template locally:

```bash
pnpm e2b:build:dev
```

This creates a template named `craft-dev-env-dev` for testing.

### Production Template

Build the production template:

```bash
pnpm e2b:build:prod
```

This creates a template named `craft-dev-env` for production use.

## ⚙️ Configuration

Add the template ID to your environment variables:

### Development (`.env` or `.env.local`)

```env
E2B_TEMPLATE_ID=craft-dev-env-dev
```

### Production (Vercel/Deployment)

```env
E2B_TEMPLATE_ID=craft-dev-env
```

## 🧪 Testing

Verify the template is working:

```bash
pnpm e2b:verify
```

This script:

1. Creates a sandbox from the template
2. Verifies Node.js and pnpm are available
3. Tests create-next-app execution
4. Measures spawn time
5. Cleans up resources

## 📋 Template Specification

```typescript
Template()
  .fromNodeImage("24-slim") // Node.js 24 LTS
  .aptInstall(["curl", "ca-certificates"])
  .runCmd(
    "curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=9.15.4 sh -"
  )
  .setWorkdir("/home/user/project")
  .setEnvs({
    PATH: "/home/user/.local/share/pnpm:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    TURBOPACK_ENABLED: "1",
  });
```

## 🔄 Rebuild Process

If you need to update the template:

1. **Modify** `src/lib/e2b/craft-template.ts`
2. **Build** development version: `pnpm e2b:build:dev`
3. **Test** with new template: `pnpm e2b:verify`
4. **Build** production: `pnpm e2b:build:prod`
5. **Update** environment variables in deployment

## 📊 Performance Comparison

| Scenario           | Time   | Description                              |
| ------------------ | ------ | ---------------------------------------- |
| **Default E2B**    | 60-90s | Install Node.js + pnpm + create-next-app |
| **Craft Template** | ~150ms | Spawn sandbox (Node.js + pnpm ready)     |
|                    | +60s   | Run create-next-app only                 |
| **Total Savings**  | ~30s   | Faster initial setup                     |

## 🛠️ Troubleshooting

### Template build fails

```bash
# Check E2B API key
echo $E2B_API_KEY

# Verify connectivity
curl -H "Authorization: Bearer $E2B_API_KEY" https://api.e2b.dev/sandboxes
```

### Sandbox spawn is slow

1. Check if template ID is set: `echo $E2B_TEMPLATE_ID`
2. Verify template exists in E2B dashboard
3. Check logs for "Using optimized Craft template" message

### Template not found

Rebuild the template:

```bash
pnpm e2b:build:dev
# or
pnpm e2b:build:prod
```

## � Screenshot Capture (Chrome + Puppeteer)

The template includes Chrome + Puppeteer for screenshot capture:

**What's Included:**

- ✅ Chromium browser + all dependencies
- ✅ Puppeteer npm package
- ✅ Screenshot utility: `src/lib/screenshot/capture.ts`
- ✅ Screenshot API: `src/app/api/screenshot/route.ts`

**How It Works:**

1. Your Vercel API calls: `https://sandbox-url.e2b.dev/api/screenshot`
2. E2B sandbox uses local Chrome to capture `localhost:3000`
3. Sandbox returns PNG buffer
4. Vercel uploads to Cloudflare R2

**Benefits:**

- ✅ No Chrome on Vercel (bypasses 50MB limit)
- ✅ Fast capture (localhost, no network latency)
- ✅ Accurate screenshots (same environment as app)
- ✅ No external screenshot services needed

See [`docs/project-screenshot-capture-summary.md`](../../docs/project-screenshot-capture-summary.md) for details.

## 📝 Notes

- Template is immutable after building
- Changes require rebuilding and updating template ID
- Multiple versions can coexist (dev vs prod)
- Old templates can be deleted from E2B dashboard

## 🔗 Related Files

- **Template Definition**: `src/lib/e2b/craft-template.ts`
- **Build Scripts**: `src/lib/e2b/build-template-*.ts`
- **Sandbox Manager**: `src/lib/e2b/sandbox-manager.ts`
- **Verification Script**: `scripts/verify-e2b-template.ts`
- **Screenshot Docs**: `docs/project-screenshot-capture-summary.md`
