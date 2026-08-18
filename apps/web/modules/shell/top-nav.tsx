"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BrandMark } from "./ui";

const LINKS: {
  href: string;
  label: string;
  match: (p: string) => boolean;
  authOnly?: boolean;
}[] = [
  {
    href: "/explore",
    label: "Explore",
    match: (p) => p === "/explore" || p === "/",
  },
  {
    href: "/search",
    label: "Search",
    match: (p) => p.startsWith("/search"),
  },
  {
    href: "/pledges",
    label: "Pledges",
    match: (p) => p.startsWith("/pledges"),
  },
  {
    href: "/profile",
    label: "Profile",
    match: (p) => p.startsWith("/profile"),
    authOnly: true,
  },
];

/** Desktop chrome — same destinations as BottomTabs. */
export function TopNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="relative z-40 hidden shrink-0 border-b border-white/[0.06] lg:block">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between gap-8 px-8">
        <Link href="/explore" className="shrink-0" aria-label="antiq home">
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary">
          {LINKS.filter((link) => !link.authOnly || isAuthenticated).map(
            (link) => {
              const active = link.match(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`voice rounded-full px-4 py-2 text-[11px] transition ${
                    active
                      ? "glass-band-strong text-accent"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            },
          )}
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <span className="voice hidden truncate text-[10px] text-muted xl:inline">
              {user.name}
            </span>
          ) : (
            <>
              <Link
                href="/login"
                className="voice rounded-full px-4 py-2 text-[11px] text-muted hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="voice rounded-full bg-[#E8E0D0] px-4 py-2 text-[11px] font-semibold tracking-[0.06em] text-[#0A121C]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
