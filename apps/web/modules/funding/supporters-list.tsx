"use client";

import type { Artist, Support } from "@antiq/types";
import Link from "next/link";
import { Avatar } from "@/modules/shell/avatar";

type Props = {
  supports: Support[];
  getArtist: (id: string) => Artist | undefined;
  emptyLabel?: string;
};

/**
 * Public list of artists who symbolically support a project or artist.
 */
export function SupportersList({
  supports,
  getArtist,
  emptyLabel = "No artist supports yet",
}: Props) {
  const count = supports.length;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="voice text-[11px] tracking-[0.12em] text-muted uppercase">
          Supported by artists
        </h3>
        <span className="voice text-[10px] tabular-nums text-tertiary">
          {count} {count === 1 ? "support" : "supports"}
        </span>
      </div>
      {count === 0 ? (
        <p className="mt-3 text-[13px] text-muted">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {supports.map((s) => {
            const a = getArtist(s.fromArtistId);
            if (!a) return null;
            return (
              <li key={s.id}>
                <Link
                  href={`/artist/${a.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 transition hover:border-white/20"
                >
                  <Avatar
                    name={a.name}
                    tint={a.palette.a}
                    src={a.avatarUrl}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
                    {a.name}
                  </span>
                  <span className="voice shrink-0 text-[9px] text-tertiary uppercase">
                    Supporting
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
