<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js project with TypeScript, Tailwind CSS, ESLint, and App Router structure. The project is set up with modern development practices and includes:

- TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality
- App Router for modern routing
- Source directory structure

## Design System Guidelines

**CRITICAL: All components MUST follow the Craft design system guidelines:**

### Color Palette

- **ONLY use neutral colors** from Tailwind CSS: `neutral-*`, `stone-*`, or `gray-*`
- **NEVER use**: blue, red, green, yellow, purple, pink, indigo, cyan, teal, orange, lime, emerald, sky, violet, fuchsia, rose
- For semantic states (success, error, warning), use neutral color shades instead
- Refer to `docs/design-system.md` for complete color guidelines

### Border Radius (Rounded Elements)

- **All interactive elements MUST use rounded corners**
- Buttons and inputs: `rounded-full` or `rounded-lg`
- Cards/containers: `rounded-xl` or `rounded-2xl`
- Dropdowns/menus: `rounded-xl`
- Never use sharp corners (`rounded-none`) unless absolutely necessary
- Refer to `docs/design-system.md` for complete border radius guidelines

### Dark Mode

- All components must support dark mode using `dark:` variants
- Test both light and dark themes

For complete design system documentation, see `docs/design-system.md`.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

- `src/app/` - App Router pages and layouts
- `src/components/` - Reusable React components
- `public/` - Static assets
- `docs/` - Documentation including design system
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration
