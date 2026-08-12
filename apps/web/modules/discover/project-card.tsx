"use client";

import { fundingPercent, type Project } from "@antiq/types";
import Link from "next/link";
import { categoryLabel } from "@/modules/discover/taxonomy";
import { formatMoney } from "@/modules/shell/tokens";
import { AudioPreview } from "./audio-preview";
import { CoverMedia } from "./cover-media";

type Props = {
  project: Project;
  artistId: string;
  artistName: string;
  /** Opens FundSheet for this project. */
  onBack?: () => void;
  /** Show Funding badge when listed (e.g. artist profile). */
  showFundingBadge?: boolean;
  /** feed = investment hero; compact = denser investment card. */
  variant?: "feed" | "compact";
  /** CTA label when onBack is set (default: Back Project). */
  ctaLabel?: string;
};

/**
 * Investment card — hero dashboard for Explore; denser for Search / profile.
 */
export function ProjectCard({
  project,
  artistId,
  artistName,
  onBack,
  showFundingBadge,
  variant = "compact",
  ctaLabel = "Back Project",
}: Props) {
  const pct = fundingPercent(project);
  const remaining = Math.max(0, project.goal - project.raised);
  const isFeed = variant === "feed";
  const returnModel = project.returnModel ?? "Patron support";
  const canBack = project.listedForFunding && project.status === "open";
  const showAudio = Boolean(project.previewSeconds);

  return (
    <article
      className={
        isFeed
          ? "w-full overflow-hidden rounded-surface glass-band-strong"
          : "w-full overflow-hidden rounded-surface glass-band"
      }
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: isFeed ? "auto 640px" : "auto 420px",
      }}
    >
      <div
        className={
          isFeed
            ? "p-4 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-8 lg:p-6"
            : "p-3.5"
        }
      >
        <CoverMedia
          seed={project.seed}
          palette={project.palette}
          coverUrl={project.coverUrl}
          alt={project.title}
          className={
            isFeed
              ? "aspect-[4/5] w-full rounded-[20px] lg:aspect-[5/6] lg:h-full lg:max-h-[560px]"
              : "aspect-square w-full rounded-[16px]"
          }
          square
        />

        <div
          className={
            isFeed
              ? "mt-4 flex flex-col lg:mt-0 lg:min-h-0 lg:justify-center"
              : "mt-3"
          }
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2
                className={`truncate font-sans font-bold leading-tight text-ink ${
                  isFeed
                    ? "text-[22px] tracking-[-0.03em] lg:text-[32px]"
                    : "text-[17px]"
                }`}
              >
                {project.title}
              </h2>
              <Link
                href={`/artist/${artistId}`}
                className="mt-1 block truncate text-[13px] text-muted lg:text-[15px]"
              >
                {artistName}
              </Link>
              <p className="voice mt-1 truncate text-[10px] text-tertiary">
                {categoryLabel(project.category)} · {project.subcategory}
                {" · "}
                {project.format}
              </p>
            </div>
            {showFundingBadge && project.listedForFunding ? (
              <span className="voice shrink-0 text-[9px] text-accent">
                Funding
              </span>
            ) : null}
          </div>

          {showAudio ? (
            <div className={isFeed ? "mt-4" : "mt-3"}>
              <AudioPreview
                seed={project.seed}
                durationSeconds={project.previewSeconds ?? 45}
                label={project.snippetLabel ?? "Preview"}
              />
            </div>
          ) : null}

          <div
            className={`rounded-[20px] border border-white/[0.06] bg-black/35 ${
              isFeed ? "mt-5 px-4 py-4 lg:mt-6" : "mt-3.5 px-3 py-3"
            }`}
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="voice text-[9px] text-tertiary">Raised</p>
                <p
                  className={`font-sans font-bold tabular-nums text-ink ${
                    isFeed ? "text-[22px] lg:text-[28px]" : "text-[17px]"
                  }`}
                >
                  {formatMoney(project.raised)}
                </p>
              </div>
              <div className="text-right">
                <p className="voice text-[9px] text-tertiary">Goal</p>
                <p
                  className={`font-sans font-semibold tabular-nums text-muted ${
                    isFeed ? "text-[15px]" : "text-[13px]"
                  }`}
                >
                  {formatMoney(project.goal)}
                </p>
              </div>
            </div>

            <div
              className={`overflow-hidden rounded-full bg-white/10 ${
                isFeed ? "mt-3 h-2.5" : "mt-2.5 h-2"
              }`}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span
                className={`font-sans font-bold tabular-nums text-accent ${
                  isFeed ? "text-[18px]" : "text-[14px]"
                }`}
              >
                {pct}%
              </span>
              <span className="voice text-[9px] text-tertiary">
                {formatMoney(remaining)} remaining
              </span>
            </div>
          </div>

          {canBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={`voice w-full items-center justify-center rounded-full bg-accent text-bg ${
                isFeed
                  ? "mt-4 flex h-12 text-[13px] lg:mt-5 lg:max-w-[280px]"
                  : "mt-3 flex h-11 text-[12px]"
              }`}
            >
              {ctaLabel}
            </button>
          ) : (
            <Link
              href={`/project/${project.id}`}
              className={`voice w-full items-center justify-center rounded-full glass-band text-ink ${
                isFeed
                  ? "mt-4 flex h-12 text-[13px] lg:mt-5 lg:max-w-[280px]"
                  : "mt-3 flex h-11 text-[12px]"
              }`}
            >
              View project
            </Link>
          )}

          <p className="voice mt-2.5 text-center text-[9px] text-tertiary lg:text-left">
            Return model · {returnModel}
          </p>
        </div>
      </div>
    </article>
  );
}
