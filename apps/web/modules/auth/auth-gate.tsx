"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useIsMobileViewport } from "@/modules/shell/use-mobile-viewport";
import { pathForRole } from "./post-auth-redirect";

/** Always public (landing + auth forms). */
export const PUBLIC_AUTH_PATHS = new Set(["/", "/login", "/register"]);

/** Form-only auth paths (no app chrome). */
export const AUTH_FORM_PATHS = new Set(["/login", "/register"]);

/** Desktop-only guest browse (mobile still locked). */
function isDesktopPublicBrowse(pathname: string): boolean {
  if (pathname === "/explore" || pathname === "/search") return true;
  if (pathname.startsWith("/artist/")) return true;
  if (pathname.startsWith("/project/")) return true;
  return false;
}

function AuthSplash({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-[radial-gradient(120%_80%_at_50%_-10%,#142848_0%,#060D18_45%,#03060C_100%)]">
      <p className="voice text-[11px] text-muted">{label}</p>
    </div>
  );
}

/**
 * Dual gate:
 * - Mobile: locked except /, /login, /register
 * - Desktop: browse public; profile/pledges require auth
 */
export function AuthRouteGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobileViewport();

  const alwaysPublic = PUBLIC_AUTH_PATHS.has(pathname);
  const canAccess =
    isAuthenticated ||
    alwaysPublic ||
    (!isMobile && isDesktopPublicBrowse(pathname));

  useEffect(() => {
    if (isLoading) return;
    if (canAccess) return;

    if (isMobile) {
      router.replace("/");
      return;
    }
    const next = encodeURIComponent(pathname);
    router.replace(`/login?next=${next}`);
  }, [isLoading, canAccess, isMobile, pathname, router]);

  if (isLoading) {
    return <AuthSplash />;
  }

  if (!canAccess) {
    return <AuthSplash label="Redirecting…" />;
  }

  return <>{children}</>;
}

/** If already signed in, send the user to their role home (or ?next=). */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const next = params?.get("next");
    if (next && next.startsWith("/")) {
      router.replace(next);
      return;
    }
    router.replace(pathForRole(user.role));
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return <AuthSplash />;
  }

  if (isAuthenticated) {
    return <AuthSplash label="Redirecting…" />;
  }

  return <>{children}</>;
}
