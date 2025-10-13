# AI-Powered Project Naming

This document describes the AI-powered project naming feature in Craft.

## Overview

Craft uses Grok AI to automatically generate creative and meaningful project names based on project descriptions. This helps users quickly identify their projects without manually thinking of names.

## Features

### 1. Default Project Creation

- When a user creates a new project via `CraftInput`, it's created with the default name **"New Project"**
- The project description is saved from the user's input prompt
- The project is immediately created and the user is redirected to the coding interface

### 2. Automatic Name Generation (Background)

- If a project is created with the name "New Project" and has a description, the system automatically generates a better name in the background
- Uses Grok AI (via OpenRouter) to generate a creative, memorable name
- The name is generated asynchronously without blocking the user experience
- The project name is automatically updated in the database once generated

### 3. Manual Name Generation

- Users can manually trigger AI name generation from the **Settings** panel
- Click the "Generate with AI" button next to the Project Name field
- The AI analyzes the project description and suggests a creative name
- The generated name is automatically saved and reflected in the UI

## Technical Implementation

### API Endpoints

#### POST `/api/projects/generate-name`

Generates a project name using Grok AI based on a description.

**Request Body:**

```json
{
  "description": "Create a modern landing page for my startup..."
}
```

**Response:**

```json
{
  "name": "Startup Landing Hub"
}
```

#### POST `/api/projects`

Creates a new project. If the name is "New Project" and a description exists, it triggers background name generation.

**Request Body:**

```json
{
  "name": "New Project",
  "description": "Build a task management application..."
}
```

**Response:**

```json
{
  "project": {
    "id": "project-id",
    "name": "New Project",
    "description": "Build a task management application...",
    "userId": "user-id",
    "createdAt": "2025-10-09T12:00:00Z",
    "updatedAt": "2025-10-09T12:00:00Z"
  }
}
```

Note: The name will be updated asynchronously in the background.

#### PATCH `/api/projects/[id]`

Updates project details including name and description.

**Request Body:**

```json
{
  "name": "Task Manager Pro",
  "description": "Build a task management application..."
}
```

### Components

#### `CraftInput.tsx`

- Creates new projects with "New Project" as the default name
- Sends the user's input as the project description
- Redirects to the coding interface immediately

#### `SettingsPanel.tsx`

- Displays current project name and description
- Includes "Generate with AI" button for manual name generation
- Shows loading state while generating
- Auto-saves generated names
- Refreshes the parent component to update the UI

#### `CodingInterface.tsx`

- Maintains project state
- Provides `refreshProject()` function to reload project data
- Passes refresh callback to `SettingsPanel`
- Updates the header when project name changes

### AI Configuration

The feature uses the following AI model configuration:

**Model:** `x-ai/grok-beta` (configurable via `GROK_MODEL` env variable)

**System Prompt:**

```
You are a creative assistant that generates concise, memorable project names.
Generate a single project name (1-4 words max) that captures the essence of the project description.
The name should be:
- Short and memorable
- Descriptive but creative
- Professional yet approachable
- Easy to remember and type

Return ONLY the project name, nothing else. No quotes, no explanation, just the name.
```

**Temperature:** 0.8 (for creative variety)

## User Experience Flow

### Flow 1: Creating a New Project

1. User enters project description in `CraftInput`
2. User clicks submit button
3. Project is created with name "New Project"
4. User is immediately redirected to `/chat/[project-id]`
5. In the background, AI generates a better name
6. Next time the user refreshes or navigates, they see the AI-generated name

### Flow 2: Manual Name Generation

1. User navigates to Settings tab in the coding interface
2. User enters or updates the project description
3. User clicks "Generate with AI" button
4. Loading state shows "Generating..."
5. AI generates a creative name
6. Name is automatically saved
7. UI updates to show the new name in the header

### Flow 3: Manual Name Entry

1. User navigates to Settings tab
2. User types a custom project name
3. User clicks "Save Changes"
4. Project is updated with the custom name

## Environment Variables

Required environment variables:

```bash
# OpenRouter API Key (for AI features)
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional: Specify Grok model version
GROK_MODEL=x-ai/grok-beta

# App URL for OpenRouter headers
NEXTAUTH_URL=http://localhost:3000
```

## Error Handling

- If AI generation fails, the project keeps its current name
- Errors are logged to console but don't block user workflow
- Background generation failures are silent to the user
- Manual generation failures show in console (can be enhanced with toast notifications)

## Future Enhancements

1. **Toast Notifications**: Show success/error messages when names are generated
2. **Name Suggestions**: Generate multiple name options and let user choose
3. **Name History**: Keep track of previous names and allow reverting
4. **Smart Refresh**: Use WebSockets or polling to update the UI when background generation completes
5. **Language Support**: Generate names in different languages based on user preference
6. **Name Templates**: Provide naming conventions (e.g., "Product Name + Feature")

## Testing

To test the feature:

1. Create a new project with a description
2. Check that it starts with "New Project"
3. Wait a few seconds and refresh the page
4. Verify the name has been updated by AI
5. Go to Settings tab
6. Change the description and click "Generate with AI"
7. Verify a new name is generated and saved

## Limitations

- Requires OpenRouter API access with Grok model availability
- Name generation is asynchronous and may take a few seconds
- Generated names are limited to 1-4 words
- No user control over AI parameters (temperature, etc.)
- Background generation doesn't notify the user when complete
