"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { BrandMark } from "@/modules/shell/ui";
import { pathForRole } from "./post-auth-redirect";

/**
 * App front page — logo + entry options (not the login form).
 */
export function WelcomeLanding() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    router.replace(pathForRole(user.role));
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[radial-gradient(120%_80%_at_50%_-8%,#1A3358_0%,#0A1528_42%,#03060C_100%)]">
        <p className="voice text-[11px] text-muted">
          {isAuthenticated ? "Redirecting…" : "Loading…"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[radial-gradient(120%_80%_at_50%_-8%,#1A3358_0%,#0A1528_42%,#03060C_100%)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] text-center lg:max-w-lg lg:px-8">
        <BrandMark className="scale-[1.35] lg:scale-[1.5]" />

        <p className="mt-10 max-w-xs text-[16px] leading-relaxed text-muted lg:mt-12 lg:max-w-sm lg:text-[17px]">
          Fund artists. Explore projects.
        </p>

        <div className="mt-12 flex w-full max-w-sm flex-col gap-3">
          <Link
            href="/login"
            className="voice flex h-12 items-center justify-center rounded-full bg-[#E8E0D0] text-[12px] font-semibold tracking-[0.06em] text-[#0A121C] transition hover:bg-[#F0EAE0]"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="voice flex h-12 items-center justify-center rounded-full border border-white/15 bg-black/25 text-[12px] font-semibold tracking-[0.06em] text-ink backdrop-blur-md transition hover:border-white/25 hover:bg-black/35"
          >
            Create account
          </Link>
        </div>

        <Link
          href="/explore"
          className="voice mt-8 hidden text-[11px] text-accent hover:underline lg:inline-block"
        >
          Explore as guest →
        </Link>
      </div>
    </div>
  );
}
