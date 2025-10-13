# Currency Toggle Feature

## Overview

Added a manual currency switcher to the pricing page, allowing users to toggle between INR (Indian Rupees) and USD (US Dollars).

## Features

### 1. **Auto-Detection with Manual Override**

- The page automatically detects the user's location using the IP geolocation API
- If the user is in India, INR is pre-selected; otherwise, USD is pre-selected
- Users can manually switch between currencies at any time using the toggle

### 2. **Currency Toggle Component**

- A beautifully designed toggle switch following the Craft design system
- Located prominently below the pricing page header
- Uses rounded-full buttons with smooth transitions
- Supports both light and dark modes
- Shows which currency is currently selected with visual feedback

### 3. **Location Indicator**

- Displays the auto-detected location (India or International)
- Shows a location icon for better visual understanding
- Helps users understand why a particular currency is pre-selected

## Implementation Details

### State Management

```typescript
const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">("USD");

// Auto-set based on location detection
useEffect(() => {
  if (!loading) {
    setSelectedCurrency(isIndia ? "INR" : "USD");
  }
}, [isIndia, loading]);
```

### Currency Toggle UI

- Toggle buttons are wrapped in a rounded container (`rounded-full`)
- Active button: `bg-neutral-900 dark:bg-neutral-100` with shadow
- Inactive button: Subtle hover effects for better UX
- Smooth transitions on all state changes

### Payment Integration

- The selected currency is used when initiating Razorpay payments
- Ensures users are charged in their chosen currency
- Works seamlessly with the existing payment flow

## Design System Compliance

✅ **Neutral Colors Only**: Uses `neutral-*` colors throughout
✅ **Rounded Corners**: All interactive elements use `rounded-full` or `rounded-xl`
✅ **Dark Mode Support**: Full dark mode support with `dark:` variants
✅ **Accessibility**: Clear visual indicators and hover states

## User Experience

1. **Page Load**: Currency is auto-detected based on location
2. **Manual Switch**: Users can click either USD or INR button
3. **Price Update**: All pricing displays update immediately
4. **Payment**: Selected currency is used for checkout

## Visual Hierarchy

```
Pricing Page Header
↓
Currency Toggle (USD | INR)
↓
Location Indicator
↓
Pricing Cards (prices shown in selected currency)
```

## Future Enhancements

- Add more currency options (EUR, GBP, etc.)
- Store user's currency preference in localStorage
- Add currency conversion rates in real-time
- Show equivalent prices in both currencies
