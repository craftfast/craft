# Logo Component Usage Examples

The `Logo` component and `LogoIcon` are reusable components for displaying the Craft brand logo.

## Components

### `Logo` (default export)

Full logo with icon and text, or either individually.

### `LogoIcon` (named export)

Just the 3D cube icon component.

## Basic Usage

```tsx
import Logo, { LogoIcon } from "@/components/Logo";

// Default: Icon + Text
<Logo />

// Icon only
<Logo showText={false} />

// Text only
<Logo showIcon={false} />

// Just the icon component
<LogoIcon />
```

## Props

### Logo Props

| Prop            | Type                           | Default | Description                      |
| --------------- | ------------------------------ | ------- | -------------------------------- |
| `showIcon`      | `boolean`                      | `true`  | Show the 3D cube icon            |
| `showText`      | `boolean`                      | `true`  | Show "Craft" text                |
| `iconSize`      | `"sm" \| "md" \| "lg"`         | `"md"`  | Size of the icon                 |
| `textSize`      | `"sm" \| "md" \| "lg" \| "xl"` | `"md"`  | Size of the text                 |
| `className`     | `string`                       | `""`    | Additional classes for container |
| `iconClassName` | `string`                       | `""`    | Additional classes for icon      |
| `textClassName` | `string`                       | `""`    | Additional classes for text      |

### LogoIcon Props

| Prop        | Type     | Default | Description           |
| ----------- | -------- | ------- | --------------------- |
| `width`     | `number` | `24`    | Icon width in pixels  |
| `height`    | `number` | `26`    | Icon height in pixels |
| `className` | `string` | `""`    | Additional classes    |

## Examples

### Different Sizes

```tsx
// Small logo
<Logo iconSize="sm" textSize="sm" />

// Medium logo (default)
<Logo iconSize="md" textSize="md" />

// Large logo
<Logo iconSize="lg" textSize="lg" />

// Extra large text
<Logo iconSize="lg" textSize="xl" />
```

### Custom Colors

```tsx
// White icon on dark background
<Logo iconClassName="text-white" />

// Custom colored icon (use neutral colors per design system)
<Logo iconClassName="text-neutral-700 dark:text-neutral-300" />

// Custom text color
<Logo textClassName="text-neutral-800 dark:text-neutral-200" />

// Both custom colors
<Logo
  iconClassName="text-neutral-700 dark:text-neutral-300"
  textClassName="text-neutral-900 dark:text-neutral-100"
/>
```

### Icon Only Variations

```tsx
// Small icon only
<Logo showText={false} iconSize="sm" />

// Large icon only
<Logo showText={false} iconSize="lg" />

// Custom styled icon only
<Logo
  showText={false}
  iconSize="md"
  iconClassName="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
/>

// Or use LogoIcon directly
<LogoIcon width={32} height={35} className="text-neutral-700 dark:text-neutral-300" />
```

### Text Only Variations

```tsx
// Small text only
<Logo showIcon={false} textSize="sm" />

// Large text only
<Logo showIcon={false} textSize="lg" />

// Custom styled text only
<Logo
  showIcon={false}
  textSize="xl"
  textClassName="font-bold text-neutral-900 dark:text-neutral-100"
/>
```

### Navigation Examples

```tsx
// In a navbar
<nav className="flex items-center justify-between p-4">
  <Logo />
  <div>{/* nav items */}</div>
</nav>

// As a clickable link
<a href="/" className="inline-block">
  <Logo className="hover:opacity-80 transition-opacity" />
</a>

// Footer logo
<footer className="text-center py-8">
  <Logo iconSize="sm" textSize="sm" className="justify-center" />
</footer>
```

### Advanced Styling

```tsx
// With custom container styling
<Logo
  className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg shadow-md"
  iconClassName="text-neutral-700 dark:text-neutral-300"
  textClassName="text-neutral-900 dark:text-neutral-100"
/>

// Responsive sizing
<Logo
  className="flex items-center gap-2 sm:gap-3"
  iconSize="md"
  textSize="md"
/>

// Animated on hover
<Logo
  className="transition-transform hover:scale-105 cursor-pointer"
  iconClassName="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
/>
```

## Icon Sizes Reference

| Size | Width | Height |
| ---- | ----- | ------ |
| `sm` | 20px  | 22px   |
| `md` | 24px  | 26px   |
| `lg` | 32px  | 35px   |

## Text Sizes Reference

| Size | Tailwind Classes       |
| ---- | ---------------------- |
| `sm` | `text-base sm:text-lg` |
| `md` | `text-xl sm:text-2xl`  |
| `lg` | `text-2xl sm:text-3xl` |
| `xl` | `text-3xl sm:text-4xl` |

## Color Information

The logo icon uses `currentColor`, which means it inherits the text color from its parent or can be styled using text color utilities.

**Design System Compliance:** Per the Craft design system guidelines, only use neutral colors (e.g., `text-white`, `text-neutral-700`, `text-neutral-900`, `text-stone-600`). Avoid colored text utilities like blue, red, green, etc.

The icon has multiple opacity levels to create a 3D effect:

- Top face: 90% opacity
- Left face: 70% opacity
- Right face: 50% opacity
- Edges: 40% opacity

This creates depth while maintaining color consistency.
