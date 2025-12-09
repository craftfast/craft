# Contributing to Craft

First off, thank you for considering contributing to Craft! 🎉

Craft is an open-source AI-powered development environment, and we welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm (recommended) or npm
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/craft.git
   cd craft
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/craftfast/craft.git
   ```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots if applicable
- Your environment (OS, Node version, browser)

### Suggesting Features

Feature suggestions are welcome! Please:

- Check if the feature has already been suggested
- Provide a clear description of the feature
- Explain why this feature would be useful
- Consider how it fits with the project's goals

### Pull Requests

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Write or update tests as needed
4. Ensure all tests pass
5. Commit your changes with a clear message
6. Push to your fork and submit a pull request

## Development Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Set up required environment variables (see `.env.example` for details)

4. Run database migrations:

   ```bash
   pnpm db:migrate
   ```

5. Start the development server:

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Pull Request Process

1. Update documentation if needed
2. Ensure your code follows the style guide
3. Make sure all checks pass (lint, type-check, tests)
4. Request review from maintainers
5. Address any feedback

### Commit Message Format

Use clear, descriptive commit messages:

```
type(scope): short description

Longer description if needed...
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat(chat): add image upload support`
- `fix(sandbox): resolve hot reload issue`
- `docs(readme): update installation steps`

## Style Guide

### Code Style

- **TypeScript**: Use strict TypeScript with proper typing
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS following the design system (see `docs/design-system.md`)
- **Formatting**: Prettier (runs automatically)
- **Linting**: ESLint rules must pass

### Design System

All UI components must follow the Craft design system:

- Use neutral colors only (`neutral-*`, `stone-*`, `gray-*`)
- Rounded corners on interactive elements
- Support both light and dark modes

See `docs/design-system.md` for complete guidelines.

### File Organization

```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable React components
├── lib/           # Utilities, services, and configurations
├── contexts/      # React context providers
└── hooks/         # Custom React hooks
```

## Community

- **GitHub Discussions**: Ask questions and discuss features
- **Discord**: Join our community for real-time chat
- **Twitter/X**: Follow [@craftfast](https://twitter.com/craftfast) for updates

## Recognition

Contributors will be recognized in our README and release notes. Thank you for helping make Craft better! ✨

---

## License

By contributing to Craft, you agree that your contributions will be licensed under the Apache License 2.0.
