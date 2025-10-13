# Quick Start Guide - Testing AI Integration

## 🚀 Quick Setup (5 minutes)

### Step 1: Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Click "Sign Up" or "Log In"
3. Go to **Keys** section
4. Click "Create Key"
5. Copy your API key (starts with `sk-or-v1-...`)

### Step 2: Add API Key to Project

1. Open `.env` in your project root
2. Replace the placeholder with your actual key:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

3. Save the file

### Step 3: Add Credits (If Needed)

1. Go to [OpenRouter Billing](https://openrouter.ai/credits)
2. Add at least $5 in credits (recommended)
3. This gives you plenty of testing capacity

### Step 4: Test the Integration

Your dev server is already running at: **http://localhost:3000**

1. Open your browser to http://localhost:3000
2. Sign in to your account
3. Navigate to **Dashboard** or **Projects**
4. Open any project (or create a new one)
5. You should see the coding interface with a chat panel

### Step 5: Try These Test Prompts

**Simple Test:**

```
Hello! Can you help me build a Next.js app?
```

**Coding Task (Uses Claude Sonnet 4.5):**

```
Create a simple button component with a rounded design that changes color on hover. Use only neutral colors from Tailwind.
```

**Naming Task (Uses Grok-4 Fast):**

```
Suggest some names for a todo list app
```

**Component Generation:**

```
Build a responsive card component for displaying blog posts. It should have an image, title, description, and read more button. Use Tailwind and follow the design system.
```

## 📊 Expected Behavior

### When It Works:

- ✅ Message appears in chat immediately
- ✅ Assistant response streams in word by word
- ✅ Code blocks are highlighted with syntax colors
- ✅ Markdown is rendered (bold, lists, etc.)
- ✅ Dark mode works properly

### If You See Errors:

**"Failed to process chat request"**

- Check your API key in `.env`
- Verify you have credits in OpenRouter
- Restart the dev server: Stop and run `npm run dev` again

**No Response / Spinning**

- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for failed requests

**Code Blocks Not Highlighted**

- Try refreshing the page (Ctrl+R or Cmd+R)
- Clear browser cache

## 🎯 What to Look For

### Message Flow:

1. You type a message → Press Enter or click Send
2. Your message appears on the right (dark background)
3. AI response appears on the left (light background)
4. Response streams in real-time (you see it being written)
5. Code blocks appear with syntax highlighting

### Code Highlighting Example:

When Claude generates code, it should look like this:

```tsx
// This should have colors!
export default function Button() {
  return <button className="rounded-full">Click me</button>;
}
```

## 🔧 Debugging Tips

### Check API Key is Loaded:

1. Open browser DevTools → Console
2. The chat panel logs "Project ID: ..." when it loads
3. If you see errors about API keys, check `.env`

### Check Network Requests:

1. Open DevTools → Network tab
2. Send a message
3. Look for a POST request to `/api/chat`
4. Click on it to see the request/response
5. If it's 500 error, check the server console

### Check Server Logs:

Look at your terminal where `npm run dev` is running:

- Should see incoming requests to `/api/chat`
- Should NOT see errors about missing env variables
- Should NOT see authentication errors

## 💡 Tips for Best Results

### Writing Good Prompts:

**Be Specific:**

```
❌ "Make a form"
✅ "Create a contact form with fields for name, email, and message. Include validation and a submit button. Use Tailwind CSS with rounded inputs."
```

**Provide Context:**

```
✅ "I'm building a blog. Create a component to display recent posts in a grid layout."
```

**Ask for Explanations:**

```
✅ "Build a user authentication form and explain how it works"
```

### Model Usage Tips:

**Use Claude for:**

- Building components
- Writing complex logic
- Creating full features
- Refactoring code
- Debugging issues

**Use Grok for:**

- Quick questions
- Project naming
- Simple explanations
- General inquiries

## 🎨 Design System Compliance

Claude is configured to follow these rules:

- **Only neutral colors** (neutral-_, stone-_, gray-\*)
- **Rounded corners** on all interactive elements
- **Dark mode support** with dark: variants
- **TypeScript** for type safety
- **Next.js 15** App Router patterns

## 📱 Mobile Testing

The chat interface is responsive! Try it on:

- Desktop (recommended for coding)
- Tablet (works great)
- Mobile (optimized for smaller screens)

## ⚡ Performance Notes

- First message may take 2-3 seconds (cold start)
- Subsequent messages are faster (< 1 second)
- Streaming means you see responses immediately
- Large code generations may take longer

## 🎉 Success Criteria

You'll know it's working when:

- ✅ Chat messages appear instantly
- ✅ AI responses stream in smoothly
- ✅ Code has syntax highlighting
- ✅ No errors in browser console
- ✅ No errors in server terminal
- ✅ Responses are relevant and helpful

## 🆘 Still Having Issues?

1. **Restart everything:**

   - Stop dev server (Ctrl+C)
   - Run `npm run dev` again
   - Hard refresh browser (Ctrl+Shift+R)

2. **Check the basics:**

   - API key is correct in `.env`
   - File is named exactly `.env` (not `.env.txt`)
   - Dev server shows "Ready" without errors
   - You're on http://localhost:3000 (not HTTPS)

3. **Test the API directly:**
   Open a new terminal and run:
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello"}],"taskType":"general"}'
   ```
   You should see a response stream back.

## 🎓 Next Steps

Once it's working:

1. Try building a real component
2. Ask for help with your actual project
3. Experiment with different coding tasks
4. Explore the design system guidelines
5. Build something awesome! 🚀

---

**Ready to test?** Just add your API key and start chatting! The AI is ready to help you build amazing Next.js applications.
