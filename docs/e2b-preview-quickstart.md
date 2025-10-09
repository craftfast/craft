# E2B Preview - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your E2B API Key (2 minutes)

1. Visit [https://e2b.dev/dashboard](https://e2b.dev/dashboard)
2. Sign up with GitHub or email
3. Click **"Create API Key"**
4. Copy the API key

### Step 2: Add API Key to Your Project (1 minute)

Create or edit `.env.local` in your project root:

```bash
E2B_API_KEY=e2b_your_api_key_here
```

### Step 3: Restart Your Dev Server (1 minute)

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### Step 4: Test It! (1 minute)

1. Open [http://localhost:3000](http://localhost:3000)
2. Login to your account
3. Create a new project or open existing one
4. Navigate to the coding interface
5. Click **"Preview"** tab
6. Click **"Start Preview"** button
7. Wait 2-3 seconds
8. 🎉 Your app preview should appear!

## ✅ Quick Test

Try this simple test:

1. In the **Chat** panel, ask: "Create a simple HTML page with a hello world message"
2. Wait for files to be created
3. Go to **Preview** tab
4. Click **Start Preview**
5. You should see "Hello World" in the preview!

## 🎨 Device Preview

Click these buttons to see your app in different sizes:

- **Mobile**: 375px width (iPhone size)
- **Tablet**: 768px width (iPad size)
- **Desktop**: Full width

## 🔧 Troubleshooting

### "Unauthorized" error

→ Make sure you're logged in

### "Failed to start sandbox"

→ Check if E2B_API_KEY is set correctly in `.env.local`

### Preview is blank

→ Check browser console for errors (F12)

### Taking too long

→ First sandbox creation takes ~2-3 seconds (normal)

## 📚 Need More Help?

- **Detailed Setup**: [e2b-preview-setup.md](./e2b-preview-setup.md)
- **Technical Docs**: [e2b-preview-implementation.md](./e2b-preview-implementation.md)
- **Full Summary**: [e2b-preview-summary.md](./e2b-preview-summary.md)

## 💡 Pro Tips

1. **Stop Preview** when done to save E2B credits
2. **Refresh** button reloads the preview
3. **Device modes** help test responsive design
4. Sandboxes auto-stop after 30 minutes of inactivity

## 🎯 What's Next?

After testing:

- Create real projects with React/Next.js
- Test with different frameworks
- Try the device preview modes
- Share your preview with team members (coming soon!)

---

**Need help?** Check the full documentation or ask in Discord!
