"use client";

import type { Palette } from "@antiq/types";
import Image from "next/image";
import { useEffect, useState } from "react";
import { isLocalMediaUrl } from "@/lib/read-local-image";
import { ArtPeek } from "./art-peek";
import { seedUnit } from "./initials";

type Props = {
  seed: string;
  palette: Palette;
  coverUrl?: string;
  alt: string;
  className?: string;
  /** Use className radius (e.g. rounded-surface) instead of organic blob. */
  square?: boolean;
};

/** Organic mask — unique per seed so covers don't feel like boxes. */
export function organicRadius(seed: string): string {
  const u = seedUnit(seed);
  const v = seedUnit(`${seed}-r`);
  const a = 28 + Math.round(u * 36);
  const b = 32 + Math.round(v * 34);
  const c = 40 + Math.round(((u + v) % 1) * 30);
  const d = 100 - a;
  const e = 100 - b;
  return `${a}% ${d}% ${b}% ${e}% / ${c}% ${a}% ${e}% ${b}%`;
}

/**
 * Artist-chosen cover — ArtPeek if missing URL or Image fails.
 * Local uploads (data:/blob:) use <img>; remote https uses next/image.
 */
export function CoverMedia({
  seed,
  palette,
  coverUrl,
  alt,
  className = "",
  square,
}: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [coverUrl]);
  const showImage = Boolean(coverUrl) && !failed;
  const local = isLocalMediaUrl(coverUrl);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={square ? undefined : { borderRadius: organicRadius(seed) }}
    >
      {showImage ? (
        local ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl!}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            onError={() => setFailed(true)}
          />
        ) : (
          <Image
            src={coverUrl!}
            alt={alt}
            fill
            sizes="(max-width: 430px) 100vw, 430px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <ArtPeek
          palette={palette}
          seed={seed}
          hero
          className="absolute inset-0"
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent"
        aria-hidden
      />
    </div>
  );
}
