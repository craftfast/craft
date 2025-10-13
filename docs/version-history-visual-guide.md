# Version History Visual Guide

## UI Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  🏠 Craft Logo    my-little-todo-26                             │
│                                                                  │
│  [Preview] [Code] [Database] ... [⏰ Version History] [Share]  │
└─────────────────────────────────────────────────────────────────┘
                                      ↓ (Click version history button)
┌──────────────────────────────────────────────────────────────────┐
│  Version History                                        [✕]      │
│  Current: Version 3                                              │
├──────────────────────────────────────────────────────────────────┤
│  📌 BOOKMARKED                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Version 2                                    [🔖] [↻]  │ │
│  │ 2 hours ago · 12 files                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  UNPUBLISHED                                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Version 3                         [Current]  [🔖]      │ │
│  │ Just now · 13 files                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Version 1                                    [🔖] [↻]  │ │
│  │ Sep 1, 3:09 PM · 10 files                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
CodingInterface
├── Header
│   ├── Logo & Project Name
│   ├── Navigation Tabs
│   ├── [⏰ Version History Button] ← NEW
│   ├── Share Button
│   └── Deploy Button
│
├── Chat Panel (Left 30%)
│   └── ChatPanel component
│
└── Content Panel (Right 70%)
    ├── [VersionHistoryPanel Overlay] ← NEW (when open)
    │   ├── Header (with close button)
    │   ├── Bookmarked Section
    │   │   └── VersionCard(s)
    │   └── Unpublished Section
    │       └── VersionCard(s)
    │
    └── Active Tab Content
        ├── PreviewPanel
        ├── CodeEditor
        ├── DatabasePanel
        └── ...
```

## Database Schema

```
┌─────────────────────────────────────────────────────────┐
│  Project                                                │
├─────────────────────────────────────────────────────────┤
│  id: string                                             │
│  name: string                                           │
│  files: Json (current files)                            │
│  version: number (current version: 0, 1, 2, 3...)      │
│  generationStatus: string                               │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
                    │
                    │ 1:N relationship
                    ↓
┌─────────────────────────────────────────────────────────┐
│  ProjectVersion (NEW)                                   │
├─────────────────────────────────────────────────────────┤
│  id: string                                             │
│  projectId: string → FK to Project                      │
│  version: number (1, 2, 3...)                          │
│  name: string (optional custom name)                    │
│  files: Json (snapshot of files at this version)        │
│  chatMessageId: string (optional)                       │
│  isBookmarked: boolean                                  │
│  createdAt: DateTime                                    │
│  UNIQUE(projectId, version)                            │
└─────────────────────────────────────────────────────────┘
```

## Version Lifecycle

```
1. AI Generates/Modifies Files
   ↓
2. Files saved to project.files via /api/files
   ↓
3. finalizeGeneration called
   ↓
4. Project.version incremented (e.g., 0 → 1)
   ↓
5. ProjectVersion snapshot created
   - version: 1
   - files: { "app/page.tsx": "...", ... }
   - createdAt: now
   - isBookmarked: false
   ↓
6. Version appears in history panel
```

## Restore Flow

```
User clicks restore on Version 2
   ↓
Confirmation: "Restore to Version 2?"
   ↓ (User confirms)
Create auto-save of current state (Version 3)
   - name: "Auto-saved before restore to v2"
   - files: current project.files
   ↓
Update project.files = Version 2 files
   ↓
Increment project.version (3 → 4)
   ↓
Set generationStatus = "ready"
   ↓
Refresh project files in UI
   ↓
Preview refreshes automatically
   ↓
Version history shows Version 4 (restored from v2)
```

## API Endpoints

```
GET /api/projects/[id]/versions
├── Returns: { versions: ProjectVersion[], currentVersion: number }
└── Sorted: bookmarked first, then by version DESC

POST /api/projects/[id]/versions/[versionId]/restore
├── Creates auto-save snapshot
├── Restores files from selected version
├── Increments project.version
└── Returns: { success: true, project, restoredFrom }

PATCH /api/projects/[id]/versions/[versionId]
├── Updates: { isBookmarked?, name? }
└── Returns: { version: updated ProjectVersion }

POST /api/files (modified)
├── When finalizeGeneration: true
├── Increments project.version
├── Creates ProjectVersion snapshot
└── Returns: { success: true, version }
```

## UI States

### Empty State

```
┌──────────────────────────────────────┐
│       🕐                             │
│  No version history yet              │
│  Versions are automatically saved    │
│  when you make changes with AI.      │
└──────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────┐
│       ⟳ (spinning)                   │
│  Loading versions...                 │
└──────────────────────────────────────┘
```

### Version Card (Normal)

```
┌─────────────────────────────────────┐
│ Version 2                [🔖] [↻]  │
│ 2 hours ago · 12 files              │
└─────────────────────────────────────┘
```

### Version Card (Current)

```
┌─────────────────────────────────────┐
│ Version 3   [Current]    [🔖]      │
│ Just now · 13 files                 │
└─────────────────────────────────────┘
```

### Version Card (Bookmarked)

```
┌─────────────────────────────────────┐
│ Working Auth Feature   [🔖✓] [↻]  │
│ Sep 1, 3:09 PM · 15 files          │
└─────────────────────────────────────┘
```

### Version Card (Restoring)

```
┌─────────────────────────────────────┐
│ Version 1              [🔖] [⟳]   │
│ Sep 1, 2:33 PM · 10 files          │
└─────────────────────────────────────┘
```

## Responsive Design

### Desktop (>768px)

- Version history button visible with clock icon
- Full panel width on right side
- Shows full timestamps and file counts

### Mobile (<768px)

- Version history button shows icon only
- Panel takes full width
- Condensed timestamps (e.g., "2h ago")

## Color Scheme (Craft Design System)

```css
/* Light Mode */
Background: white / neutral-50
Cards: white / neutral-100
Borders: neutral-200
Text: neutral-900 / neutral-600
Hover: neutral-100
Active/Current: neutral-900 (bg), white (text)

/* Dark Mode */
Background: neutral-900 / neutral-800
Cards: neutral-800 / neutral-700
Borders: neutral-700 / neutral-600
Text: neutral-100 / neutral-400
Hover: neutral-700
Active/Current: neutral-100 (bg), neutral-900 (text)
```

## Keyboard Shortcuts (Future)

Potential shortcuts:

- `Ctrl/Cmd + H` - Toggle version history
- `Ctrl/Cmd + B` - Bookmark current version
- `Ctrl/Cmd + Z` (in history) - Restore previous version
- `Esc` - Close version history panel

## Icons Used

- ⏰ (Clock) - Version history button
- 🔖 (Bookmark outline) - Unbookmarked version
- 🔖✓ (Bookmark filled) - Bookmarked version
- ↻ (Rotate) - Restore version
- ✕ (X) - Close panel
- 🕐 (Clock) - Empty state icon
- ⟳ (Loading spinner) - Loading/restoring state
