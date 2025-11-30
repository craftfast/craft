import { notFound } from "next/navigation";
import { TableOfContents, DocsNavigation } from "@/components/docs";
import {
  docsConfig,
  findDocByPath,
  getDocNavigation,
  getAllDocSlugs,
} from "@/lib/docs-config";

// Import all MDX content
import IntroductionContent from "@/content/docs/getting-started/introduction.mdx";
import QuickStartContent from "@/content/docs/getting-started/quick-start.mdx";
import InstallationContent from "@/content/docs/getting-started/installation.mdx";
import ProjectsContent from "@/content/docs/core-concepts/projects.mdx";
import AiChatContent from "@/content/docs/core-concepts/ai-chat.mdx";
import LivePreviewContent from "@/content/docs/core-concepts/live-preview.mdx";
import FileManagementContent from "@/content/docs/core-concepts/file-management.mdx";
import CodeGenerationContent from "@/content/docs/features/code-generation.mdx";
import TemplatesContent from "@/content/docs/features/templates.mdx";
import EnvironmentVariablesContent from "@/content/docs/features/environment-variables.mdx";
import DatabaseIntegrationContent from "@/content/docs/features/database-integration.mdx";
import DeploymentContent from "@/content/docs/features/deployment.mdx";
import BuildingLandingPageContent from "@/content/docs/guides/building-landing-page.mdx";
import FullStackAppContent from "@/content/docs/guides/full-stack-app.mdx";
import WorkingWithApisContent from "@/content/docs/guides/working-with-apis.mdx";
import BestPracticesContent from "@/content/docs/guides/best-practices.mdx";
import ApiOverviewContent from "@/content/docs/api-reference/overview.mdx";
import AuthenticationContent from "@/content/docs/api-reference/authentication.mdx";
import ProjectsApiContent from "@/content/docs/api-reference/projects-api.mdx";
import RateLimitsContent from "@/content/docs/api-reference/rate-limits.mdx";

// Map slugs to MDX content
const contentMap: Record<string, Record<string, React.ComponentType>> = {
  "getting-started": {
    introduction: IntroductionContent,
    "quick-start": QuickStartContent,
    installation: InstallationContent,
  },
  "core-concepts": {
    projects: ProjectsContent,
    "ai-chat": AiChatContent,
    "live-preview": LivePreviewContent,
    "file-management": FileManagementContent,
  },
  features: {
    "code-generation": CodeGenerationContent,
    templates: TemplatesContent,
    "environment-variables": EnvironmentVariablesContent,
    "database-integration": DatabaseIntegrationContent,
    deployment: DeploymentContent,
  },
  guides: {
    "building-landing-page": BuildingLandingPageContent,
    "full-stack-app": FullStackAppContent,
    "working-with-apis": WorkingWithApisContent,
    "best-practices": BestPracticesContent,
  },
  "api-reference": {
    overview: ApiOverviewContent,
    authentication: AuthenticationContent,
    "projects-api": ProjectsApiContent,
    "rate-limits": RateLimitsContent,
  },
};

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const allDocs = getAllDocSlugs();
  return allDocs.map(({ section, slug }) => ({
    slug: [section, slug],
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const [sectionSlug, docSlug] = resolvedParams.slug || [];

  if (!sectionSlug || !docSlug) {
    return { title: "Documentation" };
  }

  const docInfo = findDocByPath(sectionSlug, docSlug);

  if (!docInfo) {
    return { title: "Not Found" };
  }

  return {
    title: `${docInfo.doc.title} | ${docInfo.section.title}`,
    description: docInfo.doc.description,
  };
}

export default async function DocPage({ params }: PageProps) {
  const resolvedParams = await params;
  const [sectionSlug, docSlug] = resolvedParams.slug || [];

  if (!sectionSlug || !docSlug) {
    notFound();
  }

  const docInfo = findDocByPath(sectionSlug, docSlug);

  if (!docInfo) {
    notFound();
  }

  const Content = contentMap[sectionSlug]?.[docSlug];

  if (!Content) {
    notFound();
  }

  const navigation = getDocNavigation(sectionSlug, docSlug);

  return (
    <div className="relative">
      {/* Main Content */}
      <div className="px-6 lg:px-12 py-12 max-w-4xl mx-auto">
        <div className="">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            <span>{docInfo.section.title}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-foreground">{docInfo.doc.title}</span>
          </div>

          {/* MDX Content */}
          <article
            className="prose prose-neutral dark:prose-invert max-w-none"
            data-docs-content
          >
            <Content />
          </article>

          {/* Navigation */}
          <DocsNavigation prev={navigation.prev} next={navigation.next} />
        </div>
      </div>

      {/* Right Sidebar - Table of Contents (Fixed) */}
      <aside className="hidden xl:block fixed right-0 top-14 bottom-0 w-64 overflow-y-auto overflow-x-hidden bg-background [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="p-6 pt-12">
          <TableOfContents />
        </div>
      </aside>
    </div>
  );
}
