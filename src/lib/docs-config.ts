// Documentation navigation structure and types
export interface DocItem {
    title: string;
    slug: string;
    description?: string;
}

export interface DocSection {
    title: string;
    slug: string;
    items: DocItem[];
}

// Define the documentation structure
// This is the single source of truth for all documentation navigation
export const docsConfig: DocSection[] = [
    {
        title: "Getting Started",
        slug: "getting-started",
        items: [
            {
                title: "Introduction",
                slug: "introduction",
                description: "Welcome to Craft - AI-powered development platform",
            },
            {
                title: "Quick Start",
                slug: "quick-start",
                description: "Get up and running in minutes",
            },
            {
                title: "Installation",
                slug: "installation",
                description: "Setting up your development environment",
            },
        ],
    },
    {
        title: "Core Concepts",
        slug: "core-concepts",
        items: [
            {
                title: "Projects",
                slug: "projects",
                description: "Understanding project structure and management",
            },
            {
                title: "AI Chat",
                slug: "ai-chat",
                description: "Communicating with the AI assistant",
            },
            {
                title: "Live Preview",
                slug: "live-preview",
                description: "Real-time preview of your applications",
            },
            {
                title: "File Management",
                slug: "file-management",
                description: "Working with files and directories",
            },
        ],
    },
    {
        title: "Features",
        slug: "features",
        items: [
            {
                title: "Code Generation",
                slug: "code-generation",
                description: "AI-powered code generation capabilities",
            },
            {
                title: "Templates",
                slug: "templates",
                description: "Pre-built project templates",
            },
            {
                title: "Environment Variables",
                slug: "environment-variables",
                description: "Managing secrets and configuration",
            },
            {
                title: "Database Integration",
                slug: "database-integration",
                description: "Working with databases",
            },
            {
                title: "Deployment",
                slug: "deployment",
                description: "Deploying your applications",
            },
        ],
    },
    {
        title: "Guides",
        slug: "guides",
        items: [
            {
                title: "Building a Landing Page",
                slug: "building-landing-page",
                description: "Create a beautiful landing page with AI",
            },
            {
                title: "Creating a Full-Stack App",
                slug: "full-stack-app",
                description: "Build a complete application",
            },
            {
                title: "Working with APIs",
                slug: "working-with-apis",
                description: "Integrating external APIs",
            },
            {
                title: "Best Practices",
                slug: "best-practices",
                description: "Tips for effective AI-assisted development",
            },
        ],
    },
    {
        title: "API Reference",
        slug: "api-reference",
        items: [
            {
                title: "Overview",
                slug: "overview",
                description: "API documentation overview",
            },
            {
                title: "Authentication",
                slug: "authentication",
                description: "API authentication methods",
            },
            {
                title: "Projects API",
                slug: "projects-api",
                description: "Project management endpoints",
            },
            {
                title: "Rate Limits",
                slug: "rate-limits",
                description: "API rate limiting information",
            },
        ],
    },
];

// Helper function to get all docs for static generation
export function getAllDocSlugs(): { section: string; slug: string }[] {
    const slugs: { section: string; slug: string }[] = [];

    for (const section of docsConfig) {
        for (const item of section.items) {
            slugs.push({
                section: section.slug,
                slug: item.slug,
            });
        }
    }

    return slugs;
}

// Helper function to find a doc by its path
export function findDocByPath(
    sectionSlug: string,
    docSlug: string
): { section: DocSection; doc: DocItem } | null {
    const section = docsConfig.find((s) => s.slug === sectionSlug);
    if (!section) return null;

    const doc = section.items.find((item) => item.slug === docSlug);
    if (!doc) return null;

    return { section, doc };
}

// Helper function to get next and previous docs for navigation
export function getDocNavigation(
    sectionSlug: string,
    docSlug: string
): { prev: { section: string; doc: DocItem } | null; next: { section: string; doc: DocItem } | null } {
    const allDocs = getAllDocSlugs();
    const currentIndex = allDocs.findIndex(
        (d) => d.section === sectionSlug && d.slug === docSlug
    );

    if (currentIndex === -1) {
        return { prev: null, next: null };
    }

    const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
    const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

    return {
        prev: prevDoc
            ? {
                section: prevDoc.section,
                doc: findDocByPath(prevDoc.section, prevDoc.slug)!.doc,
            }
            : null,
        next: nextDoc
            ? {
                section: nextDoc.section,
                doc: findDocByPath(nextDoc.section, nextDoc.slug)!.doc,
            }
            : null,
    };
}
