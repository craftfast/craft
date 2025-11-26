# Craft

[![Craft: The Ultimate Vibe Coding Tool](./public/craft-preview.png)](https://craft.fast)

Welcome to **Craft** - a revolutionary vibe coding tool that transforms the way developers create, collaborate, and craft amazing applications. Craft brings a unique blend of AI-powered development, modern tooling, and an exceptional developer experience.

**Craft** is developed and operated by **Nextcrafter Labs (OPC) Private Limited**.

---

## 🌟 Features

### 🎨 **Vibe-Driven Development**

- **Intuitive Interface**: Clean, modern UI that adapts to your coding style
- **Smart Code Assistance**: AI-powered suggestions and completions
- **Real-time Collaboration**: Work together seamlessly with your team
- **Visual Code Building**: Drag-and-drop components and visual editors

### ⚡ **Modern Development Stack**

- **Next.js 15**: Latest App Router with React 19
- **TypeScript**: Full type safety and enhanced developer experience
- **Tailwind CSS v4**: Cutting-edge styling with performance optimizations
- **Turbopack**: Lightning-fast build times with next-generation bundling

### 🚀 **Performance & Developer Experience**

- **Hot Module Replacement**: Instant feedback during development
- **Optimized Builds**: Production-ready with automatic optimizations
- **Analytics Integration**: Built-in Vercel Analytics and Speed Insights
- **SEO Optimized**: Best practices for search engine optimization

### 🛠️ **Developer Tools**

- **ESLint Integration**: Code quality and consistency
- **TypeScript Support**: Full type checking and IntelliSense
- **Modern JavaScript**: Latest ECMAScript features
- **Component Architecture**: Modular and reusable component system

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm**, **yarn**, **pnpm**, or **bun**

### Installation

```bash
# Clone the repository
git clone https://github.com/craftfast/craft.git
cd craft

# Install dependencies
pnpm install

# Start the development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see Craft in action! 🎉

### Development Commands

```bash
# Development server with Turbopack
pnpm run dev

# Production build
pnpm run build

# Start production server
pnpm run start

# Run ESLint
pnpm run lint
```

---

## 📁 Project Structure

```
craft/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # Reusable components
│   └── lib/                 # Utilities and configurations
├── public/                  # Static assets
└── README.md               # This file
```

---

## 🎯 Getting Started with Craft

### 1. **Explore the Interface**

Start by familiarizing yourself with the Craft interface. The clean, modern design is built to enhance your coding experience.

### 2. **Create Your First Project**

Use the intuitive project creation tools to start building your next amazing application.

### 3. **Customize Your Workspace**

Personalize Craft to match your coding style and preferences.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Next.js 15, TypeScript
- **Styling**: Tailwind CSS v4, PostCSS
- **Build Tool**: Turbopack (Next.js native)
- **Code Quality**: ESLint, TypeScript
- **Analytics**: Vercel Analytics, Speed Insights

---

## 📖 Documentation

For detailed information, please contact our support team.

---

## 🔧 Production Deployment

### Database Backups

Craft uses **Neon PostgreSQL** which provides automated backups:

- **Point-in-time recovery**: Restore to any point within your retention period
- **Automatic daily snapshots**: Handled automatically by Neon
- **Branching**: Create instant database branches for testing
- **High availability**: 99.95% uptime SLA on Pro plans

For manual backups, you can use pg_dump:

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Environment Variables

All required environment variables are documented in `.env.example`. Critical variables include:

- **Authentication**: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- **Database**: `DATABASE_URL` (Neon PostgreSQL)
- **AI Providers**: API keys for Anthropic, OpenAI, Google, xAI
- **Payments**: Razorpay credentials
- **E2B Sandbox**: `E2B_API_KEY` for live preview
- **Error Tracking**: `SENTRY_DSN` for production monitoring

### Monitoring

- **Sentry**: Error tracking and performance monitoring (add `SENTRY_DSN`)
- **Vercel Analytics**: Built-in performance metrics
- **Rate Limiting**: Configured via Upstash Redis

---

## 📈 Roadmap

### 🎯 Current Focus

- **AI Integration**: Enhanced code assistance and generation
- **Real-time Collaboration**: Live editing and sharing features
- **Plugin System**: Extensible architecture for custom tools
- **Performance Optimization**: Faster builds and better user experience

### 🚀 Upcoming Features

- **Visual Code Builder**: Drag-and-drop interface for rapid development
- **Template Gallery**: Pre-built templates for common use cases
- **Cloud Sync**: Seamless project synchronization across devices
- **Advanced Analytics**: Deep insights into your development workflow

---

## 📄 License

This project is licensed under a **Proprietary License** - see the [LICENSE](LICENSE) file for details.

All rights reserved © 2025 Nextcrafter Labs (OPC) Private Limited

---

**Made with ✨ by the Craft team**
