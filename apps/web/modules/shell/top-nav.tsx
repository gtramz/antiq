"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./ui";

const LINKS: {
  href: string;
  label: string;
  match: (p: string) => boolean;
}[] = [
  {
    href: "/",
    label: "Explore",
    match: (p) => p === "/",
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
];

/** Desktop chrome — same destinations as BottomTabs. */
export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="relative z-40 hidden shrink-0 border-b border-white/[0.06] lg:block">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between gap-8 px-8">
        <Link href="/" className="shrink-0" aria-label="antiq home">
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary">
          {LINKS.map((link) => {
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
          })}
        </nav>
      </div>
    </header>
  );
}
