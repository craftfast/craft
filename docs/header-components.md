# Separate Headers Implementation

This document explains the separate header components created for the `/home` and `/dashboard` pages.

## Overview

We've created two distinct header components to provide different navigation experiences:

1. **HomeHeader** - For the `/home` page (public + authenticated users)
2. **DashboardHeader** - For the `/dashboard` page (authenticated users only)

## Component Details

### HomeHeader (`src/components/HomeHeader.tsx`)

**Purpose:** Provides comprehensive navigation for all users visiting the home page.

**Features:**
- **Full Navigation Menu**: 
  - Pricing
  - Help
  - Enterprise
  - Contribute (external link to GitHub)
  - Updates (external link to X/Twitter)

- **For Logged-in Users**:
  - Dashboard button (quick access to dashboard)
  - User profile icon with dropdown menu
    - User info display
    - Dashboard link
    - Upgrade Plan link
    - Sign out option

- **For Visitors**:
  - Log in button
  - Sign up button

**Use Case:** Perfect for users landing on the home page who need access to all site resources and information.

---

### DashboardHeader (`src/components/DashboardHeader.tsx`)

**Purpose:** Provides streamlined navigation focused on authenticated user actions.

**Features:**
- **Simplified Navigation Menu**:
  - Pricing (for upgrades)
  - Help

- **User Profile Icon** with dropdown menu:
  - User info display
  - Dashboard link (to refresh/return to dashboard)
  - Upgrade Plan link
  - Sign out option

**Notable Differences:**
- ❌ No "Dashboard" button (already on dashboard page)
- ❌ No Enterprise, Contribute, or Updates links (less relevant when working)
- ✅ Cleaner, more focused interface for users actively using the app
- ✅ Only shows essential navigation and user actions

**Use Case:** Ideal for authenticated users working in the dashboard, providing a distraction-free header with only essential navigation.

---

## Design Philosophy

### HomeHeader - Discovery & Exploration
- **Goal**: Help users discover features, learn about the product, and get started
- **Audience**: Both new visitors and returning users
- **Navigation**: Comprehensive - includes marketing, community, and product links
- **Call-to-Action**: Prominent sign-up/sign-in or quick dashboard access

### DashboardHeader - Focus & Productivity
- **Goal**: Minimize distractions and provide quick access to essential functions
- **Audience**: Authenticated users actively using the application
- **Navigation**: Minimal - only what's needed during active work sessions
- **Call-to-Action**: User account management and plan upgrades

---

## Implementation

### Home Page
```tsx
import HomeHeader from "@/components/HomeHeader";

// In the header section:
<HomeHeader />
```

### Dashboard Page
```tsx
import DashboardHeader from "@/components/DashboardHeader";

// In the header section:
<DashboardHeader />
```

---

## Mobile Experience

Both headers include:
- ✅ Responsive mobile menu
- ✅ User info display in mobile dropdown
- ✅ Touch-friendly navigation
- ✅ Same feature parity across devices

---

## Future Considerations

### Potential Enhancements:

**HomeHeader:**
- Add notification bell for logged-in users
- Include quick search functionality
- Add language/region selector

**DashboardHeader:**
- Add breadcrumb navigation for deeper pages
- Include workspace/project switcher
- Add quick command palette trigger

---

## Design System Compliance

Both headers follow the Craft design system:
- ✅ Neutral color palette only
- ✅ Rounded borders (`rounded-full`, `rounded-xl`)
- ✅ Dark mode support
- ✅ Consistent spacing and typography
- ✅ Smooth transitions and hover states
