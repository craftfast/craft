# AI Chat Flow Example

## Example Conversation

### User Input:

```
Create a responsive header component with a logo and navigation menu
```

### AI Response (Streaming):

````
I'll create a responsive header component for you. This component will include:
- A logo on the left
- Navigation menu that collapses on mobile
- Dark mode support
- Neutral color scheme following the design system

```typescript // src/components/Header.tsx
"use client";

import { useState } from "react";
import Logo from "./Logo";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="/"
              className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Home
            </a>
            <a
              href="/features"
              className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Features
            </a>
            <a
              href="/pricing"
              className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Pricing
            </a>
            <a
              href="/contact"
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity"
            >
              Get Started
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <svg
              className="w-6 h-6 text-neutral-900 dark:text-neutral-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-2">
            <a
              href="/"
              className="block px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Home
            </a>
            <a
              href="/features"
              className="block px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Features
            </a>
            <a
              href="/pricing"
              className="block px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Pricing
            </a>
            <a
              href="/contact"
              className="block px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity"
            >
              Get Started
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
````

```

### What the User Sees in Chat:
```

✨ I'll create a responsive header component for you. This component will include:

- A logo on the left
- Navigation menu that collapses on mobile
- Dark mode support
- Neutral color scheme following the design system

```

### What Happens Behind the Scenes:
1. ✅ AI response streams in real-time
2. ✅ Code block is extracted: `src/components/Header.tsx`
3. ✅ File is created and saved to database
4. ✅ Code block is removed from chat display
5. ✅ Interface switches to "Code" tab
6. ✅ File appears in file tree

### What User Sees in Code Tab:
```

📁 src
📁 components
📄 Header.tsx ← New file appears here

```

## Multiple Files Example

### User Input:
```

Create a feature card component and a grid to display multiple features

```

### AI Creates Two Files:

**Chat Display:**
```

I'll create two components for you:

1. FeatureCard - Individual card component
2. FeaturesGrid - Grid layout to display multiple cards

```

**Files Created:**
- `src/components/FeatureCard.tsx`
- `src/components/FeaturesGrid.tsx`

### File Tree Result:
```

📁 src
📁 components
📄 Header.tsx
📄 FeatureCard.tsx
📄 FeaturesGrid.tsx

`````

## Code Examples vs Files

### Example Code (Stays in Chat):
````markdown
Here's how to use the component:

```typescript
<Header />
`````

You can also customize it by passing props...

`````

**This code block has no file path, so it stays in the chat as an example.**

### File to Create (Removed from Chat):
````markdown
```typescript // src/components/Button.tsx
export default function Button() { ... }
```
`````

**This code block has a file path, so it's extracted and removed from chat.**

## Benefits Illustrated

### ❌ Old Way (Hardcoded):

- Chat shows: "Hi! I'm Claude, your Next.js development assistant..."
- User copies code manually
- User creates files manually
- Chat cluttered with code blocks

### ✅ New Way (Streaming + Auto-creation):

- Chat starts empty
- AI response streams live
- Files created automatically
- Chat shows only conversation
- Code organized in proper file tree
- Ready to edit and deploy

## User Experience Flow

```
1. User types request
   ↓
2. AI streams response (user sees text appearing)
   ↓
3. Code blocks extracted (behind the scenes)
   ↓
4. Files saved to database
   ↓
5. Chat shows clean response
   ↓
6. Code tab shows new files
   ↓
7. User can edit/save files
   ↓
8. Repeat!
```

## Edge Cases Handled

✅ **No file path** → Code stays in chat as example
✅ **Multiple files** → All extracted and created
✅ **Nested folders** → Automatically organized in tree
✅ **Duplicate files** → Overwrites existing content
✅ **Empty response** → No files created, normal chat
✅ **Network error** → Shows error message in chat
✅ **Invalid code** → Still creates file (user can fix)
