"use client";

import { fundingPercent } from "@antiq/types";
import { useMemo, useState } from "react";
import { useStore } from "@/modules/data/store";
import { FundSheet } from "@/modules/funding/fund-sheet";
import { BrandMark } from "@/modules/shell/ui";
import { ProjectCard } from "./project-card";

export function DiscoverFeed() {
  const { projects, getArtist } = useStore();
  const [fundProjectId, setFundProjectId] = useState<string | null>(null);

  const { hero, more } = useMemo(() => {
    const listed = projects.filter(
      (p) => p.listedForFunding && p.status === "open",
    );
    if (listed.length === 0) return { hero: null, more: [] };

    const ranked = [...listed].sort((a, b) => {
      const pctDiff = fundingPercent(b) - fundingPercent(a);
      if (pctDiff !== 0) return pctDiff;
      return b.raised - a.raised;
    });

    return { hero: ranked[0], more: ranked.slice(1) };
  }, [projects]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-[max(12px,env(safe-area-inset-top))] lg:pt-6">
      <header className="shrink-0 px-5 pb-4 lg:hidden">
        <BrandMark />
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-content flex-1 flex-col overflow-y-auto overscroll-contain pb-6 [-webkit-overflow-scrolling:touch] lg:px-8 lg:pb-10">
        {hero ? (
          <section className="px-5 lg:px-0">
            <div className="mb-2 flex items-end justify-between gap-4">
              <p className="voice text-[10px] text-tertiary">Featured</p>
              <p className="hidden max-w-md text-right text-[13px] leading-snug text-muted lg:block">
                Fund artists. Explore projects.
              </p>
            </div>
            <ProjectCard
              variant="feed"
              project={hero}
              artistId={hero.artistId}
              artistName={getArtist(hero.artistId)?.name ?? "Artist"}
              onBack={() => setFundProjectId(hero.id)}
            />
          </section>
        ) : null}

        {more.length > 0 ? (
          <section className="mt-6 lg:mt-10">
            <p className="voice mb-2 px-5 text-[10px] text-tertiary lg:px-0">
              More
            </p>
            {/* Mobile: horizontal snap. Desktop: project grid. */}
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {more.map((project) => (
                <div
                  key={project.id}
                  className="w-[272px] shrink-0 snap-center lg:w-auto lg:shrink"
                >
                  <ProjectCard
                    variant="compact"
                    project={project}
                    artistId={project.artistId}
                    artistName={
                      getArtist(project.artistId)?.name ?? "Artist"
                    }
                    onBack={() => setFundProjectId(project.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!hero ? (
          <p className="px-5 py-10 text-center text-[13px] text-muted lg:px-0">
            No open funding yet
          </p>
        ) : null}
      </div>

      {fundProjectId ? (
        <FundSheet
          mode="project"
          projectId={fundProjectId}
          open
          onClose={() => setFundProjectId(null)}
        />
      ) : null}
    </div>
  );
}
