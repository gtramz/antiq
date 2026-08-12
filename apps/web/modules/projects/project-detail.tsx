"use client";

import { fundingPercent } from "@antiq/types";
import Link from "next/link";
import { useState } from "react";
import { AudioPreview } from "@/modules/discover/audio-preview";
import { CoverMedia } from "@/modules/discover/cover-media";
import { categoryLabel } from "@/modules/discover/taxonomy";
import { useStore } from "@/modules/data/store";
import { FundSheet } from "@/modules/funding/fund-sheet";
import { ScreenScroll } from "@/modules/shell/app-shell";
import { formatMoney } from "@/modules/shell/tokens";
import { Eyebrow, GlassButton } from "@/modules/shell/ui";

export function ProjectDetail({ projectId }: { projectId: string }) {
  const { getProject, getArtist } = useStore();
  const [fundOpen, setFundOpen] = useState(false);
  const project = getProject(projectId);
  const artist = project ? getArtist(project.artistId) : undefined;

  if (!project || !artist) {
    return (
      <ScreenScroll>
        <div className="mx-auto w-full max-w-content px-5 pt-16 lg:px-8">
          <p className="voice text-[12px] text-muted">Project not found</p>
          <Link href="/" className="voice mt-4 inline-block text-[12px] text-accent">
            Back to explore
          </Link>
        </div>
      </ScreenScroll>
    );
  }

  const pct = fundingPercent(project);

  return (
    <>
      <ScreenScroll>
        <div className="mx-auto w-full max-w-content px-5 pt-[max(16px,env(safe-area-inset-top))] lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="relative w-full shrink-0">
            <div className="mb-3 flex items-center justify-between lg:mb-4">
              <Link
                href="/"
                className="voice glass-band rounded-full px-3 py-2 text-[10px] text-ink text-veil"
              >
                Back
              </Link>
              <Eyebrow>
                {categoryLabel(project.category)} · {project.subcategory}
                {" · "}
                {project.format}
              </Eyebrow>
            </div>
            <CoverMedia
              seed={project.seed}
              palette={project.palette}
              coverUrl={project.coverUrl}
              alt={project.title}
              className="h-[42vh] min-h-[220px] w-full lg:h-auto lg:min-h-0 lg:aspect-[4/5] lg:rounded-[24px]"
            />
            <div className="mt-4 lg:hidden">
              <h1 className="font-display text-[36px] leading-[1.05] text-ink">
                {project.title}
              </h1>
              <Link
                href={`/artist/${artist.id}`}
                className="mt-2 inline-block text-[14px] font-medium text-accent"
              >
                {artist.name}
              </Link>
            </div>
          </div>

          <div className="pb-8 pt-5 lg:pb-0 lg:pt-12">
            <div className="hidden lg:block">
              <h1 className="font-display text-[44px] leading-[1.05] tracking-[-0.02em] text-ink">
                {project.title}
              </h1>
              <Link
                href={`/artist/${artist.id}`}
                className="mt-3 inline-block text-[16px] font-medium text-accent"
              >
                {artist.name}
              </Link>
            </div>

            {project.previewSeconds ? (
              <div className="mb-5 lg:mt-8">
                <AudioPreview
                  seed={project.seed}
                  durationSeconds={project.previewSeconds}
                  label={project.snippetLabel ?? "Preview"}
                />
              </div>
            ) : null}

            <p className="text-[15px] leading-relaxed text-ink/90 lg:mt-8">
              {project.pitch}
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              {project.story}
            </p>

            <div className="mt-8">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="voice text-[11px] text-muted">{pct}% funded</span>
                <span className="text-[12px] text-muted">
                  {formatMoney(project.raised)} / {formatMoney(project.goal)}
                </span>
              </div>
              <div className="h-[3px] w-full overflow-hidden bg-white/10">
                <div
                  className="h-full bg-accent transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="mt-8 lg:max-w-[320px]">
              <GlassButton
                strong
                disabled={
                  !project.listedForFunding || project.status !== "open"
                }
                onClick={() => setFundOpen(true)}
              >
                {!project.listedForFunding
                  ? "Not listed for funding"
                  : project.status === "open"
                    ? "Fund this project"
                    : "Fully funded"}
              </GlassButton>
            </div>
          </div>
        </div>
      </ScreenScroll>

      <FundSheet
        mode="project"
        projectId={project.id}
        open={fundOpen}
        onClose={() => setFundOpen(false)}
      />
    </>
  );
}
