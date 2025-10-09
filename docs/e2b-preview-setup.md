# E2B Preview Setup Guide

## Quick Start

Follow these steps to set up the E2B preview feature in your Craft development environment.

## Prerequisites

- Node.js 18+ installed
- Craft project running locally
- NextAuth configured
- Database setup complete

## Step 1: Get E2B API Key

1. Go to [E2B Dashboard](https://e2b.dev/dashboard)
2. Sign up or log in
3. Click "API Keys" in the sidebar
4. Click "Create API Key"
5. Copy your API key

## Step 2: Add API Key to Environment

1. Open your `.env.local` file (or create it if it doesn't exist)
2. Add the following line:

```bash
E2B_API_KEY=your-e2b-api-key-here
```

3. Replace `your-e2b-api-key-here` with the key you copied

## Step 3: Install Dependencies

The E2B package has already been installed. If you need to reinstall:

```bash
npm install @e2b/code-interpreter
```

## Step 4: Restart Development Server

```bash
npm run dev
```

## Step 5: Test the Preview

1. Log in to your Craft account
2. Create a new project or open an existing one
3. Go to the coding interface (`/chat/[project-id]`)
4. Click on the "Preview" tab
5. Click "Start Preview" button
6. Wait for the sandbox to initialize (~2-3 seconds)
7. Your app should appear in the iframe!

## Troubleshooting

### Error: "E2B_API_KEY is not defined"

**Solution**: Make sure you added the API key to `.env.local` and restarted the dev server.

### Error: "Failed to create sandbox"

**Possible causes**:

1. Invalid API key - check if you copied it correctly
2. No credits in E2B account - check your dashboard
3. Network issues - check your internet connection

**Solution**:

- Verify API key in `.env.local`
- Check E2B dashboard for account status
- Check browser console for detailed error messages

### Preview iframe is blank

**Possible causes**:

1. App isn't serving on port 3000
2. Build/runtime errors in the app
3. CORS or iframe sandbox restrictions

**Solution**:

- Check if sandbox URL is accessible directly
- Look for errors in browser console
- Verify iframe sandbox attributes

### Sandbox takes too long to start

**Expected behavior**: Sandboxes should start in 2-3 seconds.

**If slower**:

- Check E2B status page
- Your internet connection
- E2B API rate limits

## Development Tips

### Testing Locally

```bash
# Start your dev server
npm run dev

# Open browser
http://localhost:3000

# Create a test project
# Navigate to /chat/[project-id]
# Click Preview tab
# Click Start Preview
```

### Debugging API Calls

Check Network tab in browser DevTools:

```
POST /api/sandbox/[projectId] - Creates sandbox
GET /api/sandbox/[projectId] - Checks status
DELETE /api/sandbox/[projectId] - Stops sandbox
```

### Viewing Sandbox Logs

Server-side logs appear in your terminal:

```
Creating sandbox for project: abc123
Closed sandbox for project: abc123
```

## Configuration Options

### Sandbox Timeout

Default: 30 minutes

To change, edit `src/app/api/sandbox/[projectId]/route.ts`:

```typescript
const SANDBOX_TIMEOUT = 30 * 60 * 1000; // Change to desired milliseconds
```

### Cleanup Interval

Default: Check every 5 minutes

To change:

```typescript
}, 5 * 60 * 1000); // Change to desired milliseconds
```

## Production Deployment

### Environment Variables

Add to your production environment:

```bash
E2B_API_KEY=your-production-e2b-api-key
```

### Recommended Setup

1. **Use Redis** for sandbox state instead of in-memory storage
2. **Enable monitoring** to track sandbox usage
3. **Set up alerts** for API errors or quota limits
4. **Configure rate limiting** to prevent abuse

### Redis Setup (Recommended for Production)

```bash
npm install ioredis
```

Update sandbox route to use Redis:

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Store sandbox data
await redis.set(`sandbox:${projectId}`, JSON.stringify(sandboxData));

// Retrieve sandbox data
const data = await redis.get(`sandbox:${projectId}`);
```

## Cost Management

### E2B Pricing

- **Free Tier**: 100 hours/month
- **Pay-as-you-go**: $0.025/hour per sandbox

### Cost Optimization

1. **Implement timeout**: Auto-stop inactive sandboxes
2. **Cleanup scheduler**: Regular cleanup of old sandboxes
3. **User limits**: Limit sandboxes per user
4. **Monitoring**: Track usage patterns

### Estimated Costs

| Users | Hours/User/Month | Cost/Month |
| ----- | ---------------- | ---------- |
| 10    | 10               | $2.50      |
| 50    | 10               | $12.50     |
| 100   | 10               | $25.00     |
| 500   | 10               | $125.00    |

## Next Steps

After basic setup:

1. ✅ Test with sample projects
2. ✅ Verify all device modes work
3. ✅ Test start/stop functionality
4. ⬜ Set up Redis for production
5. ⬜ Add monitoring and alerts
6. ⬜ Implement rate limiting
7. ⬜ Add usage analytics

## Support

- [E2B Documentation](https://e2b.dev/docs)
- [E2B Discord](https://discord.gg/U7KEcGErtQ)
- [E2B GitHub](https://github.com/e2b-dev)

## Related Documentation

- [E2B Preview Implementation](./e2b-preview-implementation.md)
- [Coding Interface](./vibe-coding-interface.md)
- [API Reference](./api-reference.md)
