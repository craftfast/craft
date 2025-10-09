# Chat Sessions Implementation

## Overview

This document describes the implementation of persistent chat sessions and message history for projects in the Craft application. Users can now create multiple chat sessions within each project, and all chat messages are stored in the database for easy retrieval.

## Database Schema

### Models Added

#### ChatSession Model

```prisma
model ChatSession {
  id        String        @id @default(cuid())
  name      String        @default("New Chat")
  projectId String
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  project   Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  messages  ChatMessage[]

  @@index([projectId])
  @@map("chat_sessions")
}
```

**Fields:**

- `id`: Unique identifier (CUID)
- `name`: Session name (default: "New Chat")
- `projectId`: Reference to parent project
- `createdAt`: When the session was created
- `updatedAt`: Last activity timestamp
- `project`: Relation to Project model
- `messages`: All messages in this session

**Features:**

- Cascading delete: When a project is deleted, all its chat sessions are deleted
- Indexed by `projectId` for efficient queries
- Automatically creates a default session when a user opens a project

#### ChatMessage Model

```prisma
model ChatMessage {
  id            String      @id @default(cuid())
  chatSessionId String
  role          String // "user" or "assistant"
  content       String      @db.Text
  createdAt     DateTime    @default(now())
  chatSession   ChatSession @relation(fields: [chatSessionId], references: [id], onDelete: Cascade)

  @@index([chatSessionId])
  @@map("chat_messages")
}
```

**Fields:**

- `id`: Unique identifier (CUID)
- `chatSessionId`: Reference to parent chat session
- `role`: Message sender - "user" or "assistant"
- `content`: Message content (stored as TEXT for longer messages)
- `createdAt`: Message timestamp
- `chatSession`: Relation to ChatSession model

**Features:**

- Cascading delete: When a session is deleted, all its messages are deleted
- Indexed by `chatSessionId` for efficient queries
- Stores full conversation history

#### Updated Project Model

```prisma
model Project {
  id           String        @id @default(cuid())
  name         String
  description  String?
  type         String        @default("document")
  status       String        @default("active")
  userId       String
  files        Json          @default("{}")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  chatSessions ChatSession[]  // NEW

  @@map("projects")
}
```

## API Endpoints

### Chat Sessions API

#### GET `/api/chat-sessions?projectId={projectId}`

Get all chat sessions for a project.

**Query Parameters:**

- `projectId` (required): The project ID

**Response:**

```json
{
  "chatSessions": [
    {
      "id": "cm3abc123",
      "name": "New Chat",
      "projectId": "cm3project1",
      "createdAt": "2025-10-09T12:00:00Z",
      "updatedAt": "2025-10-09T12:30:00Z",
      "messages": [
        {
          "id": "cm3msg1",
          "chatSessionId": "cm3abc123",
          "role": "user",
          "content": "Hello",
          "createdAt": "2025-10-09T12:00:00Z"
        }
      ]
    }
  ]
}
```

**Features:**

- Returns sessions ordered by `updatedAt` (most recent first)
- Includes all messages for each session
- Verifies project ownership

#### POST `/api/chat-sessions`

Create a new chat session.

**Request Body:**

```json
{
  "projectId": "cm3project1",
  "name": "My Chat Session" // optional, defaults to "New Chat"
}
```

**Response:**

```json
{
  "chatSession": {
    "id": "cm3abc123",
    "name": "My Chat Session",
    "projectId": "cm3project1",
    "createdAt": "2025-10-09T12:00:00Z",
    "updatedAt": "2025-10-09T12:00:00Z",
    "messages": []
  }
}
```

#### GET `/api/chat-sessions/[id]`

Get a specific chat session with all its messages.

**Response:**

```json
{
  "chatSession": {
    "id": "cm3abc123",
    "name": "My Chat Session",
    "projectId": "cm3project1",
    "createdAt": "2025-10-09T12:00:00Z",
    "updatedAt": "2025-10-09T12:30:00Z",
    "messages": [...]
  }
}
```

#### PATCH `/api/chat-sessions/[id]`

Update a chat session (e.g., rename).

**Request Body:**

```json
{
  "name": "Updated Chat Name"
}
```

**Response:**

```json
{
  "chatSession": {
    "id": "cm3abc123",
    "name": "Updated Chat Name",
    ...
  }
}
```

#### DELETE `/api/chat-sessions/[id]`

Delete a chat session and all its messages.

**Response:**

```json
{
  "success": true
}
```

### Chat Messages API

#### POST `/api/chat-messages`

Create a new chat message.

**Request Body:**

```json
{
  "chatSessionId": "cm3abc123",
  "role": "user", // or "assistant"
  "content": "Hello, how can I create a button?"
}
```

**Response:**

```json
{
  "message": {
    "id": "cm3msg1",
    "chatSessionId": "cm3abc123",
    "role": "user",
    "content": "Hello, how can I create a button?",
    "createdAt": "2025-10-09T12:00:00Z"
  }
}
```

**Features:**

- Validates role (must be "user" or "assistant")
- Updates parent session's `updatedAt` timestamp
- Verifies user has access to the session

#### GET `/api/chat-messages?chatSessionId={sessionId}`

Get all messages for a chat session.

**Query Parameters:**

- `chatSessionId` (required): The chat session ID

**Response:**

```json
{
  "messages": [
    {
      "id": "cm3msg1",
      "chatSessionId": "cm3abc123",
      "role": "user",
      "content": "Hello",
      "createdAt": "2025-10-09T12:00:00Z"
    },
    {
      "id": "cm3msg2",
      "chatSessionId": "cm3abc123",
      "role": "assistant",
      "content": "Hi! How can I help you?",
      "createdAt": "2025-10-09T12:00:05Z"
    }
  ]
}
```

**Features:**

- Messages ordered by `createdAt` (chronological)
- Verifies user has access to the session

## UI Components

### ChatPanel Component Updates

The `ChatPanel` component (`src/components/coding-interface/ChatPanel.tsx`) has been updated with the following features:

#### New State Variables

```tsx
const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
const [showSessionList, setShowSessionList] = useState(false);
```

#### Key Functions

**`loadChatSessions()`**

- Loads all chat sessions for the current project
- Automatically selects the most recent session
- Creates a default session if none exists

**`loadMessages(sessionId)`**

- Loads all messages for a specific session
- Called when switching between sessions

**`createNewSession(name?)`**

- Creates a new chat session
- Automatically switches to the new session
- Clears the message area

**`saveMessage(role, content)`**

- Saves a message to the database
- Called after user sends a message
- Called after assistant responds

#### UI Features

**Session Switcher Header:**

- Dropdown menu showing all chat sessions
- Display current session name
- "New Chat" button to create sessions
- Session list with timestamps
- Visual indicator for active session

**Session List:**

- Shows all sessions ordered by most recent
- Each session shows name and last updated date
- Click to switch between sessions
- Hover effects for better UX

**Message Persistence:**

- All messages automatically saved to database
- Messages loaded when switching sessions
- Chat history preserved across page refreshes

## User Flow

### First Time Using a Project

1. User opens a project in the coding interface
2. System checks for existing chat sessions
3. If no sessions exist, creates a default "New Chat" session
4. User can start chatting immediately

### Creating Multiple Sessions

1. User clicks on the session dropdown in the chat header
2. Clicks "New Chat" button
3. New session is created and becomes active
4. Previous session's messages are preserved
5. User can switch back to any previous session

### Switching Between Sessions

1. User clicks on the session dropdown
2. Selects a different session from the list
3. Messages for that session are loaded
4. User can continue the conversation

### Message Flow

1. User types a message and presses Enter
2. Message is displayed in the UI immediately
3. Message is saved to database via API
4. AI response streams in
5. AI response is saved to database after streaming completes
6. Both messages are preserved in the session

## Migration

Run the following command to apply the database changes:

```bash
npx prisma migrate dev --name add_chat_sessions_and_messages
```

This will:

1. Create the `chat_sessions` table
2. Create the `chat_messages` table
3. Add indexes for performance
4. Update the Prisma Client

## Security Features

All API endpoints include:

- **Authentication**: Verified via NextAuth session
- **Authorization**: Users can only access their own projects' chat sessions
- **Validation**: Input validation for all required fields
- **Error Handling**: Proper error responses with details

## Performance Considerations

### Database Indexes

- `chatSessionId` indexed in `ChatMessage` for fast message retrieval
- `projectId` indexed in `ChatSession` for fast session lookup

### Query Optimization

- Messages are loaded only for the active session
- Sessions include message counts for display
- Cascading deletes prevent orphaned records

### Future Optimizations

- Consider pagination for projects with many sessions
- Implement message pagination for very long conversations
- Add caching layer (Redis) for frequently accessed sessions

## Benefits

1. **Persistent History**: All conversations are saved and retrievable
2. **Organization**: Users can organize different aspects of a project into separate chat sessions
3. **Context Management**: Switch between different conversation contexts within the same project
4. **Collaboration Ready**: Foundation for future multi-user collaboration features
5. **Data Integrity**: Proper relational structure with cascading deletes

## Future Enhancements

- [ ] Session search functionality
- [ ] Export chat history
- [ ] Share sessions between users
- [ ] Session templates
- [ ] Auto-naming sessions based on first message
- [ ] Message editing and deletion
- [ ] Session tagging/categorization
- [ ] AI-powered session summarization

## Files Modified

- `prisma/schema.prisma` - Added ChatSession and ChatMessage models
- `src/app/api/chat-sessions/route.ts` - New API for session management
- `src/app/api/chat-sessions/[id]/route.ts` - New API for individual session operations
- `src/app/api/chat-messages/route.ts` - New API for message management
- `src/components/coding-interface/ChatPanel.tsx` - Updated UI with session management

## Testing Checklist

- [ ] Create a new project and verify default session creation
- [ ] Send messages and verify they're saved to database
- [ ] Create multiple chat sessions in a project
- [ ] Switch between sessions and verify messages load correctly
- [ ] Refresh page and verify session state persists
- [ ] Delete a session and verify messages are deleted
- [ ] Delete a project and verify sessions are cascade deleted
- [ ] Test with multiple users to verify authorization
- [ ] Test error handling for invalid session IDs
- [ ] Verify timestamps are displayed correctly
