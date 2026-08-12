"use client";

import { fundingPercent, type Project } from "@antiq/types";
import Link from "next/link";
import { CoverMedia } from "./cover-media";

type Props = {
  project: Project;
  artistName: string;
};

/** Compact discovery tile — cover, artist, title, slim funding bar. */
export function SearchMiniCard({ project, artistName }: Props) {
  const pct = fundingPercent(project);

  return (
    <Link
      href={`/project/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md transition hover:border-white/20 hover:bg-white/5"
    >
      <CoverMedia
        seed={project.seed}
        palette={project.palette}
        coverUrl={project.coverUrl}
        alt={project.title}
        className="aspect-square w-full rounded-none"
        square
      />
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <p className="truncate text-[11px] text-muted">{artistName}</p>
        <p className="truncate text-[13px] font-semibold leading-tight text-ink">
          {project.title}
        </p>
        <div className="mt-auto pt-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent/90 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="voice mt-1 text-[9px] tabular-nums text-tertiary">
            {pct}%
          </p>
        </div>
      </div>
    </Link>
  );
}
