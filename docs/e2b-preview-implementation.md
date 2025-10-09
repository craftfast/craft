# E2B Preview Implementation

## Overview

Implemented live app preview using E2B Code Interpreter, allowing users to see their applications running in real-time within the coding interface.

## Architecture

### Tech Stack

- **E2B Code Interpreter**: Cloud-based sandboxes for running code
- **Next.js API Routes**: Backend endpoints for sandbox management
- **React**: Frontend preview panel with iframe rendering

### Flow

```
User clicks "Start Preview"
       ↓
Frontend calls /api/sandbox/[projectId] POST
       ↓
Backend creates E2B sandbox
       ↓
Backend writes project files to sandbox
       ↓
Backend returns preview URL
       ↓
Frontend renders iframe with preview URL
       ↓
User sees live app running
```

## API Endpoints

### 1. Create/Get Sandbox

**Endpoint**: `POST /api/sandbox/[projectId]`

Creates a new sandbox or returns existing one.

**Request Body**:

```json
{
  "files": {
    "/index.html": "<html>...</html>",
    "/package.json": "{...}",
    "/src/App.tsx": "..."
  }
}
```

**Response**:

```json
{
  "sandboxId": "project-id",
  "url": "https://sandbox-id.e2b.dev",
  "status": "running"
}
```

### 2. Check Sandbox Status

**Endpoint**: `GET /api/sandbox/[projectId]`

Checks if a sandbox is running.

**Response**:

```json
{
  "sandboxId": "project-id",
  "url": "https://sandbox-id.e2b.dev",
  "status": "running"
}
```

### 3. Stop Sandbox

**Endpoint**: `DELETE /api/sandbox/[projectId]`

Stops and removes the sandbox.

**Response**:

```json
{
  "status": "closed"
}
```

### 4. Execute Code (Future)

**Endpoint**: `POST /api/sandbox/[projectId]/execute`

Executes code in the sandbox.

**Request Body**:

```json
{
  "command": "npm install && npm run dev"
}
```

## Components

### PreviewPanel.tsx

Main preview component with:

- **States**: inactive, loading, running, error
- **Device modes**: mobile (375px), tablet (768px), desktop (100%)
- **Controls**: Start/Stop preview, refresh, device switcher

**Props**:

```typescript
interface PreviewPanelProps {
  projectId: string;
  projectFiles?: Record<string, string>;
}
```

**Key Features**:

- Auto-checks for existing sandbox on mount
- Responsive device preview
- Error handling with retry
- Stop button overlay on iframe

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
E2B_API_KEY=your-e2b-api-key
```

Get your API key from: https://e2b.dev/dashboard

### Sandbox Lifecycle

- **Creation**: On-demand when user clicks "Start Preview"
- **Timeout**: 30 minutes of inactivity
- **Cleanup**: Automatic cleanup runs every 5 minutes
- **Storage**: In-memory (use Redis for production)

## Pricing

E2B Pricing (as of October 2025):

- **Cost**: $0.025/hour per sandbox
- **Free Tier**: 100 hours/month
- **Estimated**: ~$18/month per active user (assuming 24 hours/month usage)

## Security

### Sandbox Isolation

- Each project gets its own isolated sandbox
- Sandboxes run in secure cloud containers
- No access to other projects' data

### Authentication

- All API endpoints require NextAuth session
- Project ownership verification before sandbox access

### iframe Sandbox

```html
<iframe
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
  src="{sandboxUrl}"
/>
```

## Future Enhancements

### Phase 1 (Current)

- [x] Basic sandbox creation
- [x] File upload to sandbox
- [x] Preview URL generation
- [x] Device responsive preview

### Phase 2 (Next)

- [ ] Real-time file sync (WebSocket)
- [ ] Console output streaming
- [ ] Package installation UI
- [ ] Build logs display

### Phase 3 (Advanced)

- [ ] Multi-port support
- [ ] Database integration
- [ ] Environment variables UI
- [ ] Collaborative editing

### Phase 4 (Scale)

- [ ] Redis for sandbox state
- [ ] Sandbox pooling for faster startup
- [ ] CDN for static assets
- [ ] Analytics and monitoring

## Limitations

### Current

- No hot module reloading (requires page refresh)
- Single port preview (port 3000)
- In-memory sandbox storage (restarts clear state)
- 30-minute timeout limit

### E2B Platform

- Node.js focused (Python support limited)
- No native binary execution
- Internet access limited
- Max 2GB memory per sandbox

## Troubleshooting

### Sandbox Won't Start

1. Check E2B_API_KEY is set correctly
2. Verify E2B account has credits
3. Check console for error messages
4. Try deleting and recreating sandbox

### Preview Not Loading

1. Check if sandbox is actually running (GET endpoint)
2. Verify iframe sandbox attributes
3. Check browser console for CORS errors
4. Ensure preview URL is accessible

### Timeout Issues

1. Increase SANDBOX_TIMEOUT if needed
2. Implement keep-alive pings
3. Use Redis for persistent state

## Comparison with Alternatives

| Feature    | E2B        | WebContainers | Vercel Preview |
| ---------- | ---------- | ------------- | -------------- |
| Cost       | $0.025/hr  | $500-2000/yr  | Free tier      |
| Startup    | ~2 seconds | <1 second     | ~30-60 seconds |
| Full-stack | ✅ Yes     | ✅ Yes        | ✅ Yes         |
| In-browser | ❌ No      | ✅ Yes        | ❌ No          |
| Node.js    | ✅ Yes     | ✅ Yes        | ✅ Yes         |
| Hot reload | ⚠️ Manual  | ✅ Auto       | ✅ Auto        |

## References

- [E2B Documentation](https://e2b.dev/docs)
- [E2B Code Interpreter SDK](https://github.com/e2b-dev/code-interpreter)
- [E2B Pricing](https://e2b.dev/pricing)
- [Sandbox API Reference](https://e2b.dev/docs/api/sandbox)

## Implementation Checklist

- [x] Install @e2b/code-interpreter package
- [x] Create sandbox API endpoints
- [x] Update PreviewPanel component
- [x] Add E2B_API_KEY to environment
- [x] Implement device responsive preview
- [x] Add error handling
- [x] Add start/stop controls
- [x] Document implementation
- [ ] Add to production deployment
- [ ] Set up monitoring
- [ ] Configure Redis for state
- [ ] Add analytics tracking
