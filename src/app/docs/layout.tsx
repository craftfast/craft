"use client";

import SidebarLayout from "@/components/SidebarLayout";
import AppHeader from "@/components/AppHeader";
import { DocsSidebar, MobileDocsSidebar, DocsSearch } from "@/components/docs";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarLayout>
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        {/* Header */}
        <AppHeader />

        {/* Search - Mobile/Tablet */}
        <div className="lg:hidden px-4 py-3 border-b border-border">
          <DocsSearch />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Desktop - Fixed with own scrollbar */}
          <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="p-6">
              {/* Search - Desktop */}
              <div className="mb-6">
                <DocsSearch />
              </div>
              <DocsSidebar />
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
            {children}
          </main>

          {/* Right Sidebar Spacer - Desktop (for TOC) */}
          <aside className="hidden xl:block w-64 flex-shrink-0" />
        </div>

        {/* Mobile Sidebar */}
        <MobileDocsSidebar />
      </div>
    </SidebarLayout>
  );
}
