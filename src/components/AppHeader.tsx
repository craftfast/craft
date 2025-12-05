"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import UserMenu from "./UserMenu";
import CreditCounter from "./CreditCounter";
import Logo from "./Logo";
import { useSidebar } from "@/contexts/SidebarContext";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";

interface AppHeaderProps {
  userId?: string;
  showLogoText?: boolean;
}

export default function AppHeader({ showLogoText = true }: AppHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { setIsExpanded } = useSidebar();

  return (
    <header className="sticky top-0 z-[40] bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left - Menu toggle and Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo
            variant={showLogoText ? "extended" : "icon"}
            className="!h-5"
            href="/"
          />
        </div>

        {/* Right - Credits and user menu OR Sign in buttons */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <CreditCounter
                onClickAction={() => {
                  router.push("/settings/billing");
                }}
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
