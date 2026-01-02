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

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint

## Project Structure

- `src/app/` - App Router pages and layouts
- `src/components/` - Reusable React components
- `src/lib/` - Utilities, configurations, and services
  - `src/lib/templates/` - Project template services (Next.js, etc.)
- `public/` - Static assets
- `docs/` - Documentation including design system
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration

## Professional Project Creation System

All projects created in Craft start with a standardized Next.js template that includes:

- Next.js 15 + React 19 + TypeScript
- **Tailwind CSS v4** (CRITICAL: Always use v4 with `@tailwindcss/postcss`)
- Professional configuration files
- Production-ready structure

### CRITICAL: Tailwind CSS v4 Requirements

When modifying or generating `package.json` files, you MUST always use:

```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

And ensure `postcss.config.mjs` exists with:

```js
const config = {
  plugins: ["@tailwindcss/postcss"],
};
export default config;
```

**Never use Tailwind CSS v3.x** - it's incompatible with our E2B sandbox template.

**Key files:**

- `src/lib/templates/nextjs.ts` - Next.js template service
- Template includes: package.json, tsconfig.json, app/layout.tsx, app/page.tsx, etc.
- All template files are saved to database on project creation
- AI edits these files based on user requirements
- Files sync automatically to E2B sandbox for live preview

**Workflow:**

1. User creates project → Template generated
2. AI edits template files → Saved to database
3. User previews → Files deployed to E2B sandbox
4. All changes persist in database

See `docs/professional-project-creation-summary.md` for complete details.

- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration

## Git Commit Messages

**CRITICAL: All commit messages MUST follow Conventional Commits format.**

This project uses `commitlint` with `@commitlint/config-conventional`.

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types (required)

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `refactor` - Code refactoring (no feature/fix)
- `perf` - Performance improvements
- `test` - Adding/updating tests
- `build` - Build system or dependencies
- `ci` - CI configuration
- `chore` - Other changes (tooling, etc.)

### Scope (optional but recommended)

Use the main area affected: `ai`, `api`, `ui`, `db`, `auth`, `billing`, `sandbox`, etc.

### Examples

```
feat(ai): add database SQL execution tools
fix(api): handle null response in chat endpoint
docs: update README with new setup instructions
refactor(ui): extract button component from dialog
chore(deps): upgrade Next.js to 15.1
```

### Rules

- Subject must be lowercase
- No period at the end of subject
- Subject should be imperative mood ("add" not "added")
- Body should explain "what" and "why" (not "how")
