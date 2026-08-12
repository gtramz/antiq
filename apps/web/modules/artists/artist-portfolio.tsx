"use client";

import type { Project } from "@antiq/types";
import { useMemo, useState } from "react";
import { ProjectCard } from "@/modules/discover/project-card";
import { ReleaseCard, type PastRelease } from "./release-card";

type PortfolioTab = "funding" | "discography";
type FormatFilter = "all" | "singles" | "eps" | "albums";

const TABS: { id: PortfolioTab; label: string }[] = [
  { id: "funding", label: "Active funding" },
  { id: "discography", label: "Discography" },
];

const FORMAT_PILLS: { id: FormatFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "singles", label: "Singles" },
  { id: "eps", label: "EPs" },
  { id: "albums", label: "Albums" },
];

function matchesFormat(format: string, filter: FormatFilter): boolean {
  if (filter === "all") return true;
  const f = format.toLowerCase();
  if (filter === "singles") return f.includes("single");
  if (filter === "eps") return f === "ep" || f.includes(" ep");
  if (filter === "albums") return f.includes("album");
  return true;
}

type Props = {
  artistId: string;
  artistName: string;
  projects: Project[];
  releases: PastRelease[];
  isEditing: boolean;
  onInvest?: (projectId: string) => void;
};

/**
 * Artist portfolio — Active Funding / Discography tabs + format swimlane.
 */
export function ArtistPortfolio({
  artistId,
  artistName,
  projects,
  releases,
  isEditing,
  onInvest,
}: Props) {
  const [tab, setTab] = useState<PortfolioTab>("funding");
  const [format, setFormat] = useState<FormatFilter>("all");

  const activeFunding = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.listedForFunding &&
          p.status === "open" &&
          matchesFormat(p.format, format),
      ),
    [projects, format],
  );

  const filteredReleases = useMemo(
    () => releases.filter((r) => matchesFormat(r.format, format)),
    [releases, format],
  );

  return (
    <section className="mt-8 lg:mt-10">
      {/* Tabs */}
      <div
        className="flex gap-6 border-b border-white/10"
        role="tablist"
        aria-label="Portfolio"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(t.id);
                setFormat("all");
              }}
              className={`voice relative pb-3 text-[11px] transition ${
                active ? "text-accent" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Format filters */}
      <div
        className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:-mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Format"
      >
        {FORMAT_PILLS.map((pill) => {
          const active = format === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => setFormat(pill.id)}
              className={`voice h-8 shrink-0 rounded-full border px-3.5 text-[10px] transition ${
                active
                  ? "border-white/20 bg-white/20 text-ink backdrop-blur-md"
                  : "border-white/10 bg-transparent text-muted hover:border-white/20 hover:text-ink"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="mt-5" role="tabpanel">
        {tab === "funding" ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
            {isEditing ? (
              <AddPlaceholder label="Add new project" />
            ) : null}
            {activeFunding.map((project) => (
              <ProjectCard
                key={project.id}
                variant="compact"
                project={project}
                artistId={artistId}
                artistName={artistName}
                showFundingBadge
                ctaLabel="Invest"
                onBack={
                  !isEditing && onInvest
                    ? () => onInvest(project.id)
                    : undefined
                }
              />
            ))}
            {!isEditing && activeFunding.length === 0 ? (
              <p className="col-span-full py-8 text-center text-[13px] text-muted">
                No active funding in this format
              </p>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {isEditing ? (
              <AddPlaceholder label="Add past release" />
            ) : null}
            {filteredReleases.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
            {!isEditing && filteredReleases.length === 0 ? (
              <p className="col-span-full py-8 text-center text-[13px] text-muted">
                No releases in this format
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function AddPlaceholder({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-center backdrop-blur-md transition hover:border-accent/40 hover:bg-white/10"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[20px] leading-none text-accent">
        +
      </span>
      <span className="voice text-[10px] text-muted">{label}</span>
    </button>
  );
}
