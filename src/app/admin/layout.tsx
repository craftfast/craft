/**
 * Admin Panel Layout
 *
 * Protected layout for admin-only pages with sidebar navigation
 * All admin routes require authentication and admin role
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/admin-auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Panel | Craft",
  description:
    "Craft Admin Panel - Manage users, projects, and system settings",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Check authentication
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Check admin role
  const hasAdminRole = await isAdmin(session.user.id);
  if (!hasAdminRole) {
    redirect("/chat");
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 ml-64">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
