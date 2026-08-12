"use client";

import Link from "next/link";
import { useStore } from "@/modules/data/store";
import { ScreenScroll } from "@/modules/shell/app-shell";
import { formatMoney } from "@/modules/shell/tokens";
import { BrandMark, Eyebrow } from "@/modules/shell/ui";

export function PledgesList() {
  const { pledges, getProject, getArtist } = useStore();

  return (
    <ScreenScroll>
      <div className="mx-auto w-full max-w-content px-5 pt-[max(20px,env(safe-area-inset-top))] pb-6 lg:px-8 lg:pt-8 lg:pb-10">
        <header className="mb-8">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <h1 className="hidden font-sans text-[36px] font-bold tracking-[-0.03em] text-ink lg:block">
            Pledges
          </h1>
          <Eyebrow>Your pledges</Eyebrow>
        </header>

        {pledges.length === 0 ? (
          <div className="glass-band rounded-surface px-5 py-8 text-center lg:mx-auto lg:max-w-lg">
            <p className="voice text-[12px] text-muted">No pledges yet</p>
            <Link
              href="/"
              className="voice mt-4 inline-block text-[12px] text-accent"
            >
              Explore projects
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 lg:mx-auto lg:max-w-2xl">
            {pledges.map((pledge) => {
              const artist = getArtist(pledge.artistId);
              const project =
                pledge.kind === "project" && pledge.projectId
                  ? getProject(pledge.projectId)
                  : undefined;
              const href =
                pledge.kind === "artist"
                  ? `/artist/${pledge.artistId}`
                  : project
                    ? `/project/${project.id}`
                    : `/artist/${pledge.artistId}`;
              const title =
                pledge.kind === "artist"
                  ? artist?.name ?? "Artist"
                  : (project?.title ?? "Project");
              const subtitle =
                pledge.kind === "artist"
                  ? "Artist fund"
                  : (artist?.name ?? "Artist");

              return (
                <li key={pledge.id}>
                  <Link
                    href={href}
                    className="glass-band block rounded-full px-5 py-4 transition active:opacity-80 hover:border-accent/30"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-display text-[20px] text-ink">
                        {title}
                      </p>
                      <p className="voice shrink-0 text-[12px] text-accent">
                        {formatMoney(pledge.amount)}
                      </p>
                    </div>
                    <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
                    <p className="voice mt-3 text-[10px] text-tertiary">
                      {pledge.kind === "artist" ? "Artist · " : "Project · "}
                      {new Date(pledge.createdAt).toLocaleString("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ScreenScroll>
  );
}
