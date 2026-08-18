"use client";

import { fundingPercent } from "@antiq/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/modules/data/store";
import { FundSheet } from "@/modules/funding/fund-sheet";
import {
  projectCardCtaLabel,
  roleCtaAction,
} from "@/modules/funding/role-cta";
import { SupportSheet } from "@/modules/funding/support-sheet";
import { BrandMark } from "@/modules/shell/ui";
import { ProjectCard } from "./project-card";

export function DiscoverFeed() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { projects, artists, getArtist, projectSupportCount } = useStore();
  const [fundProjectId, setFundProjectId] = useState<string | null>(null);
  const [supportProjectId, setSupportProjectId] = useState<string | null>(
    null,
  );

  const ctaAction = roleCtaAction(user?.role);
  const ctaLabel = projectCardCtaLabel(ctaAction);

  const { hero, more } = useMemo(() => {
    const listed = projects.filter(
      (p) => p.listedForFunding && p.status === "open",
    );
    if (listed.length === 0) return { hero: null, more: [] };

    const ranked = [...listed].sort((a, b) => {
      const supportDiff =
        projectSupportCount(b.id) - projectSupportCount(a.id);
      if (supportDiff !== 0) return supportDiff;
      const pctDiff = fundingPercent(b) - fundingPercent(a);
      if (pctDiff !== 0) return pctDiff;
      return b.raised - a.raised;
    });

    return { hero: ranked[0], more: ranked.slice(1) };
  }, [projects, projectSupportCount]);

  function onCardCta(projectId: string) {
    if (ctaAction === "login") {
      const next = encodeURIComponent(pathname || "/explore");
      router.push(`/login?next=${next}`);
      return;
    }
    if (ctaAction === "support") {
      setSupportProjectId(projectId);
      return;
    }
    setFundProjectId(projectId);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-[max(12px,env(safe-area-inset-top))] lg:pt-6">
      <header className="shrink-0 px-5 pb-4 lg:hidden">
        <BrandMark />
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-content flex-1 flex-col overflow-y-auto overscroll-contain pb-6 [-webkit-overflow-scrolling:touch] lg:px-8 lg:pb-10">
        {hero ? (
          <section className="px-5 lg:px-0">
            <div className="mb-2 flex items-end justify-between gap-4">
              <div>
                <p className="voice text-[10px] text-tertiary">Featured</p>
                <p className="voice mt-0.5 text-[9px] text-tertiary/80">
                  Trending by artist support
                </p>
              </div>
              <p className="hidden max-w-md text-right text-[13px] leading-snug text-muted lg:block">
                Artists support. Investors fund.
              </p>
            </div>
            <ProjectCard
              variant="feed"
              project={hero}
              artistId={hero.artistId}
              artistName={getArtist(hero.artistId)?.name ?? "Artist"}
              supportCount={projectSupportCount(hero.id)}
              onBack={() => onCardCta(hero.id)}
              ctaLabel={ctaLabel}
            />
          </section>
        ) : null}

        {more.length > 0 ? (
          <section className="mt-6 lg:mt-10">
            <p className="voice mb-2 px-5 text-[10px] text-tertiary lg:px-0">
              More
            </p>
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
                    supportCount={projectSupportCount(project.id)}
                    onBack={() => onCardCta(project.id)}
                    ctaLabel={ctaLabel}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!hero ? <EmptyCatalog hasArtists={artists.length > 0} /> : null}
      </div>

      {fundProjectId ? (
        <FundSheet
          mode="project"
          projectId={fundProjectId}
          open
          onClose={() => setFundProjectId(null)}
        />
      ) : null}
      {supportProjectId ? (
        <SupportSheet
          mode="project"
          projectId={supportProjectId}
          open
          onClose={() => setSupportProjectId(null)}
        />
      ) : null}
    </div>
  );
}

function EmptyCatalog({ hasArtists }: { hasArtists: boolean }) {
  const { user } = useAuth();
  const isArtist = user?.role === "artist";

  return (
    <section className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center lg:px-0">
      <p className="voice text-[11px] tracking-[0.14em] text-tertiary uppercase">
        Discover
      </p>
      <h2 className="mt-3 font-sans text-[26px] font-bold tracking-[-0.03em] text-ink">
        {hasArtists ? "No open funding yet" : "Your catalog is empty"}
      </h2>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
        {isArtist
          ? "Add a project from your profile to list it for funding."
          : hasArtists
            ? "Projects listed for funding will show up here."
            : "Create an artist account to list your first project for funding."}
      </p>
      {isArtist ? (
        <Link
          href="/profile"
          className="voice mt-6 flex h-12 items-center justify-center rounded-full bg-[#E8E0D0] px-8 text-[12px] font-semibold tracking-[0.06em] text-[#0A121C]"
        >
          Add a project
        </Link>
      ) : (
        <Link
          href="/register"
          className="voice mt-6 flex h-12 items-center justify-center rounded-full bg-[#E8E0D0] px-8 text-[12px] font-semibold tracking-[0.06em] text-[#0A121C]"
        >
          Create account
        </Link>
      )}
    </section>
  );
}
