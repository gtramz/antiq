"use client";

import { fundingPercent, type Project } from "@antiq/types";
import Link from "next/link";
import { AudioPreview } from "@/modules/discover/audio-preview";
import { CoverMedia } from "@/modules/discover/cover-media";
import { formatMoney } from "@/modules/shell/tokens";

type Props = {
  project: Project;
  artistId: string;
  artistName: string;
  onInvest?: () => void;
  ctaLabel?: string;
};

/**
 * Full-width Active Funding card — cover, title, waveform, metrics, beige Invest.
 */
export function FundingListCard({
  project,
  artistId,
  artistName,
  onInvest,
  ctaLabel = "Invest",
}: Props) {
  const pct = fundingPercent(project);
  const remaining = Math.max(0, project.goal - project.raised);
  const returnModel = project.returnModel ?? "Patron support";
  const canInvest =
    project.listedForFunding &&
    project.status === "open" &&
    Boolean(onInvest);
  const displayTitle = project.format
    ? `${project.title} ${project.format}`
    : project.title;

  return (
    <article className="w-full overflow-hidden rounded-surface border border-white/10 bg-[rgba(8,18,36,0.72)] backdrop-blur-xl">
      <div className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-stretch lg:gap-7 lg:p-6">
        <CoverMedia
          seed={project.seed}
          palette={project.palette}
          coverUrl={project.coverUrl}
          alt={displayTitle}
          className="aspect-[4/3] w-full shrink-0 rounded-[20px] sm:aspect-[16/11] lg:aspect-[5/6] lg:w-[240px] lg:max-h-none xl:w-[280px]"
          square
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="font-sans text-[22px] font-bold leading-tight tracking-[-0.03em] text-ink sm:text-[26px] lg:text-[28px]">
            {displayTitle}
          </h3>
          <Link
            href={`/artist/${artistId}`}
            className="mt-1.5 block text-[14px] text-muted hover:text-ink"
          >
            {artistName}
          </Link>

          {project.previewSeconds ? (
            <div className="mt-4">
              <AudioPreview
                seed={project.seed}
                durationSeconds={project.previewSeconds}
                label={project.snippetLabel ?? "Preview"}
              />
            </div>
          ) : null}

          {/* Funding metrics — neat organized strip */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/10 py-4 sm:grid-cols-4 sm:gap-2">
            <Metric label="Raised" value={formatMoney(project.raised)} strong />
            <Metric label="Goal" value={formatMoney(project.goal)} />
            <Metric label="% Funded" value={`${pct}%`} accent />
            <Metric
              label="Remaining"
              value={formatMoney(remaining)}
              muted
            />
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {canInvest ? (
            <button
              type="button"
              onClick={onInvest}
              className="voice mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[#E8E0D0] text-[13px] font-semibold tracking-[0.06em] text-[#0A121C] transition hover:bg-[#F0EAE0] sm:max-w-[220px]"
            >
              {ctaLabel}
            </button>
          ) : (
            <Link
              href={`/project/${project.id}`}
              className="voice mt-5 flex h-12 w-full items-center justify-center rounded-full border border-white/15 bg-white/5 text-[12px] text-ink transition hover:bg-white/10 sm:max-w-[220px]"
            >
              View project
            </Link>
          )}

          <p className="voice mt-2.5 text-[10px] text-tertiary">
            Return model · {returnModel}
          </p>
        </div>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  strong,
  accent,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p
        className={`voice text-[9px] tracking-[0.08em] uppercase ${
          accent ? "text-accent" : "text-tertiary"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 font-sans tabular-nums ${
          accent
            ? "text-[18px] font-bold text-accent sm:text-[20px]"
            : strong
              ? "text-[18px] font-bold text-ink sm:text-[20px]"
              : muted
                ? "text-[15px] font-semibold text-muted"
                : "text-[15px] font-semibold text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
