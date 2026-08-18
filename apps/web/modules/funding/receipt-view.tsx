"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/modules/data/store";
import { ScreenScroll } from "@/modules/shell/app-shell";
import { formatMoney } from "@/modules/shell/tokens";
import { BrandMark, Eyebrow } from "@/modules/shell/ui";

export function ReceiptView() {
  const params = useSearchParams();
  const id = params.get("id");
  const { pledges, getProject, getArtist } = useStore();
  const pledge = pledges.find((p) => p.id === id);
  const artist = pledge ? getArtist(pledge.artistId) : undefined;
  const project =
    pledge?.kind === "project" && pledge.projectId
      ? getProject(pledge.projectId)
      : undefined;

  const title =
    pledge?.kind === "artist"
      ? artist?.name
      : project?.title;
  const subtitle =
    pledge?.kind === "artist"
      ? "Artist fund"
      : artist?.name;
  const continueHref =
    pledge?.kind === "artist"
      ? `/artist/${pledge.artistId}`
      : project
        ? `/project/${project.id}`
        : "/";

  return (
    <ScreenScroll>
      <div className="mx-auto w-full max-w-content px-5 pt-[max(20px,env(safe-area-inset-top))] pb-6 lg:max-w-lg lg:px-8 lg:pt-10 lg:pb-12">
        <header className="mb-10">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <Eyebrow>Pledge confirmed</Eyebrow>
        </header>

        <div className="glass-band animate-fade-in rounded-surface px-5 py-8">
          {pledge && title ? (
            <>
              <p className="voice text-[11px] text-muted">
                {pledge.kind === "artist"
                  ? "You funded the artist"
                  : "You funded the project"}
              </p>
              <h1 className="mt-2 font-display text-[32px] leading-tight text-ink">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-[14px] text-muted">{subtitle}</p>
              ) : null}
              <p className="mt-8 font-display text-[40px] text-accent">
                {formatMoney(pledge.amount)}
              </p>
              <p className="voice mt-2 text-[10px] text-tertiary">
                Pledge recorded
              </p>
            </>
          ) : (
            <p className="voice text-[12px] text-muted">Pledge not found</p>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <Link
            href="/profile"
            className="voice flex h-[52px] w-full items-center justify-center rounded-full bg-accent text-[13px] text-bg"
          >
            View my profile
          </Link>
          <Link
            href={continueHref}
            className="voice glass-band flex h-[52px] w-full items-center justify-center rounded-full text-[13px] text-ink text-veil"
          >
            {pledge?.kind === "artist" ? "Back to artist" : "Keep exploring"}
          </Link>
        </div>
      </div>
    </ScreenScroll>
  );
}
