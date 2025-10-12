# Sidebar History - Visual Guide

## Layout Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│  Header: Logo | Project Name | New Chat | History | ... | User Menu  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────┬──────────────────────┬─────────────────────────┐ │
│  │ Chat History    │   Chat Messages      │  Main Content Panel     │ │
│  │ Sidebar (Left)  │   & Input           │                         │ │
│  │                 │                      │  ┌───────────────────┐  │ │
│  │ [New Chat Btn]  │  [Messages Area]     │  │                   │  │ │
│  │                 │                      │  │   Preview/Code    │  │ │
│  │ ● Active Chat   │  User: Hey...        │  │   Database/etc    │  │ │
│  │   Today         │  AI: Sure...         │  │                   │  │ │
│  │   3 messages    │                      │  │                   │  │ │
│  │                 │                      │  │                   │  │ │
│  │ ○ Previous      │  [Input Box]         │  │                   │  │ │
│  │   Yesterday     │  [Send Button]       │  │                   │  │ │
│  │   8 messages    │                      │  │                   │  │ │
│  │                 │                      │  │                   │  │ │
│  │ ○ Old Chat      │                      │  └───────────────────┘  │ │
│  │   2 days ago    │                      │                         │ │
│  │   15 messages   │                      │  ┌───────────────────┐ │ │
│  │                 │                      │  │ Version History   │ │ │
│  │ [X Close]       │                      │  │ Sidebar (Right)   │ │ │
│  │                 │                      │  │                   │ │ │
│  └─────────────────┘                      │  │ 🔖 BOOKMARKED     │ │ │
│                                            │  │ ● Version 3       │ │ │
│  30% width                70% width       │  │   2 hours ago     │ │ │
│                                            │  │   [Restore]       │ │ │
│                                            │  │                   │ │ │
│                                            │  │ 📝 ALL VERSIONS   │ │ │
│                                            │  │ ○ Version 2       │ │ │
│                                            │  │   Yesterday       │ │ │
│                                            │  │   [Restore]       │ │ │
│                                            │  │                   │ │ │
│                                            │  │ ○ Version 1       │ │ │
│                                            │  │   2 days ago      │ │ │
│                                            │  │   [Restore]       │ │ │
│                                            │  │                   │ │ │
│                                            │  │ [X Close]         │ │ │
│                                            │  └───────────────────┘ │ │
│                                            └─────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

## Chat History Sidebar

### Collapsed State (Default)

```
┌────────────────────────────────┐
│  Chat Messages & Input         │
│                                │
│  User: How do I create...      │
│  AI: You can create...         │
│                                │
│  [Type your message...]        │
└────────────────────────────────┘
```

### Expanded State (History Button Clicked)

```
┌─────────────────┬──────────────────┐
│ Chat History    │ Chat Messages    │
│                 │                  │
│ [+ New Chat]    │ User: How...     │
│                 │ AI: You can...   │
│ 💬 Active Chat  │                  │
│    Today        │                  │
│    3 messages   │                  │
│                 │ [Type message]   │
│ 💬 Login Form   │                  │
│    Yesterday    │                  │
│    8 messages   │                  │
│                 │                  │
│ 💬 Dark Mode    │                  │
│    2 days ago   │                  │
│    5 messages   │                  │
│                 │                  │
│ [X Close]       │                  │
└─────────────────┴──────────────────┘
   256px (w-64)     Remaining width
```

## Version History Sidebar

### Collapsed State (Default)

```
┌──────────────────────────────────┐
│                                  │
│     Preview / Code Editor        │
│                                  │
│  [Your project content here]     │
│                                  │
│                                  │
└──────────────────────────────────┘
```

### Expanded State (Version History Button Clicked)

```
┌───────────────────┬─────────────────┐
│ Main Content      │ Version History │
│                   │                 │
│ [Preview/Code]    │ Current: v3     │
│                   │                 │
│                   │ 🔖 BOOKMARKED   │
│                   │ ● Version 3     │
│                   │   (Current)     │
│                   │   2 hours ago   │
│                   │   12 files      │
│                   │   🔖 [Restore]  │
│                   │                 │
│                   │ 📝 ALL VERSIONS │
│                   │ ○ Version 2     │
│                   │   Yesterday     │
│                   │   10 files      │
│                   │   🔖 [Restore]  │
│                   │                 │
│                   │ ○ Version 1     │
│                   │   2 days ago    │
│                   │   8 files       │
│                   │   🔖 [Restore]  │
│                   │                 │
│                   │ [X Close]       │
└───────────────────┴─────────────────┘
  Remaining width      320px (w-80)
```

## Both Sidebars Open

```
┌──────────┬─────────────┬────────────┬──────────────┐
│ Chat     │ Chat        │ Main       │ Version      │
│ History  │ Messages    │ Content    │ History      │
│          │             │            │              │
│ Sessions │ User: ...   │ Preview    │ Versions     │
│ List     │ AI: ...     │ or Code    │ List         │
│          │             │            │              │
│ [X]      │ [Input]     │            │ [X]          │
└──────────┴─────────────┴────────────┴──────────────┘
  256px       Flexible      Flexible      320px
```

## Interactive Elements

### Chat Session Card (Inactive)

```
┌─────────────────────────────────┐
│ 💬  Login Form Feature          │
│     Yesterday                   │
│     8 messages                  │
└─────────────────────────────────┘
     ↓ (Hover)
┌─────────────────────────────────┐
│ 💬  Login Form Feature          │ ← Light gray background
│     Yesterday                   │
│     8 messages                  │
└─────────────────────────────────┘
     ↓ (Click)
```

### Chat Session Card (Active)

```
┌─────────────────────────────────┐
│ 💬  Login Form Feature  [Active]│ ← Dark background
│     Yesterday                   │ ← White text
│     8 messages                  │
└─────────────────────────────────┘
```

### Version Card (Not Current)

```
┌─────────────────────────────────┐
│ Version 2                       │
│ Yesterday • 10 files            │
│ [🔖 Bookmark] [↻ Restore]      │
└─────────────────────────────────┘
     ↓ (Hover)
┌─────────────────────────────────┐
│ Version 2                       │ ← Subtle border
│ Yesterday • 10 files            │
│ [🔖 Bookmark] [↻ Restore]      │ ← Buttons highlighted
└─────────────────────────────────┘
```

### Version Card (Current)

```
┌─────────────────────────────────┐
│ Version 3              [Current]│ ← Badge
│ 2 hours ago • 12 files          │
│ [🔖 Bookmarked] [↻ Restore]    │ ← Restore disabled
└─────────────────────────────────┘
```

## Responsive Behavior

### Desktop (> 1024px)

- Chat panel: 30% of screen width
- Chat history sidebar: 256px (when open)
- Main content: Remaining space
- Version history sidebar: 320px (when open)

### Tablet (768px - 1024px)

- Chat panel: 35% of screen width
- Sidebars may overlay instead of pushing content
- Recommend closing one sidebar when both open

### Mobile (< 768px)

- Chat panel: Full width when chat active
- Sidebars: Full-screen overlay (modal-like)
- Close button prominent
- Swipe gestures to close (future enhancement)

## Color System

### Light Mode

```
Background:         white
Borders:           neutral-200
Text Primary:       neutral-900
Text Secondary:     neutral-500
Active Background:  neutral-900
Active Text:        white
Hover Background:   neutral-100
```

### Dark Mode

```
Background:         neutral-900
Borders:           neutral-800
Text Primary:       neutral-100
Text Secondary:     neutral-400
Active Background:  neutral-100
Active Text:        neutral-900
Hover Background:   neutral-800
```

## Icons Used

### Chat History

- 💬 (MessageSquare) - Chat session
- ➕ (Plus) - New chat button
- ✕ (X) - Close sidebar
- 🕐 (Clock) - Empty state

### Version History

- 🔖 (Bookmark) - Bookmark toggle
- ✅ (BookmarkCheck) - Bookmarked
- ↻ (RotateCcw) - Restore version
- ⬆️ (Upload) - Publish toggle
- 🕐 (Clock) - Empty state

## Animation Details

### Sidebar Open/Close

```
Closed → Open:
- Width: 0 → 256px/320px
- Opacity: 0 → 1
- Duration: 200ms
- Easing: ease-in-out

Open → Closed:
- Width: 256px/320px → 0
- Opacity: 1 → 0
- Duration: 200ms
- Easing: ease-in-out
```

### Card Hover

```
Normal → Hover:
- Background: transparent → neutral-100/neutral-800
- Duration: 150ms
- Easing: ease-in-out
```

### Button Press

```
Normal → Active:
- Scale: 1 → 0.95
- Duration: 100ms
- Easing: ease-out
```

## Keyboard Shortcuts (Planned)

| Shortcut               | Action                     |
| ---------------------- | -------------------------- |
| `Ctrl/Cmd + H`         | Toggle chat history        |
| `Ctrl/Cmd + Shift + H` | Toggle version history     |
| `Ctrl/Cmd + N`         | New chat session           |
| `Esc`                  | Close active sidebar       |
| `↑/↓`                  | Navigate sessions/versions |
| `Enter`                | Select/activate            |

## Accessibility

### Screen Readers

- Sidebar has `role="complementary"`
- Session cards have `aria-label` with full context
- Active session has `aria-current="true"`
- Close buttons have descriptive `aria-label`

### Keyboard Navigation

- All interactive elements are focusable
- Tab order follows visual layout
- Focus visible on all elements
- Escape key closes sidebars

### Color Contrast

- All text meets WCAG AA standards
- Active states have sufficient contrast
- Icons have proper sizing (min 16px)

## Performance Considerations

- Sidebars use CSS transitions (GPU accelerated)
- Session list virtualized for 100+ sessions (future)
- Version list lazy loads on scroll (future)
- Debounced search for performance (future)
- Local state cached to reduce API calls

---

**Related Documentation:**

- [Sidebar History Implementation](./sidebar-history-implementation.md)
- [Chat Sessions Implementation](./chat-sessions-implementation.md)
- [Version History Implementation](./version-history-implementation.md)
- [Design System Guidelines](./design-system.md)
