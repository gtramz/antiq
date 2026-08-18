"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AUTH_FORM_PATHS, AuthRouteGuard } from "@/modules/auth/auth-gate";
import { useAuth } from "@/context/AuthContext";
import { useIsMobileViewport } from "@/modules/shell/use-mobile-viewport";
import { BottomTabs } from "./bottom-tabs";
import { TopNav } from "./top-nav";
import { VoidWash } from "./void-wash";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobileViewport();
  const isAuthForm = AUTH_FORM_PATHS.has(pathname);
  const isLanding = pathname === "/";
  const isProfile = pathname.startsWith("/profile");

  // Desktop: TopNav everywhere except login/register.
  // Mobile: tabs/nav only when signed in (landing/auth stay chrome-free).
  const showNav =
    !isLoading &&
    !isAuthForm &&
    (!isMobile || (isAuthenticated && !isLanding));

  const showTabs =
    !isLoading && isMobile && isAuthenticated && !isAuthForm && !isLanding;

  return (
    <div
      className={`relative flex h-dvh justify-center overflow-hidden lg:block ${
        isProfile ? "surface-profile" : "bg-bg"
      }`}
    >
      <div
        className={`relative flex h-dvh w-full max-w-phone flex-col overflow-hidden lg:max-w-none ${
          isProfile ? "surface-profile" : ""
        }`}
      >
        {isProfile ? null : <VoidWash />}
        {showNav ? <TopNav /> : null}
        <div
          className={`relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden ${
            showTabs ? "pb-24 lg:pb-0" : "pb-0"
          }`}
        >
          <AuthRouteGuard>{children}</AuthRouteGuard>
        </div>
        {showTabs ? <BottomTabs /> : null}
      </div>
    </div>
  );
}

/** Inner scroll region for stack screens — document never grows. */
export function ScreenScroll({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      {children}
    </div>
  );
}

/** Shared content width on desktop; full bleed on phone. */
export function ContentWidth({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-content lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
