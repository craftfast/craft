# Contribution Guidelines

Welcome to **craft.tech**! We appreciate your interest in contributing to our vibe coding tool. This guide will help you get started and ensure your contributions align with our project goals. 🚀

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Pull Request Guidelines](#pull-request-guidelines)
4. [Coding Standards](#coding-standards)
5. [Development Setup](#development-setup)
6. [Testing](#testing)
7. [Project Structure](#project-structure)

---

## 🛡️ Code of Conduct

This project is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this code. We are committed to providing a welcoming and inspiring community for all. Report unacceptable behavior to the project maintainers at security@craft.tech.

### Our Standards

- **Be respectful** and inclusive in all interactions
- **Be collaborative** and help others learn and grow
- **Be constructive** when providing feedback
- **Be patient** with newcomers and different skill levels

---

## 🛠️ How Can I Contribute?

### 1️⃣ Reporting Bugs or Feature Requests

- Check existing [issues](https://github.com/craftdottech/craft/issues) to avoid duplicates
- Use issue templates when available
- Provide detailed information including:
  - Steps to reproduce bugs
  - Expected vs actual behavior
  - Environment details (OS, browser, Node.js version)
  - Screenshots or error logs when relevant

### 2️⃣ Code Contributions

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch from `dev`
4. **Make** your changes
5. **Test** your changes thoroughly
6. **Commit** with clear, descriptive messages
7. **Push** to your fork
8. **Submit** a pull request

### Branching Strategy

- `main`: stable, release-ready
- `dev`: default branch for active development

Please target PRs to `dev` unless it's a hotfix to `main`.

### Commit Standards

- Use clear, descriptive commit messages
- Reference issues, e.g., `Fix: handle null input (#123)`

### Pull Request Checklist

- Includes tests when applicable
- Passes `npm run lint` and type-checks (`npx tsc --noEmit`)
- Updates docs if behavior changes

### 3️⃣ Documentation

Help improve our documentation by:

- Fixing typos or unclear explanations
- Adding examples and use cases
- Translating content
- Writing tutorials or guides

### 4️⃣ Community Support

- Answer questions in discussions
- Help newcomers get started
- Share your craft.tech creations
- Provide feedback on new features

---

## ✅ Pull Request Guidelines

### Before Submitting

- [ ] Branch from the **dev** branch
- [ ] Ensure your code follows our coding standards
- [ ] Add or update tests as needed
- [ ] Update documentation if required
- [ ] Test your changes locally
- [ ] Write clear commit messages

### PR Requirements

- **Focus**: One feature or bug fix per PR
- **Description**: Clear explanation of changes and motivation
- **Testing**: Include manual testing steps
- **Documentation**: Update relevant docs
- **Breaking Changes**: Clearly mark and explain any breaking changes

### Review Process

1. **Automated checks** must pass (linting, type checking)
2. **Manual testing** by reviewers
3. **Code review** by at least one maintainer
4. **Address feedback** and make requested changes
5. **Merge** once approved

---

## 📏 Coding Standards

### TypeScript & React

- Use **TypeScript** for all new code
- Define proper **interfaces** and **types**
- Use **functional components** with hooks
- Follow **React best practices**
- Implement proper **error boundaries**

### Code Style

- Use **Prettier** for formatting (configured in the project)
- Follow **ESLint** rules (configured in the project)
- Use **meaningful variable names**
- Keep **functions small** and focused
- Add **comments** for complex logic
- Use **consistent naming conventions**

### File Organization

- Group related files in **logical directories**
- Use **index.ts** files for clean exports
- Keep **components small** and reusable
- Separate **business logic** from UI components

---

## 🖥️ Development Setup

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **pnpm** (recommended)
- **Git** for version control

### 1️⃣ Clone and Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/craft.git
cd craft

# Install dependencies
npm install
# or
pnpm install

# Copy environment file (if needed)
cp .env.example .env.local
```

### 2️⃣ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### 3️⃣ Environment Setup

1. Copy `.env.example` to `.env.local`
2. Add any required API keys or configuration
3. Never commit `.env.local` to version control

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write **unit tests** for utilities and pure functions
- Write **integration tests** for component interactions
- Write **e2e tests** for critical user flows
- Follow **Testing Library** best practices
- Aim for **good test coverage** without obsessing over 100%

### Test Structure

```typescript
describe("ComponentName", () => {
  it("should render correctly", () => {
    // Test implementation
  });

  it("should handle user interactions", () => {
    // Test implementation
  });
});
```

---

## 🏗️ Project Structure

```
craft/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # Reusable React components
│   │   ├── ui/             # Basic UI components
│   │   └── features/       # Feature-specific components
│   ├── lib/                # Utility functions and configurations
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Additional stylesheets
├── public/                 # Static assets
├── docs/                   # Documentation
├── tests/                  # Test files
└── scripts/                # Build and development scripts
```

### Key Directories

- **`src/app/`**: Next.js 13+ App Router structure
- **`src/components/`**: Reusable UI components
- **`src/lib/`**: Utility functions, API clients, configurations
- **`src/hooks/`**: Custom React hooks
- **`src/types/`**: TypeScript type definitions

---

## 🚀 Getting Help

### Resources

- **Documentation**: Check our [README](README.md)
- **Issues**: Browse [existing issues](https://github.com/craftdottech/craft/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/craftdottech/craft/discussions)

### Communication

- **Be specific** when asking for help
- **Include context** about what you're trying to achieve
- **Share code snippets** or error messages when relevant
- **Be patient** - maintainers are volunteers

---

## 🎉 Recognition

All contributors will be recognized in our:

- **Contributors section** in the README
- **Release notes** for significant contributions
- **Community highlights** for exceptional help

---

## 📝 License

By contributing to craft.tech, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to **craft.tech**! Together, we're building an amazing vibe coding tool that empowers developers worldwide. 🌟
