# Chat Sessions Feature - Visual Guide

## 🎨 UI Components Overview

### 1. Session Dropdown (Header)

When you open the chat panel, you'll see a new header section with:

```
┌─────────────────────────────────────────────┐
│  💬 New Chat              ▼                 │
└─────────────────────────────────────────────┘
```

**Click the dropdown to see:**

```
┌─────────────────────────────────────────────┐
│  ➕ New Chat                                │
├─────────────────────────────────────────────┤
│  💬 New Chat                  [Active]      │
│     Oct 9, 2025                             │
│                                             │
│  💬 Authentication Implementation           │
│     Oct 8, 2025                             │
│                                             │
│  💬 API Design Discussion                   │
│     Oct 7, 2025                             │
└─────────────────────────────────────────────┘
```

### 2. Creating a New Chat Session

**Steps:**

1. Click on the session dropdown
2. Click "➕ New Chat"
3. A fresh conversation starts
4. Previous conversation is saved automatically

### 3. Switching Between Sessions

**Steps:**

1. Click on the session dropdown
2. Select any previous session
3. All messages from that session load instantly
4. Continue the conversation where you left off

### 4. Message Display

Messages continue to work exactly as before, but now they're saved:

```
┌─────────────────────────────────────────────┐
│                                             │
│  ✨  How can I create a login form?        │
│      12:30 PM                                │
│                                             │
│                    Create a component... 👤 │
│                    12:30 PM                  │
│                                             │
└─────────────────────────────────────────────┘
```

## 🔄 Data Persistence Flow

### First Message Sent:

```
User Types Message
    ↓
Display in UI (instant)
    ↓
Save to Database
    ↓
Send to AI
    ↓
Stream Response
    ↓
Save AI Response to Database
    ↓
✅ Both messages persisted
```

### Loading Previous Session:

```
User Clicks Session
    ↓
Fetch messages from database
    ↓
Display all messages
    ↓
Ready to continue conversation
```

## 🗂️ Database Structure

```
Project
  └── ChatSession 1: "New Chat"
      ├── Message 1: User - "Hello"
      ├── Message 2: AI - "Hi! How can I help?"
      └── Message 3: User - "Create a button"

  └── ChatSession 2: "Authentication Work"
      ├── Message 1: User - "How to add login?"
      ├── Message 2: AI - "Here's how..."
      └── Message 3: User - "Thanks!"

  └── ChatSession 3: "API Design"
      └── Message 1: User - "Help with REST API"
```

## 🎯 Use Cases

### Use Case 1: Different Features

- Session 1: "Homepage Design"
- Session 2: "User Authentication"
- Session 3: "API Development"
- Session 4: "Testing & Debugging"

### Use Case 2: Iterations

- Session 1: "Initial Design v1"
- Session 2: "Design Improvements v2"
- Session 3: "Final Design v3"

### Use Case 3: Experimentation

- Session 1: "React Approach"
- Session 2: "Vue Alternative"
- Session 3: "Final Decision"

## 💡 Tips for Best Experience

1. **Create Descriptive Sessions**: Rename sessions to reflect the topic

   - Instead of "New Chat" → "Login Page Implementation"

2. **Organize by Feature**: Create separate sessions for different parts of your project

   - Frontend discussions in one session
   - Backend API in another
   - Database design in a third

3. **Keep Context**: Switch to relevant session before asking related questions
   - Keeps AI responses more contextual
   - Easier to find previous discussions

## 🔧 Technical Details

### API Endpoints Available

**Get All Sessions:**

```
GET /api/chat-sessions?projectId={id}
```

**Create Session:**

```
POST /api/chat-sessions
{
  "projectId": "...",
  "name": "Optional name"
}
```

**Get Session Messages:**

```
GET /api/chat-sessions/{sessionId}
```

**Send Message:**

```
POST /api/chat-messages
{
  "chatSessionId": "...",
  "role": "user",
  "content": "..."
}
```

### Database Schema

**chat_sessions table:**

- id (primary key)
- name
- project_id (foreign key)
- created_at
- updated_at

**chat_messages table:**

- id (primary key)
- chat_session_id (foreign key)
- role ("user" or "assistant")
- content (text)
- created_at

## 🎨 Styling Details

All UI elements follow the Craft design system:

- ✅ Neutral colors only (neutral-_, stone-_, gray-\*)
- ✅ Rounded corners (rounded-lg, rounded-xl, rounded-2xl)
- ✅ Dark mode support
- ✅ Smooth transitions and hover effects

### Session Dropdown Colors:

- **Light Mode**:

  - Background: white
  - Border: neutral-200
  - Hover: neutral-100
  - Active: neutral-900

- **Dark Mode**:
  - Background: neutral-800
  - Border: neutral-700
  - Hover: neutral-700
  - Active: neutral-100

## 🚦 States & Indicators

### Visual States:

1. **Active Session**

   - Dark background (neutral-900 in light mode)
   - White text
   - Clear visual distinction

2. **Inactive Session**

   - Light background
   - Neutral text
   - Hover effect on mouseover

3. **Loading State**

   - Inherits from existing loading indicator
   - Three animated dots

4. **Empty State**
   - Clean slate for new conversations
   - No messages shown

## 📱 Responsive Behavior

- **Desktop**: Full dropdown with all details
- **Mobile**: Optimized for touch
- **Tablet**: Adapted spacing

## ⚡ Performance

- Messages only loaded for active session
- Lazy loading for session list
- Efficient database queries with indexes
- Optimistic UI updates

---

Enjoy your new chat session management feature! 🎉
