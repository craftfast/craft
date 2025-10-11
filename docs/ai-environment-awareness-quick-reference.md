# AI System Prompt Reference - Quick Guide

## 🎯 What the AI Knows

### Environment Information

```typescript
Sandbox Type: E2B Code Interpreter
Working Directory: /home/user
Framework: Next.js 15.1.3
Runtime: Node.js
Port: 3000
Hot Reload: Enabled ✅
```

### File Structure

```
/home/user/
├── src/
│   ├── app/              # Pages & API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── styles/           # CSS
├── public/               # Static files
└── config files          # package.json, etc.
```

### Available Tools

#### 1. File Creation

````typescript
// Syntax the AI uses:
```typescript // src/components/Button.tsx
export default function Button() {
  return <button>Click me</button>;
}
```;

// This creates: /home/user/src/components/Button.tsx
````

#### 2. Live Preview

- Next.js dev server auto-starts on port 3000
- Hot Module Replacement (HMR) enabled
- No manual restarts needed
- Changes appear within 1-2 seconds

#### 3. Design System

**Colors:** ONLY neutral-_, stone-_, gray-\*
**Borders:** rounded-full, rounded-lg, rounded-xl, rounded-2xl
**Dark Mode:** Always support with dark: variants

## 🚀 How It Works

### 1. Project Creation Flow

```
User creates project
    ↓
Template generated → Saved to database
    ↓
User sends first prompt
    ↓
AI generates files
    ↓
Files saved & visible in Code tab
    ↓
AI completes generation
    ↓
Sandbox starts automatically
    ↓
Preview becomes available
```

### 2. AI Generation Phases

**Phase 1: Understanding**

- AI receives environment info
- Knows available tools
- Understands constraints

**Phase 2: Generation**

- Creates files with proper paths
- Uses design system colors
- Follows Next.js conventions

**Phase 3: Completion**

- Files extracted from code blocks
- Saved to database
- Triggers sandbox start

### 3. Sandbox Lifecycle

**Inactive** → (Files ready + AI done) → **Loading** → **Running**

```typescript
// PreviewPanel checks:
if (
  sandboxStatus === "inactive" &&
  Object.keys(projectFiles).length > 0 &&
  !isGeneratingFiles // ✅ Wait for AI to finish
) {
  startSandbox();
}
```

## 📝 System Prompt Structure

### Coding Prompt

```typescript
getSystemPrompt("coding");
```

**Includes:**

- Technology stack (Next.js 15, React 19, TypeScript, Tailwind)
- Sandbox environment details (E2B, Node.js, ports)
- File creation syntax
- Design system rules
- Best practices
- Example interactions

### Naming Prompt

```typescript
getSystemPrompt("naming");
```

**Includes:**

- Naming conventions
- Format rules (lowercase, hyphens)
- Good vs bad examples

### General Prompt

```typescript
getSystemPrompt("general");
```

**Includes:**

- Platform features
- Troubleshooting help
- General guidance

## 🔧 API Usage

### Chat API

```typescript
POST /api/chat
{
  messages: [...],
  taskType: 'coding' | 'naming' | 'general'
}
```

**Response:**

- Streams text response
- Uses appropriate system prompt
- Claude for coding, Grok for naming/general

### Sandbox API

```typescript
POST / api / sandbox / [projectId];
{
  files: {
    /* file paths -> content */
  }
}
```

**Behavior:**

- Requires files (no hardcoded fallback)
- Returns error if no files provided
- Forces AI-driven generation

## 💡 Key Differences from Before

### Before

```typescript
// ❌ Hardcoded template
const files = getDefaultNextJsFiles();

// ❌ Sandbox starts immediately
startSandbox();

// ❌ AI unaware of environment
systemPrompt = "You are a Next.js developer...";
```

### After

```typescript
// ✅ AI-generated files only
const files = projectFiles || {};

// ✅ Sandbox waits for AI completion
if (!isGeneratingFiles) startSandbox();

// ✅ AI fully aware of environment
systemPrompt = getCodingSystemPrompt(); // Includes full env details
```

## 🎨 Design System Constraints

### Colors

```typescript
✅ ALLOWED:
- neutral-50 to neutral-950
- stone-50 to stone-950
- gray-50 to gray-950

❌ FORBIDDEN:
- blue-*, red-*, green-*, yellow-*
- purple-*, pink-*, indigo-*, cyan-*
- All other color variants
```

### Borders

```typescript
✅ REQUIRED on interactive elements:
- rounded-full  (buttons, badges)
- rounded-lg    (inputs, cards)
- rounded-xl    (modals, panels)
- rounded-2xl   (containers, sections)

❌ AVOID:
- rounded-none (sharp corners)
```

### Dark Mode

```typescript
✅ REQUIRED:
<div className="bg-white dark:bg-neutral-900">
  <p className="text-neutral-900 dark:text-neutral-100">
    Content
  </p>
</div>
```

## 🧪 Testing Checklist

- [ ] AI receives correct environment info
- [ ] Files created with proper paths
- [ ] Sandbox waits for AI completion
- [ ] Preview shows AI-generated code
- [ ] No hardcoded template appears
- [ ] Design system rules followed
- [ ] Dark mode supported
- [ ] HMR works correctly

## 📚 Related Files

**System Prompts:**

- `src/lib/ai/system-prompts.ts` - Main prompt configuration

**API Routes:**

- `src/app/api/chat/route.ts` - AI chat endpoint
- `src/app/api/sandbox/[projectId]/route.ts` - Sandbox management

**Components:**

- `src/components/CodingInterface.tsx` - Parent coordinator
- `src/components/coding-interface/ChatPanel.tsx` - AI interaction
- `src/components/coding-interface/PreviewPanel.tsx` - Sandbox preview

**Templates:**

- `src/lib/templates/nextjs.ts` - Initial project template

## 🔍 Debugging

### Check Environment Awareness

```typescript
// In browser console:
console.log("System prompt preview:", getSystemPrompt("coding"));
```

### Verify Generation Status

```typescript
// In CodingInterface:
console.log("Is generating:", isGeneratingFiles);

// In PreviewPanel:
console.log(
  "Should start sandbox:",
  !isGeneratingFiles && Object.keys(projectFiles).length > 0
);
```

### Monitor File Creation

```typescript
// In ChatPanel:
console.log("Extracted files:", extractedFiles.length);
console.log(
  "File paths:",
  extractedFiles.map((f) => f.path)
);
```

## 🎯 Success Criteria

✅ AI generates appropriate code for E2B environment
✅ File paths are relative to `/home/user`
✅ Design system constraints are followed
✅ Sandbox starts only after files are ready
✅ Preview shows AI-generated content
✅ No hardcoded templates used
✅ HMR provides instant updates

## 📖 Further Reading

- [Full Implementation Guide](./ai-environment-awareness-implementation.md)
- [Design System Documentation](./design-system.md)
- [E2B Preview Setup](./e2b-preview-setup.md)
- [Professional Project Creation](./professional-project-creation-summary.md)
