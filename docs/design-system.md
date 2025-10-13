# Design System Guidelines

## Color Palette

**Craft uses ONLY neutral colors from Tailwind CSS for all UI components.**

### Neutral Color Scale

- Use `neutral-*` (preferred for dark mode compatibility)
- Use `stone-*` (for warmer tones where appropriate)
- Use `gray-*` (for cooler tones where appropriate)

### Semantic Colors

The following Tailwind CSS variables are defined in `globals.css` and should be used for theming:

- `background` - Main background color
- `foreground` - Main text color
- `surface` - Surface/card backgrounds
- `border` - Border colors
- `accent` - Accent color (mapped to neutral shades)
- `muted` - Muted/secondary text

### Forbidden Colors

❌ **DO NOT USE:** blue, red, green, yellow, purple, pink, indigo, cyan, teal, orange, lime, emerald, sky, violet, fuchsia, rose

### Special Cases

- **Success states**: Use `neutral-600` or `neutral-700` instead of green
- **Error states**: Use `neutral-800` or `neutral-900` instead of red
- **Warning states**: Use `neutral-500` or `neutral-600` instead of yellow
- **Info states**: Use `neutral-400` or `neutral-500` instead of blue

## Border Radius (Rounded Elements)

**All interactive elements and containers must use rounded corners.**

### Standard Border Radius Classes

- **Buttons**: `rounded-full` or `rounded-lg`
- **Input fields**: `rounded-full` or `rounded-lg`
- **Cards/Containers**: `rounded-xl` or `rounded-2xl`
- **Dropdowns/Menus**: `rounded-xl`
- **Badges/Pills**: `rounded-full`
- **Icons**: `rounded-full` (for circular icons)
- **Small elements**: `rounded-md` or `rounded-lg`

### Guidelines

- Prefer `rounded-full` for buttons and inputs for a modern, friendly look
- Use `rounded-xl` or `rounded-2xl` for larger containers and cards
- Maintain consistency within component types
- Never use sharp corners (`rounded-none`) unless absolutely necessary for design reasons

## Component Standards

### Buttons

```tsx
// Primary Button
className =
  "px-6 py-3 bg-foreground text-background hover:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full transition-colors duration-200";

// Secondary Button
className =
  "px-6 py-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors duration-200";

// Icon Button
className =
  "p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors duration-200";
```

### Input Fields

```tsx
className =
  "px-4 py-3 bg-surface border border-neutral-300 dark:border-neutral-700 text-foreground placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 rounded-full transition-all duration-200";
```

### Cards/Containers

```tsx
className =
  "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg";
```

### Dropdowns/Menus

```tsx
className =
  "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden";
```

### Status Indicators

```tsx
// Active/Live indicator (use neutral instead of green)
className =
  "w-2 h-2 bg-neutral-700 dark:bg-neutral-300 rounded-full animate-pulse";

// Disabled state
className = "opacity-50 cursor-not-allowed";
```

## Transitions and Animations

### Standard Duration

- Quick interactions: `duration-150` or `duration-200`
- Normal transitions: `duration-200` or `duration-300`
- Slow/deliberate: `duration-300` or `duration-500`

### Common Transitions

```tsx
transition-colors duration-200
transition-all duration-200
transition-transform duration-200
```

## Dark Mode Support

All components must support dark mode using Tailwind's `dark:` variant:

```tsx
// Background
bg-white dark:bg-neutral-900

// Text
text-neutral-900 dark:text-neutral-100

// Borders
border-neutral-200 dark:border-neutral-700

// Hover states
hover:bg-neutral-100 dark:hover:bg-neutral-800
```

## Accessibility

- Maintain adequate color contrast (WCAG AA minimum)
- Use semantic HTML elements
- Include proper ARIA labels for interactive elements
- Ensure keyboard navigation works properly
- Focus states should be visible: `focus:outline-none focus:ring-2 focus:ring-neutral-500/20`

## Examples

### ✅ Good

```tsx
<button className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full transition-colors duration-200">
  Click me
</button>
```

### ❌ Bad

```tsx
<button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-none">
  Click me
</button>
```

## Checklist for New Components

- [ ] Uses only neutral colors (neutral, stone, or gray scales)
- [ ] All interactive elements have rounded corners
- [ ] Supports dark mode
- [ ] Has proper hover/focus states
- [ ] Uses consistent spacing
- [ ] Includes appropriate transitions
- [ ] Accessible (keyboard navigation, ARIA labels, contrast)
