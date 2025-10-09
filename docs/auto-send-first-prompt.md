# Auto-Send First Prompt Feature

## Overview

This feature automatically sends the user's initial project description as the first message to the AI when they create a new project and enter the coding interface. This eliminates the need for users to manually type or paste their project idea again, creating a smoother onboarding experience.

## How It Works

### User Flow

1. **User creates a project** from the dashboard using the `CraftInput` component

   - User types their project idea (e.g., "Create a modern landing page for my startup...")
   - Clicks submit

2. **Project is created** with the description stored

   - The project is created in the database with the user's description
   - AI generates a project name based on the description (if description is provided)
   - User is redirected to `/chat/[project-id]`

3. **Coding interface loads**

   - The `CodingInterface` component receives the project data including the description
   - Passes the description to the `ChatPanel` component

4. **First message is automatically sent**
   - `ChatPanel` detects this is a new session with no messages
   - Automatically sends the project description as the first user message
   - AI responds and starts generating code immediately

### Technical Implementation

#### 1. CodingInterface Component

**File:** `src/components/CodingInterface.tsx`

The component now passes the project description to ChatPanel:

```tsx
<ChatPanel
  projectId={project.id}
  projectDescription={project.description}
  onFilesCreated={handleFilesCreated}
/>
```

#### 2. ChatPanel Component

**File:** `src/components/coding-interface/ChatPanel.tsx`

**New Props:**

- Added `projectDescription?: string | null` to the `ChatPanelProps` interface

**New State:**

- `hasAutoSentFirstMessage`: Tracks whether the first message has been automatically sent to prevent duplicate sends

**Modified Functions:**

- `handleSendMessage(messageContent?: string)`: Now accepts an optional parameter to send a specific message instead of using the input field

**New Effect Hook:**

```tsx
useEffect(() => {
  const sendFirstMessage = async () => {
    if (
      !hasAutoSentFirstMessage &&
      currentSessionId &&
      messages.length === 0 &&
      projectDescription &&
      projectDescription.trim() !== "" &&
      !isLoading
    ) {
      console.log("🚀 Auto-sending first message from project description");
      setHasAutoSentFirstMessage(true);

      setTimeout(() => {
        handleSendMessage(projectDescription);
      }, 100);
    }
  };

  sendFirstMessage();
}, [
  currentSessionId,
  messages,
  projectDescription,
  hasAutoSentFirstMessage,
  isLoading,
]);
```

**Conditions for Auto-Send:**

1. First message hasn't been sent yet (`!hasAutoSentFirstMessage`)
2. A chat session exists (`currentSessionId`)
3. No messages in the current session (`messages.length === 0`)
4. Project has a description (`projectDescription && projectDescription.trim() !== ""`)
5. Not currently loading (`!isLoading`)

## Benefits

1. **Improved UX**: Users don't need to re-type their project idea
2. **Faster Start**: Coding begins immediately when entering the interface
3. **Seamless Flow**: Natural progression from project creation to AI assistance
4. **Reduced Friction**: One less step for users to get started

## Edge Cases Handled

1. **No Description**: If project is created without a description, no auto-send occurs
2. **Existing Messages**: Only sends on first load of an empty chat session
3. **Session Loading**: Waits for session to be created before attempting to send
4. **Duplicate Prevention**: `hasAutoSentFirstMessage` flag prevents multiple sends

## Testing Scenarios

### Scenario 1: New Project with Description

1. Go to dashboard
2. Enter "Create a todo app with React" in the input
3. Submit
4. ✅ Should redirect to coding interface
5. ✅ Should automatically send the prompt to AI
6. ✅ Should see AI response generating code

### Scenario 2: New Project without Description

1. Create a project with just a name, no description
2. Enter coding interface
3. ✅ Should NOT auto-send any message
4. ✅ Chat should be empty, waiting for user input

### Scenario 3: Returning to Existing Project

1. Open a project that already has chat messages
2. ✅ Should NOT auto-send the description
3. ✅ Should show existing chat history

### Scenario 4: Multiple Chat Sessions

1. Create a new chat session in an existing project
2. ✅ Should NOT auto-send the original description
3. ✅ New session should start empty

## Future Enhancements

1. **Custom Prompts**: Allow users to edit the auto-send prompt before it's sent
2. **Prompt Templates**: Provide template options for common project types
3. **Context Addition**: Automatically add relevant context (tech stack preferences, design guidelines) to the first prompt
4. **Progressive Enhancement**: Add file uploads or screenshots to the initial prompt

## Files Modified

1. `src/components/CodingInterface.tsx`

   - Added `projectDescription` prop to ChatPanel

2. `src/components/coding-interface/ChatPanel.tsx`
   - Added `projectDescription` prop
   - Added `hasAutoSentFirstMessage` state
   - Modified `handleSendMessage` to accept optional content parameter
   - Added auto-send effect hook

## Related Documentation

- [Chat Sessions Implementation](./chat-sessions-implementation.md)
- [AI Integration Summary](./ai-integration-summary.md)
- [Projects Implementation](./projects-implementation.md)
