"use client";

import type { ReactNode } from "react";
import { BottomTabs } from "./bottom-tabs";
import { TopNav } from "./top-nav";
import { VoidWash } from "./void-wash";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-dvh justify-center overflow-hidden bg-bg lg:block">
      <div className="relative flex h-dvh w-full max-w-phone flex-col overflow-hidden lg:max-w-none">
        <VoidWash />
        <TopNav />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden pb-24 lg:pb-0">
          {children}
        </div>
        <BottomTabs />
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
