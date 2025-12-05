"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import UserMenu from "./UserMenu";
import CreditCounter from "./CreditCounter";
import Logo from "./Logo";
import { useSidebar } from "@/contexts/SidebarContext";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ReactNode } from "react";

interface AppHeaderProps {
  userId?: string;
  showLogoText?: boolean;
  /** Custom content to show after the logo (e.g., project name, breadcrumbs) */
  afterLogo?: ReactNode;
  /** Custom content to show in the center of the header (e.g., URL bar, search) */
  centerContent?: ReactNode;
  /** Custom content to show before the credits on the right side */
  beforeCredits?: ReactNode;
  /** Whether to use fixed positioning instead of sticky */
  fixed?: boolean;
  /** Custom credit counter click action */
  onCreditClick?: () => void;
}

export default function AppHeader({
  showLogoText = true,
  afterLogo,
  centerContent,
  beforeCredits,
  fixed = false,
  onCreditClick,
}: AppHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { setIsExpanded } = useSidebar();

  const defaultCreditClick = () => router.push("/settings/billing");

  return (
    <header
      className={`${
        fixed ? "fixed left-0 right-0" : "sticky"
      } top-0 z-[40] bg-background/80 backdrop-blur-md`}
    >
      <div
        className={`${
          centerContent ? "grid grid-cols-3" : "flex justify-between"
        } items-center px-2 h-12`}
      >
        {/* Left - Menu toggle, Logo, and optional content */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 mt-1 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Logo
            variant={showLogoText ? "extended" : "icon"}
            className="!h-5"
            href="/"
          />
          {afterLogo && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1 ml-3" />
              {afterLogo}
            </>
          )}
        </div>

        {/* Center - Optional custom content (e.g., URL bar) */}
        {centerContent && (
          <div className="flex items-center justify-center">
            {centerContent}
          </div>
        )}

        {/* Right - Custom content, Credits, and user menu OR Sign in buttons */}
        <div className="flex items-center justify-end gap-2">
          {beforeCredits}
          {session?.user ? (
            <>
              <CreditCounter
                onClickAction={onCreditClick || defaultCreditClick}
              />
              <UserMenu user={session.user} />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push("/auth/signin")}
                className="rounded-full"
              >
                Log in
              </Button>
              <Button
                onClick={() => router.push("/auth/signup")}
                className="rounded-full"
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
