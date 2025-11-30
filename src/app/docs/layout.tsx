import { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import { DocsSidebar, MobileDocsSidebar, DocsSearch } from "@/components/docs";

export const metadata: Metadata = {
  title: {
    default: "Documentation",
    template: "%s | Craft Docs",
  },
  description:
    "Learn how to build amazing projects with Craft - the AI-powered development platform.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-6 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo
                variant="extended"
                className="text-white dark:text-white"
                href="/"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Search - Desktop */}
              <div className="hidden lg:block w-64">
                <DocsSearch />
              </div>

              <HeaderNav />
            </div>
          </div>
        </div>

        {/* Search - Mobile/Tablet */}
        <div className="lg:hidden px-4 pb-3">
          <DocsSearch />
        </div>
      </header>

      <div className="pt-[88px] lg:pt-14">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden lg:block fixed left-0 top-14 bottom-0 w-64 overflow-y-auto bg-background minimalist-scrollbar">
          <div className="p-6">
            <DocsSidebar />
          </div>
        </aside>

        {/* Right Sidebar Spacer - Desktop (for TOC) */}
        <aside className="hidden xl:block fixed right-0 top-14 bottom-0 w-64 bg-background" />

        {/* Main Content Area - Centered between sidebars */}
        <main className="lg:ml-64 xl:mr-64">{children}</main>
      </div>

      {/* Mobile Sidebar */}
      <MobileDocsSidebar />
    </div>
  );
}
