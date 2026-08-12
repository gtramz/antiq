"use client";

import type { Palette } from "@antiq/types";
import { CoverMedia } from "@/modules/discover/cover-media";

export type PastRelease = {
  id: string;
  artistId: string;
  title: string;
  format: string;
  year: number;
  seed: string;
  palette: Palette;
  coverUrl?: string;
};

type Props = {
  release: PastRelease;
};

/** Past work tile — cover, year, title, format. No funding metrics. */
export function ReleaseCard({ release }: Props) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md">
      <div className="relative aspect-square w-full overflow-hidden">
        <CoverMedia
          seed={release.seed}
          palette={release.palette}
          coverUrl={release.coverUrl}
          alt={release.title}
          className="h-full w-full rounded-none"
          square
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/35">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-ink opacity-70 backdrop-blur-md transition group-hover:opacity-100">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-0.5 h-4 w-4"
              aria-hidden
            >
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
            <span className="sr-only">Play</span>
          </span>
        </div>
      </div>
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="voice text-[9px] text-tertiary">{release.year}</p>
          <span className="voice rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-muted">
            {release.format}
          </span>
        </div>
        <p className="mt-1 truncate text-[13px] font-semibold leading-tight text-ink">
          {release.title}
        </p>
      </div>
    </article>
  );
}
