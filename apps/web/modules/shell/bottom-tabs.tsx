"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS: {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: ReactNode;
}[] = [
  {
    href: "/",
    label: "Explore",
    match: (p) => p === "/",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="h-6 w-6"
        aria-hidden
      >
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Search",
    match: (p) => p.startsWith("/search"),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="h-6 w-6"
        aria-hidden
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 20 20" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/pledges",
    label: "Pledges",
    match: (p) => p.startsWith("/pledges"),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="h-6 w-6"
        aria-hidden
      >
        <path
          d="M4 7.5h16v9H4z"
          strokeLinejoin="round"
        />
        <path d="M4 10h16M8 7.5v9" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <div className="glass-band glass-blur flex h-14 items-stretch overflow-hidden rounded-full">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              className={`flex flex-1 items-center justify-center transition-opacity ${
                active ? "text-accent opacity-100" : "text-muted opacity-70"
              }`}
            >
              {tab.icon}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
