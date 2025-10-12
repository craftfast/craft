# Version History with Published Tracking - Visual Summary

## Updated UI Flow

### Version History Panel with Published Versions

```
┌──────────────────────────────────────────────────────────────────┐
│  Version History                                        [✕]      │
│  Current: Version 5                                              │
├──────────────────────────────────────────────────────────────────┤
│  📌 BOOKMARKED                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Version 3  [📤 Published]                [🔖✓] [📤] [↻]  │ │
│  │ Sep 1, 2:15 PM · 15 files                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  UNPUBLISHED                                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Version 5              [Current]         [🔖] [📤]       │ │
│  │ Just now · 18 files                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Version 4                                [🔖] [📤] [↻]  │ │
│  │ 3 hours ago · 17 files                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Version 2                                [🔖] [📤] [↻]  │ │
│  │ Sep 1, 1:33 PM · 12 files                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Version 1                                [🔖] [📤] [↻]  │ │
│  │ Sep 1, 12:09 PM · 10 files                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Button States

### Publish Button States

#### Unpublished (Default)

```
┌─────┐
│ 📤  │ ← Gray/muted (neutral-400)
└─────┘
Hover: Darker (neutral-900)
```

#### Published (Active)

```
┌─────┐
│ 📤  │ ← Dark with background (neutral-900 + bg-neutral-100)
└─────┘
State: Highlighted background
```

## Badge Display

### Version Header with Multiple States

#### Current Version (Unpublished)

```
Version 5  [Current]
           └─ Black badge with white text
```

#### Published Version (Not Current)

```
Version 3  [📤 Published]
           └─ Gray badge with upload icon
```

#### Current + Published

```
Version 5  [Current] [📤 Published]
           └─ Both badges shown
```

#### Bookmarked + Published

```
Working Auth  [📤 Published]
└─ Custom name     └─ Published badge
```

## Complete Version Card Anatomy

```
┌───────────────────────────────────────────────────────────────┐
│ ┌─ Header Section ──────────────────────────────────────────┐ │
│ │ Version Name/Number  [Current] [📤 Published]            │ │
│ │ Timestamp · File Count                                    │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─ Action Buttons ──────────────────────────────────────────┐ │
│ │                                    [🔖] [📤] [↻]        │ │
│ │                                     │    │    └─ Restore  │ │
│ │                                     │    └─ Publish       │ │
│ │                                     └─ Bookmark           │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## User Interaction Flow

### Publishing a Version

```
1. User clicks Upload button (📤)
   ↓
2. API updates isPublished = true
   ↓
3. UI adds "Published" badge
   ↓
4. Button background highlights
   ↓
5. State persists in database
```

### Unpublishing a Version

```
1. User clicks Upload button again (📤)
   ↓
2. API updates isPublished = false
   ↓
3. UI removes "Published" badge
   ↓
4. Button returns to default state
   ↓
5. State persists in database
```

## Common Scenarios

### Scenario 1: Deploy to Production

```
Before:
Version 3  [📤 Published] ← Current production
Version 4  ← New changes ready
Version 5  [Current] ← Latest development

Action: Click 📤 on Version 4

After:
Version 3  ← Old production (unpublish manually if needed)
Version 4  [📤 Published] ← New production
Version 5  [Current] ← Latest development
```

### Scenario 2: Rollback Published Version

```
Before:
Version 5  [Current] [📤 Published] ← Has bug!

Action:
1. Click ↻ on Version 4
2. Click 📤 on restored version

After:
Version 4  [📤 Published] ← Restored and published
Version 5  ← Archived (unpublished)
Version 6  [Current] ← Auto-saved before restore
```

### Scenario 3: Multiple Published Versions (Multi-Environment)

```
Version 3  [📤 Published] [🔖] ← Production
Version 4  [📤 Published] ← Staging
Version 5  [Current] ← Development

Note: Currently supports multiple published versions
Future: Could add environment tags
```

## Color Palette (Design System Compliant)

```css
/* Published Badge */
.published-badge {
  background: neutral-200 (light) / neutral-700 (dark);
  color: neutral-700 (light) / neutral-300 (dark);
  border-radius: 9999px; /* rounded-full */
}

/* Publish Button (Unpublished) */
.publish-button-inactive {
  color: neutral-400 (light) / neutral-500 (dark);
  hover: neutral-900 (light) / neutral-100 (dark);
}

/* Publish Button (Published) */
.publish-button-active {
  color: neutral-900 (light) / neutral-100 (dark);
  background: neutral-100 (light) / neutral-700 (dark);
}
```

## Accessibility

- ✅ Tooltips on all buttons
- ✅ Clear visual indicators (icon + badge)
- ✅ High contrast in both light and dark modes
- ✅ Keyboard accessible (can tab through buttons)
- ✅ Screen reader friendly (semantic HTML)

## Mobile Responsive

### Desktop (>768px)

- Full badges shown
- All buttons visible
- Tooltips on hover

### Mobile (<768px)

- Badges may wrap to new line
- Touch-friendly button sizes
- Icons remain clear at small sizes

## Database Structure

```sql
-- ProjectVersion table includes:
CREATE TABLE project_versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  name TEXT,
  files JSON NOT NULL,
  chat_message_id TEXT,
  is_bookmarked BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,  -- ← NEW FIELD
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, version)
);

-- Indexes
CREATE INDEX idx_project_versions_published
  ON project_versions(project_id, is_published);
```

## API Response Example

```json
{
  "versions": [
    {
      "id": "clx123abc",
      "version": 5,
      "name": "Version 5",
      "files": { ... },
      "chatMessageId": null,
      "isBookmarked": false,
      "isPublished": false,
      "createdAt": "2025-10-12T10:30:00Z"
    },
    {
      "id": "clx123xyz",
      "version": 3,
      "name": "Production Release",
      "files": { ... },
      "chatMessageId": "msg123",
      "isBookmarked": true,
      "isPublished": true,  // ← Published version
      "createdAt": "2025-10-11T14:15:00Z"
    }
  ],
  "currentVersion": 5
}
```

## Summary

✅ **Added**: `isPublished` field to track published status
✅ **UI**: Upload button to toggle published state
✅ **Badge**: "Published" indicator on version cards
✅ **API**: PATCH endpoint supports isPublished updates
✅ **Design**: Follows neutral color palette
✅ **Persistence**: Saved to database
✅ **Accessible**: Keyboard and screen reader friendly

The published tracking feature is now complete and ready for use!
