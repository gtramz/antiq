"use client";

import { artistFundingPercent, type CategoryId } from "@antiq/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { readLocalImage } from "@/lib/read-local-image";
import { useStore } from "@/modules/data/store";
import { ArtPeek } from "@/modules/discover/art-peek";
import {
  CATEGORY_IDS,
  categoryLabel,
} from "@/modules/discover/taxonomy";
import { FundSheet } from "@/modules/funding/fund-sheet";
import {
  artistCtaLabel,
  investCardCtaLabel,
  roleCtaAction,
} from "@/modules/funding/role-cta";
import { SupportSheet } from "@/modules/funding/support-sheet";
import { SupportersList } from "@/modules/funding/supporters-list";
import { Avatar } from "@/modules/shell/avatar";
import { formatMoney } from "@/modules/shell/tokens";
import { ArtistPortfolio } from "./artist-portfolio";
import { ConnectSection } from "./connect-section";
import { normalizeInstagramProfileUrl } from "./instagram-preview";
import { normalizeSpotifyArtistUrl } from "./spotify-preview";

type Draft = {
  name: string;
  bio: string;
  role: CategoryId;
  specialty: string;
  instagram: string;
  x: string;
  spotify: string;
  website: string;
  artistGoal: string;
  avatarUrl?: string;
  bannerUrl?: string;
};

function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden
    >
      <path
        d="M4.5 8.5h2.2l1.3-2h8l1.3 2H19.5A1.5 1.5 0 0 1 21 10v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V10a1.5 1.5 0 0 1 1.5-1.5Z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14" r="3.25" />
    </svg>
  );
}

export function ArtistProfile({ artistId }: { artistId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const {
    getArtist,
    projectsByArtist,
    updateArtist,
    getSupportsForArtist,
    getSupportsForProject,
    pledges,
  } = useStore();
  const artist = getArtist(artistId);
  const projects = projectsByArtist(artistId);
  const artistSupports = getSupportsForArtist(artistId);
  const projectSupports = useMemo(
    () =>
      projects.reduce(
        (sum, p) => sum + getSupportsForProject(p.id).length,
        0,
      ),
    [projects, getSupportsForProject],
  );
  const relevantPledges = useMemo(() => {
    const projectIds = new Set(projects.map((p) => p.id));
    return pledges.filter(
      (pl) =>
        (pl.kind === "artist" && pl.artistId === artistId) ||
        (pl.kind === "project" &&
          pl.projectId != null &&
          projectIds.has(pl.projectId)),
    );
  }, [pledges, projects, artistId]);
  const isOwner =
    Boolean(user && artist?.ownerUserId && user.id === artist.ownerUserId);
  const ctaAction = roleCtaAction(user?.role);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [fundProjectId, setFundProjectId] = useState<string | null>(null);
  const [supportProjectId, setSupportProjectId] = useState<string | null>(
    null,
  );
  const [bannerFailed, setBannerFailed] = useState(false);

  function onArtistCta() {
    if (isOwner) return;
    if (ctaAction === "login") {
      const next = encodeURIComponent(pathname || `/artist/${artistId}`);
      router.push(`/login?next=${next}`);
      return;
    }
    if (ctaAction === "support") {
      setSupportOpen(true);
      return;
    }
    setFundOpen(true);
  }

  function onProjectCta(projectId: string) {
    if (isOwner) return;
    if (ctaAction === "login") {
      const next = encodeURIComponent(pathname || `/artist/${artistId}`);
      router.push(`/login?next=${next}`);
      return;
    }
    if (ctaAction === "support") {
      setSupportProjectId(projectId);
      return;
    }
    setFundProjectId(projectId);
  }

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBannerFailed(false);
    setIsEditing(false);
    setDraft(null);
  }, [artistId]);

  useEffect(() => {
    if (!isOwner && isEditing) {
      setIsEditing(false);
      setDraft(null);
    }
  }, [isOwner, isEditing]);

  const specialtyHint = useMemo(() => {
    if (artist?.role === "composer") return "Producer";
    if (artist?.role === "producer") return "Writer";
    if (artist?.role === "songwriter") return "Performer";
    const listed = projects.find((p) => p.listedForFunding);
    return listed?.subcategory ?? projects[0]?.subcategory ?? "";
  }, [artist?.role, projects]);

  if (!artist) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-content flex-1 flex-col overflow-hidden px-5 pt-16 lg:px-8">
        <p className="voice text-[12px] text-muted">Artist not found</p>
        <Link
          href="/explore"
          className="voice mt-4 inline-block text-[12px] text-accent"
        >
          Back to explore
        </Link>
      </div>
    );
  }

  const heroSeed = projects[0]?.seed ?? artist.id;
  const heroPalette = projects[0]?.palette ?? artist.palette;

  const viewName = isEditing && draft ? draft.name : artist.name;
  const viewBio = isEditing && draft ? draft.bio : artist.bio;
  const viewRole = isEditing && draft ? draft.role : artist.role;
  const viewSpecialty =
    isEditing && draft ? draft.specialty : specialtyHint;
  const viewAvatar =
    isEditing && draft?.avatarUrl !== undefined
      ? draft.avatarUrl
      : artist.avatarUrl;
  const viewBanner =
    isEditing && draft?.bannerUrl !== undefined
      ? draft.bannerUrl
      : artist.bannerUrl;
  const viewSpotify =
    isEditing && draft ? draft.spotify.trim() : artist.socials.spotify ?? "";
  const viewInstagram =
    isEditing && draft
      ? draft.instagram.trim()
      : artist.socials.instagram ?? "";
  const viewGoal =
    isEditing && draft
      ? Number.parseInt(draft.artistGoal, 10) || 0
      : artist.artistGoal;

  const artistPct = artistFundingPercent({
    artistGoal: viewGoal,
    artistRaised: artist.artistRaised,
  });

  const showBanner = Boolean(viewBanner) && !bannerFailed;
  const roleLine = viewSpecialty
    ? `${categoryLabel(viewRole)} | ${viewSpecialty}`
    : categoryLabel(viewRole);

  function startEditing() {
    setDraft({
      name: artist!.name,
      bio: artist!.bio,
      role: artist!.role,
      specialty: specialtyHint || "Producer",
      instagram: artist!.socials.instagram ?? "",
      x: artist!.socials.x ?? "",
      spotify: artist!.socials.spotify ?? "",
      website: artist!.socials.website ?? "",
      artistGoal: String(artist!.artistGoal),
      avatarUrl: artist!.avatarUrl,
      bannerUrl: artist!.bannerUrl,
    });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(null);
    setBannerFailed(false);
  }

  function saveEditing() {
    if (!draft) return;
    const goal = Number.parseInt(draft.artistGoal.replace(/[^\d]/g, ""), 10);
    const spotify = normalizeSpotifyArtistUrl(draft.spotify);
    const instagram = draft.instagram.trim()
      ? normalizeInstagramProfileUrl(draft.instagram)
      : undefined;
    updateArtist(artist!.id, {
      name: draft.name.trim() || artist!.name,
      bio: draft.bio.trim(),
      role: draft.role,
      avatarUrl: draft.avatarUrl,
      bannerUrl: draft.bannerUrl,
      artistGoal:
        Number.isFinite(goal) && goal >= 0 ? goal : artist!.artistGoal,
      socials: {
        instagram,
        x: draft.x.trim() || undefined,
        spotify,
        website: draft.website.trim() || undefined,
      },
    });
    setIsEditing(false);
    setDraft(null);
  }

  async function onPickBanner(file: File | undefined) {
    const dataUrl = await readLocalImage(file);
    if (!dataUrl || !draft) return;
    setBannerFailed(false);
    setDraft({ ...draft, bannerUrl: dataUrl });
  }

  async function onPickAvatar(file: File | undefined) {
    const dataUrl = await readLocalImage(file);
    if (!dataUrl || !draft) return;
    setDraft({ ...draft, avatarUrl: dataUrl });
  }

  const viewWebsite =
    isEditing && draft
      ? draft.website.trim()
      : artist.socials.website ?? "";

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_50%_-10%,#142848_0%,#060D18_45%,#03060C_100%)]">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-8 pt-[max(12px,env(safe-area-inset-top))] [-webkit-overflow-scrolling:touch] lg:px-8 lg:pb-12 lg:pt-6">
          <div className="mx-auto w-full max-w-content lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
            {/* Profile header card */}
            <article className="rounded-surface border border-white/10 bg-[rgba(8,18,36,0.55)] backdrop-blur-xl">
              {/* Cover — top of the same card (rounded top only so avatar can overlap seam) */}
              <div
                className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[32px]"
                style={{ backgroundColor: heroPalette.a || "#0B1C33" }}
              >
                <ArtPeek
                  palette={heroPalette}
                  seed={heroSeed}
                  hero
                  className="absolute inset-0"
                />
                {showBanner ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewBanner!}
                    alt=""
                    className="absolute inset-0 z-[1] h-full w-full object-cover"
                    onError={() => setBannerFailed(true)}
                  />
                ) : null}

                <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3">
                  <Link
                    href="/explore"
                    className="voice rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] text-ink backdrop-blur-md"
                  >
                    ← Back
                  </Link>

                  {isOwner ? (
                    isEditing ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="voice rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] text-muted backdrop-blur-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveEditing}
                          className="voice rounded-full border border-accent/40 bg-accent px-3 py-1.5 text-[10px] text-bg"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startEditing}
                        className="voice rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] text-ink backdrop-blur-md hover:border-white/20"
                      >
                        Edit page
                      </button>
                    )
                  ) : null}
                </div>

                {isEditing ? (
                  <>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        void onPickBanner(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 transition hover:bg-black/40"
                      aria-label="Change cover image"
                    >
                      <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-ink backdrop-blur-md">
                        <CameraIcon className="h-4 w-4" />
                        <span className="voice text-[10px]">Change cover</span>
                      </span>
                    </button>
                  </>
                ) : null}
              </div>

              {/* Card body — same glass surface behind avatar */}
              <div className="px-4 pb-5 pt-0 sm:px-5">
                <div className="relative z-10 -mt-11 w-fit lg:-mt-12">
                  <Avatar
                    name={viewName}
                    tint={artist.palette.a}
                    src={viewAvatar}
                    size="lg"
                    className="shadow-[0_8px_28px_rgba(0,0,0,0.55)] ring-[3px] ring-[rgba(8,14,24,0.95)]"
                  />
                  {isEditing ? (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          void onPickAvatar(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-[2px] transition hover:bg-black/55"
                        aria-label="Change profile photo"
                      >
                        <CameraIcon className="h-5 w-5 text-ink" />
                      </button>
                    </>
                  ) : null}
                </div>

                {isEditing && draft ? (
                  <div className="mt-3 space-y-3">
                    <input
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      placeholder="Artist name"
                      className="w-full border-0 border-b border-white/15 bg-transparent pb-2 font-sans text-[30px] font-bold leading-none tracking-[-0.03em] text-ink outline-none placeholder:text-tertiary lg:text-[40px]"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={draft.role}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            role: e.target.value as CategoryId,
                          })
                        }
                        className="voice rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-accent outline-none"
                      >
                        {CATEGORY_IDS.map((id) => (
                          <option key={id} value={id} className="bg-surface">
                            {categoryLabel(id)}
                          </option>
                        ))}
                      </select>
                      <span className="text-tertiary">|</span>
                      <input
                        value={draft.specialty}
                        onChange={(e) =>
                          setDraft({ ...draft, specialty: e.target.value })
                        }
                        placeholder="Second role"
                        className="voice min-w-[8rem] flex-1 border-0 border-b border-white/10 bg-transparent py-1 text-[10px] text-accent outline-none placeholder:text-tertiary"
                      />
                    </div>
                    <textarea
                      value={draft.bio}
                      onChange={(e) =>
                        setDraft({ ...draft, bio: e.target.value })
                      }
                      rows={3}
                      placeholder="Short bio"
                      className="w-full resize-none border-0 border-b border-white/10 bg-transparent py-2 text-[14px] leading-relaxed text-muted outline-none placeholder:text-tertiary"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="mt-3 font-sans text-[32px] font-bold leading-none tracking-[-0.03em] text-ink lg:text-[40px]">
                      {viewName}
                    </h1>
                    <p className="voice mt-2 text-[11px] tracking-[0.06em] text-accent">
                      {roleLine}
                    </p>
                    <p className="mt-3 text-[14px] leading-relaxed text-muted">
                      {viewBio}
                    </p>
                  </>
                )}
              </div>
            </article>

            {/* Fund — sidebar on desktop, below card on mobile */}
            <div className="mt-4 space-y-4 lg:sticky lg:top-6 lg:mt-0">
              <ArtistFundCard
                raised={artist.artistRaised}
                goal={viewGoal}
                pct={artistPct}
                isEditing={isEditing}
                isOwner={isOwner}
                ctaLabel={artistCtaLabel(ctaAction)}
                goalInput={draft?.artistGoal ?? String(artist.artistGoal)}
                onGoalChange={(v) =>
                  draft && setDraft({ ...draft, artistGoal: v })
                }
                onCta={onArtistCta}
              />
              <SupportersList
                supports={artistSupports}
                getArtist={getArtist}
                emptyLabel="No artist supports yet"
              />
            </div>
          </div>

          {/* Portfolio outside the profile card */}
          <div className="mx-auto w-full max-w-content">
            <ArtistPortfolio
              artist={artist}
              artistId={artist.id}
              artistName={viewName}
              artistRole={viewRole}
              artistPalette={artist.palette}
              projects={projects}
              pledges={relevantPledges}
              artistSupports={artistSupports.length}
              projectSupports={projectSupports}
              isEditing={isEditing}
              isOwner={isOwner}
              onInvest={isOwner ? undefined : onProjectCta}
              investCtaLabel={investCardCtaLabel(ctaAction)}
            />

            <ConnectSection
              isEditing={isEditing}
              draft={
                draft
                  ? {
                      instagram: draft.instagram,
                      spotify: draft.spotify,
                      website: draft.website,
                    }
                  : null
              }
              onDraftChange={(next) =>
                draft &&
                setDraft({
                  ...draft,
                  instagram: next.instagram,
                  spotify: next.spotify,
                  website: next.website,
                })
              }
              instagram={viewInstagram || undefined}
              spotify={viewSpotify || undefined}
              website={viewWebsite || undefined}
            />

          </div>
        </div>
      </div>

      <FundSheet
        mode="artist"
        artistId={artist.id}
        open={fundOpen}
        onClose={() => setFundOpen(false)}
      />
      <SupportSheet
        mode="artist"
        artistId={artist.id}
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
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
    </>
  );
}

function ArtistFundCard({
  raised,
  goal,
  pct,
  isEditing,
  isOwner,
  ctaLabel,
  goalInput,
  onGoalChange,
  onCta,
}: {
  raised: number;
  goal: number;
  pct: number;
  isEditing: boolean;
  isOwner: boolean;
  ctaLabel: string;
  goalInput: string;
  onGoalChange: (v: string) => void;
  onCta: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(8,18,36,0.72)] p-4 backdrop-blur-xl">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="voice text-[10px] text-tertiary">
          General artist fund
        </span>
        {isEditing ? (
          <label className="flex items-center gap-1.5">
            <span className="voice text-[9px] text-muted">Goal</span>
            <input
              inputMode="numeric"
              value={goalInput}
              onChange={(e) =>
                onGoalChange(e.target.value.replace(/[^\d]/g, ""))
              }
              className="w-24 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-right text-[12px] tabular-nums text-ink outline-none"
            />
          </label>
        ) : (
          <span className="voice text-[10px] text-muted">
            {formatMoney(raised)} / {formatMoney(goal)}
          </span>
        )}
      </div>
      {!isEditing ? null : (
        <p className="mb-2 text-right text-[12px] tabular-nums text-muted">
          {formatMoney(raised)} / {formatMoney(goal || 0)}
        </p>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {isEditing ? (
        <p className="voice mt-3 text-center text-[9px] text-tertiary">
          Goal editable · CTA hidden while editing
        </p>
      ) : isOwner ? (
        <p className="voice mt-3 text-center text-[9px] text-tertiary">
          Others can fund or support you here
        </p>
      ) : (
        <button
          type="button"
          onClick={onCta}
          className="voice mt-4 flex h-11 w-full items-center justify-center rounded-full bg-[#E8E0D0] text-[12px] font-semibold tracking-[0.06em] text-[#0A121C]"
        >
          {ctaLabel}
        </button>
      )}
    </section>
  );
}
