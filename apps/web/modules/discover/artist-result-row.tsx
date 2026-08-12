"use client";

import type { Artist } from "@antiq/types";
import Link from "next/link";
import { categoryLabel } from "@/modules/discover/taxonomy";
import { Avatar } from "@/modules/shell/avatar";

type Props = {
  artist: Artist;
};

export function ArtistResultRow({ artist }: Props) {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-3 py-2.5 backdrop-blur-md transition hover:border-white/20 hover:bg-white/5 active:opacity-80"
    >
      <Avatar
        name={artist.name}
        tint={artist.palette.a}
        src={artist.avatarUrl}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ink">
          {artist.name}
        </p>
        <p className="voice mt-0.5 truncate text-[10px] text-muted">
          {categoryLabel(artist.role)}
        </p>
      </div>
      <span className="voice shrink-0 text-[10px] text-accent">Profile →</span>
    </Link>
  );
}
