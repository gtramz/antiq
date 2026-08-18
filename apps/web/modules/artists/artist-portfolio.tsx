"use client";

import type { Artist, CategoryId, Pledge, Project } from "@antiq/types";
import { useMemo, useState } from "react";
import { AddProjectSheet } from "./add-project-sheet";
import { ArtistAnalyticsPanel } from "./artist-analytics-panel";
import { FundingListCard } from "./funding-list-card";
import { SpotifyDiscography } from "./spotify-discography";

type PortfolioTab = "funding" | "discography" | "analytics";
type FormatFilter = "all" | "singles" | "eps" | "albums";

const TABS: { id: PortfolioTab; label: string }[] = [
  { id: "funding", label: "Active Funding" },
  { id: "discography", label: "Discography" },
  { id: "analytics", label: "Analytics" },
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
  artist: Artist;
  artistId: string;
  artistName: string;
  artistRole: CategoryId;
  artistPalette: Project["palette"];
  projects: Project[];
  pledges: Pledge[];
  artistSupports: number;
  projectSupports: number;
  isEditing: boolean;
  /** Owner can always open Add project (not only while profile is in Edit). */
  isOwner?: boolean;
  onInvest?: (projectId: string) => void;
  investCtaLabel?: string;
};

/**
 * Portfolio under profile header — tabs, format filters, full-width funding cards.
 */
export function ArtistPortfolio({
  artist,
  artistId,
  artistName,
  artistRole,
  artistPalette,
  projects,
  pledges,
  artistSupports,
  projectSupports,
  isEditing,
  isOwner = false,
  onInvest,
  investCtaLabel = "Invest",
}: Props) {
  const [tab, setTab] = useState<PortfolioTab>("funding");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const defaultGenre = useMemo(() => {
    const listed = projects.find((p) => p.listedForFunding);
    return listed?.subcategory ?? projects[0]?.subcategory ?? "Electronic";
  }, [projects]);

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

  const showFormatPills = tab === "funding" || tab === "discography";

  return (
    <section className="mt-8 lg:mt-10">
      <div
        className="flex gap-6 overflow-x-auto border-b border-white/10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              className={`voice relative shrink-0 pb-3 text-[11px] tracking-[0.12em] uppercase transition ${
                active ? "text-ink" : "text-muted hover:text-ink"
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

      {showFormatPills ? (
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
                className={`voice h-8 shrink-0 rounded-full border px-3.5 text-[10px] tracking-[0.08em] uppercase transition ${
                  active
                    ? "border-white/25 bg-white/15 text-ink backdrop-blur-md"
                    : "border-white/10 bg-transparent text-muted hover:border-white/20 hover:text-ink"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6" role="tabpanel">
        {tab === "funding" ? (
          <div className="flex flex-col gap-5">
            {isOwner ? (
              <AddPlaceholder
                label="Add new project"
                onClick={() => setAddOpen(true)}
              />
            ) : null}
            {activeFunding.map((project) => (
              <FundingListCard
                key={project.id}
                project={project}
                artistId={artistId}
                artistName={artistName}
                ctaLabel={investCtaLabel}
                onInvest={
                  !isEditing && !isOwner && onInvest
                    ? () => onInvest(project.id)
                    : undefined
                }
              />
            ))}
            {!isOwner && activeFunding.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-muted">
                No active funding in this format
              </p>
            ) : null}
          </div>
        ) : null}

        {tab === "discography" ? (
          <SpotifyDiscography
            artistId={artistId}
            spotifyUrl={artist.socials.spotify}
            palette={artistPalette}
            format={format}
          />
        ) : null}

        {tab === "analytics" ? (
          <ArtistAnalyticsPanel
            artist={artist}
            projects={projects}
            pledges={pledges}
            artistSupports={artistSupports}
            projectSupports={projectSupports}
          />
        ) : null}
      </div>

      <AddProjectSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        artistId={artistId}
        artistRole={artistRole}
        defaultGenre={defaultGenre}
        palette={artistPalette}
      />
    </section>
  );
}

function AddPlaceholder({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-surface border border-dashed border-white/20 bg-white/5 p-6 text-center backdrop-blur-md transition hover:border-accent/40 hover:bg-white/10"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[20px] leading-none text-accent">
        +
      </span>
      <span className="voice text-[10px] text-muted">{label}</span>
    </button>
  );
}
