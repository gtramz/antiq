"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `lg` (1024px) — phone shell below this. */
const MOBILE_MQ = "(max-width: 1023px)";

export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}
