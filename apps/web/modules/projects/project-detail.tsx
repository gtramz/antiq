"use client";

import {
  defaultOwnershipSplits,
  FundingBarSection,
  FundingPurposeTimelineSection,
  inputClass,
  OwnershipSplitsSection,
  PitchSection,
  type SplitDraft,
  validateSplits,
} from "@/modules/projects/project-sections";
import { fundingPercent } from "@antiq/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AudioPreview } from "@/modules/discover/audio-preview";
import { CoverMedia } from "@/modules/discover/cover-media";
import { categoryLabel } from "@/modules/discover/taxonomy";
import { useStore } from "@/modules/data/store";
import { FundSheet } from "@/modules/funding/fund-sheet";
import {
  projectCtaLabel,
  roleCtaAction,
} from "@/modules/funding/role-cta";
import { SupportSheet } from "@/modules/funding/support-sheet";
import { SupportersList } from "@/modules/funding/supporters-list";
import { ScreenScroll } from "@/modules/shell/app-shell";
import { formatMoney } from "@/modules/shell/tokens";
import { Eyebrow } from "@/modules/shell/ui";

type Draft = {
  title: string;
  pitch: string;
  goal: string;
  useOfFunds: string[];
  targetReleaseDate: string;
  ownershipSplits: SplitDraft[];
};

function toDraft(project: {
  title: string;
  pitch: string;
  goal: number;
  useOfFunds?: string[];
  targetReleaseDate?: string;
  ownershipSplits?: SplitDraft[];
}): Draft {
  return {
    title: project.title,
    pitch: project.pitch,
    goal: String(project.goal),
    useOfFunds: [...(project.useOfFunds ?? [])],
    targetReleaseDate: project.targetReleaseDate ?? "",
    ownershipSplits:
      project.ownershipSplits && project.ownershipSplits.length > 0
        ? project.ownershipSplits.map((s) => ({ ...s }))
        : defaultOwnershipSplits(),
  };
}

export function ProjectDetail({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const {
    getProject,
    getArtist,
    updateProject,
    getSupportsForProject,
  } = useStore();
  const [fundOpen, setFundOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const project = getProject(projectId);
  const artist = project ? getArtist(project.artistId) : undefined;
  const projectSupports = getSupportsForProject(projectId);

  const isOwner = Boolean(
    user && artist && artist.ownerUserId && artist.ownerUserId === user.id,
  );
  const ctaAction = roleCtaAction(user?.role);

  useEffect(() => {
    if (!isOwner && isEditing) {
      setIsEditing(false);
      setDraft(null);
      setError(null);
    }
  }, [isOwner, isEditing]);

  if (!project || !artist) {
    return (
      <ScreenScroll>
        <div className="mx-auto w-full max-w-content px-5 pt-16 lg:px-8">
          <p className="voice text-[12px] text-muted">Project not found</p>
          <Link href="/explore" className="voice mt-4 inline-block text-[12px] text-accent">
            Back to explore
          </Link>
        </div>
      </ScreenScroll>
    );
  }

  const pct = fundingPercent(project);
  const viewTitle = isEditing && draft ? draft.title : project.title;
  const viewPitch = isEditing && draft ? draft.pitch : project.pitch;
  const viewUseOfFunds =
    isEditing && draft ? draft.useOfFunds : (project.useOfFunds ?? []);
  const viewReleaseDate =
    isEditing && draft
      ? draft.targetReleaseDate || undefined
      : project.targetReleaseDate;
  const viewSplits =
    isEditing && draft
      ? draft.ownershipSplits
      : project.ownershipSplits?.length
        ? project.ownershipSplits
        : defaultOwnershipSplits();

  function startEdit() {
    setDraft(toDraft(project!));
    setError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraft(null);
    setError(null);
  }

  function saveEdit() {
    if (!draft || !project) return;
    const title = draft.title.trim();
    const pitch = draft.pitch.trim();
    const goal = Number.parseInt(draft.goal.replace(/[^\d]/g, ""), 10);

    if (!title) {
      setError("Add a project title");
      return;
    }
    if (!pitch) {
      setError("Add a pitch for the track");
      return;
    }
    if (!Number.isFinite(goal) || goal <= 0) {
      setError("Enter a valid funding goal");
      return;
    }
    const splitError = validateSplits(draft.ownershipSplits);
    if (splitError) {
      setError(splitError);
      return;
    }

    updateProject(project.id, {
      title,
      pitch,
      story: pitch,
      goal,
      useOfFunds: draft.useOfFunds,
      targetReleaseDate: draft.targetReleaseDate || undefined,
      ownershipSplits: draft.ownershipSplits,
    });
    setIsEditing(false);
    setDraft(null);
    setError(null);
  }

  const canEngage =
    project.listedForFunding && project.status === "open" && !isOwner;
  const fundLabel = !project.listedForFunding
    ? "Not listed for funding"
    : project.status !== "open"
      ? "Fully funded"
      : isOwner
        ? "Your project"
        : projectCtaLabel(ctaAction);

  function onPrimaryCta() {
    if (!canEngage) return;
    if (ctaAction === "login") {
      const next = encodeURIComponent(pathname || `/project/${projectId}`);
      router.push(`/login?next=${next}`);
      return;
    }
    if (ctaAction === "support") {
      setSupportOpen(true);
      return;
    }
    setFundOpen(true);
  }

  return (
    <>
      <ScreenScroll>
        <div className="mx-auto w-full max-w-content px-5 pt-[max(16px,env(safe-area-inset-top))] lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="relative w-full shrink-0">
            <div className="mb-3 flex items-center justify-between lg:mb-4">
              <Link
                href="/explore"
                className="voice glass-band rounded-full px-3 py-2 text-[10px] text-ink text-veil"
              >
                Back
              </Link>
              <div className="flex items-center gap-2">
                <Eyebrow>
                  {categoryLabel(project.category)} · {project.subcategory}
                  {" · "}
                  {project.format}
                </Eyebrow>
                {isOwner ? (
                  isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="voice rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] text-muted backdrop-blur-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="voice rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] text-ink backdrop-blur-md hover:border-white/20"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="voice rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] text-ink backdrop-blur-md hover:border-white/20"
                    >
                      Edit
                    </button>
                  )
                ) : null}
              </div>
            </div>
            <CoverMedia
              seed={project.seed}
              palette={project.palette}
              coverUrl={project.coverUrl}
              alt={viewTitle}
              className="h-[42vh] min-h-[220px] w-full lg:h-auto lg:min-h-0 lg:aspect-[4/5] lg:rounded-[24px]"
            />
            <div className="mt-4 lg:hidden">
              {isEditing && draft ? (
                <input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  className={`${inputClass} font-display text-[28px] leading-[1.1]`}
                />
              ) : (
                <h1 className="font-display text-[36px] leading-[1.05] text-ink">
                  {viewTitle}
                </h1>
              )}
              <Link
                href={`/artist/${artist.id}`}
                className="mt-2 inline-block text-[14px] font-medium text-accent"
              >
                {artist.name}
              </Link>
            </div>
          </div>

          <div className="space-y-8 pb-8 pt-5 lg:pb-0 lg:pt-12">
            <div className="hidden lg:block">
              {isEditing && draft ? (
                <input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  className={`${inputClass} font-display text-[36px] leading-[1.1] tracking-[-0.02em]`}
                />
              ) : (
                <h1 className="font-display text-[44px] leading-[1.05] tracking-[-0.02em] text-ink">
                  {viewTitle}
                </h1>
              )}
              <Link
                href={`/artist/${artist.id}`}
                className="mt-3 inline-block text-[16px] font-medium text-accent"
              >
                {artist.name}
              </Link>
            </div>

            {project.previewSeconds ? (
              <div>
                <AudioPreview
                  seed={project.seed}
                  durationSeconds={project.previewSeconds}
                  label={project.snippetLabel ?? "Preview"}
                />
              </div>
            ) : null}

            <PitchSection
              pitch={viewPitch}
              editing={isEditing}
              onChange={(v) => draft && setDraft({ ...draft, pitch: v })}
            />

            <FundingPurposeTimelineSection
              useOfFunds={viewUseOfFunds}
              targetReleaseDate={viewReleaseDate}
              editing={isEditing}
              onUseOfFundsChange={(tags) =>
                draft && setDraft({ ...draft, useOfFunds: tags })
              }
              onDateChange={(iso) =>
                draft && setDraft({ ...draft, targetReleaseDate: iso })
              }
            />

            <OwnershipSplitsSection
              splits={viewSplits}
              editing={isEditing}
              onChange={(next) =>
                draft && setDraft({ ...draft, ownershipSplits: next })
              }
            />

            <FundingBarSection
              raised={project.raised}
              goal={project.goal}
              pct={pct}
              editing={isEditing}
              goalInput={draft?.goal}
              onGoalChange={(v) => draft && setDraft({ ...draft, goal: v })}
              fundDisabled={!canEngage}
              fundLabel={fundLabel}
              onFund={isEditing || isOwner ? undefined : onPrimaryCta}
              formatMoney={formatMoney}
            />

            <SupportersList
              supports={projectSupports}
              getArtist={getArtist}
              emptyLabel="No artist supports yet — be the first signal"
            />

            {error ? (
              <p className="text-[13px] text-danger">{error}</p>
            ) : null}
          </div>
        </div>
      </ScreenScroll>

      <FundSheet
        mode="project"
        projectId={project.id}
        open={fundOpen}
        onClose={() => setFundOpen(false)}
      />
      <SupportSheet
        mode="project"
        projectId={project.id}
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </>
  );
}
