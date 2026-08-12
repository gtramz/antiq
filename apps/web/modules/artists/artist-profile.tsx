"use client";

import { artistFundingPercent, type CategoryId } from "@antiq/types";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/modules/data/store";
import { ArtPeek } from "@/modules/discover/art-peek";
import {
  CATEGORY_IDS,
  categoryLabel,
} from "@/modules/discover/taxonomy";
import { FundSheet } from "@/modules/funding/fund-sheet";
import { Avatar } from "@/modules/shell/avatar";
import { formatMoney } from "@/modules/shell/tokens";
import { ArtistPortfolio } from "./artist-portfolio";
import { releasesForArtist } from "./discography-seed";
import {
  normalizeSpotifyArtistUrl,
  SpotifyPreview,
} from "./spotify-preview";

type Draft = {
  name: string;
  bio: string;
  role: CategoryId;
  specialty: string;
  instagram: string;
  x: string;
  spotify: string;
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

function readLocalImage(file: File | undefined): Promise<string | undefined> {
  if (!file || !file.type.startsWith("image/")) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

export function ArtistProfile({ artistId }: { artistId: string }) {
  const { getArtist, projectsByArtist, setProjectListed, updateArtist } =
    useStore();
  const artist = getArtist(artistId);
  const projects = projectsByArtist(artistId);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundProjectId, setFundProjectId] = useState<string | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBannerFailed(false);
    setIsEditing(false);
    setDraft(null);
  }, [artistId]);

  const specialtyHint = useMemo(() => {
    const listed = projects.find((p) => p.listedForFunding);
    return listed?.subcategory ?? projects[0]?.subcategory ?? "";
  }, [projects]);

  if (!artist) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-content flex-1 flex-col overflow-hidden px-5 pt-16 lg:px-8">
        <p className="voice text-[12px] text-muted">Artist not found</p>
        <Link
          href="/"
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
  const viewX = isEditing && draft ? draft.x.trim() : artist.socials.x ?? "";
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
    ? `${categoryLabel(viewRole)} / ${viewSpecialty}`
    : categoryLabel(viewRole);

  function startEditing() {
    setDraft({
      name: artist!.name,
      bio: artist!.bio,
      role: artist!.role,
      specialty: specialtyHint,
      instagram: artist!.socials.instagram ?? "",
      x: artist!.socials.x ?? "",
      spotify: artist!.socials.spotify ?? "",
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
    updateArtist(artist!.id, {
      name: draft.name.trim() || artist!.name,
      bio: draft.bio.trim(),
      role: draft.role,
      avatarUrl: draft.avatarUrl,
      bannerUrl: draft.bannerUrl,
      artistGoal:
        Number.isFinite(goal) && goal >= 0 ? goal : artist!.artistGoal,
      socials: {
        instagram: draft.instagram.trim() || undefined,
        x: draft.x.trim() || undefined,
        spotify,
        website: artist!.socials.website,
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

  const spotifyHref = viewSpotify
    ? normalizeSpotifyArtistUrl(viewSpotify)
    : undefined;
  const websiteHref =
    isEditing && draft
      ? undefined
      : artist.socials.website;
  const socialLinks = [
    viewInstagram
      ? { id: "instagram", label: "Instagram", href: viewInstagram }
      : null,
    viewX ? { id: "x", label: "X", href: viewX } : null,
    spotifyHref
      ? { id: "spotify", label: "Spotify", href: spotifyHref }
      : null,
    websiteHref
      ? { id: "website", label: "Website", href: websiteHref }
      : null,
  ].filter(Boolean) as { id: string; label: string; href: string }[];

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-8 pt-[max(12px,env(safe-area-inset-top))] [-webkit-overflow-scrolling:touch] lg:px-8 lg:pb-12 lg:pt-6">
          <div className="mx-auto w-full max-w-content lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
            {/* One profile card: cover + avatar + identity */}
            <article className="rounded-surface border border-white/10 bg-black/20 backdrop-blur-md">
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
                    href="/"
                    className="voice rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] text-ink backdrop-blur-md"
                  >
                    ← Back
                  </Link>

                  {isEditing ? (
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
                      Edit profile
                    </button>
                  )}
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
                  {viewAvatar?.startsWith("data:") ? (
                    <span className="avatar relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.55)] ring-[3px] ring-[rgba(8,14,24,0.95)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={viewAvatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ) : (
                    <Avatar
                      name={viewName}
                      tint={artist.palette.a}
                      src={viewAvatar}
                      size="lg"
                      className="shadow-[0_8px_28px_rgba(0,0,0,0.55)] ring-[3px] ring-[rgba(8,14,24,0.95)]"
                    />
                  )}
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
                      className="w-full border-0 border-b border-white/15 bg-transparent pb-2 font-display text-[30px] leading-none tracking-[-0.02em] text-ink outline-none placeholder:text-tertiary lg:text-[36px]"
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
                      <span className="text-tertiary">/</span>
                      <input
                        value={draft.specialty}
                        onChange={(e) =>
                          setDraft({ ...draft, specialty: e.target.value })
                        }
                        placeholder="Genre"
                        className="voice min-w-[8rem] flex-1 border-0 border-b border-white/10 bg-transparent py-1 text-[10px] text-accent outline-none placeholder:text-tertiary"
                      />
                    </div>
                    <textarea
                      value={draft.bio}
                      onChange={(e) =>
                        setDraft({ ...draft, bio: e.target.value })
                      }
                      rows={4}
                      placeholder="Short bio"
                      className="w-full resize-none border-0 border-b border-white/10 bg-transparent py-2 text-[14px] leading-relaxed text-muted outline-none placeholder:text-tertiary"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="mt-3 font-display text-[28px] leading-none tracking-[-0.02em] text-ink lg:text-[36px]">
                      {viewName}
                    </h1>
                    <p className="voice mt-1.5 text-[10px] text-accent">
                      {roleLine}
                    </p>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
                      {viewBio}
                    </p>
                  </>
                )}
              </div>
            </article>

            {/* Fund — sidebar on desktop, below card on mobile */}
            <div className="mt-4 lg:sticky lg:top-6 lg:mt-0">
              <ArtistFundCard
                raised={artist.artistRaised}
                goal={viewGoal}
                pct={artistPct}
                isEditing={isEditing}
                goalInput={draft?.artistGoal ?? String(artist.artistGoal)}
                onGoalChange={(v) =>
                  draft && setDraft({ ...draft, artistGoal: v })
                }
                onFund={() => setFundOpen(true)}
              />
            </div>
          </div>

          {/* Portfolio outside the profile card */}
          <div className="mx-auto w-full max-w-content">
            <ArtistPortfolio
              artistId={artist.id}
              artistName={viewName}
              projects={projects}
              releases={releasesForArtist(artist.id)}
              isEditing={isEditing}
              onInvest={(id) => setFundProjectId(id)}
            />

            {/* Socials — last, clean & organized */}
            <section className="mt-10 rounded-surface border border-white/10 bg-black/20 p-4 backdrop-blur-md sm:p-5">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="voice text-[10px] text-tertiary">Socials</h2>
                {!isEditing && socialLinks.length > 0 ? (
                  <span className="voice text-[9px] text-tertiary/70">
                    {socialLinks.length} linked
                  </span>
                ) : null}
              </div>

              {isEditing && draft ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <GlassField
                    label="Instagram"
                    value={draft.instagram}
                    onChange={(v) => setDraft({ ...draft, instagram: v })}
                    placeholder="https://instagram.com/…"
                  />
                  <GlassField
                    label="X"
                    value={draft.x}
                    onChange={(v) => setDraft({ ...draft, x: v })}
                    placeholder="https://x.com/…"
                  />
                  <GlassField
                    label="Spotify artist URI"
                    value={draft.spotify}
                    onChange={(v) => setDraft({ ...draft, spotify: v })}
                    placeholder="spotify:artist:… or open.spotify.com/artist/…"
                  />
                  <div className="sm:col-span-2">
                    <SpotifyPreview spotifyUrl={draft.spotify} />
                  </div>
                </div>
              ) : socialLinks.length > 0 ? (
                <div className="space-y-4">
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {socialLinks.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-11 items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 transition hover:border-white/20 hover:bg-white/10"
                        >
                          <span className="voice text-[10px] text-ink">
                            {link.label}
                          </span>
                          <span className="text-[12px] text-tertiary" aria-hidden>
                            →
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  {spotifyHref ? (
                    <SpotifyPreview spotifyUrl={spotifyHref} />
                  ) : null}
                </div>
              ) : (
                <p className="text-[13px] text-muted">No socials linked yet</p>
              )}
            </section>

            <section className="mt-8 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setShowManage((v) => !v)}
                className="voice text-[10px] text-tertiary"
              >
                {showManage ? "Hide demo manage ▴" : "Demo manage ▾"}
              </button>
              {showManage ? (
                <ul className="mt-3 flex flex-col gap-2 lg:max-w-xl">
                  {projects.map((project) => (
                    <li
                      key={project.id}
                      className="flex items-center justify-between gap-3 py-1"
                    >
                      <span className="min-w-0 truncate text-[13px] text-muted">
                        {project.title}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={project.listedForFunding}
                        onClick={() =>
                          setProjectListed(
                            project.id,
                            !project.listedForFunding,
                          )
                        }
                        className={`voice shrink-0 text-[10px] ${
                          project.listedForFunding
                            ? "text-accent"
                            : "text-tertiary"
                        }`}
                      >
                        {project.listedForFunding ? "Listed" : "Portfolio"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      <FundSheet
        mode="artist"
        artistId={artist.id}
        open={fundOpen}
        onClose={() => setFundOpen(false)}
      />
      {fundProjectId ? (
        <FundSheet
          mode="project"
          projectId={fundProjectId}
          open
          onClose={() => setFundProjectId(null)}
        />
      ) : null}
    </>
  );
}

function GlassField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/20 px-3.5 py-2.5 backdrop-blur-md">
      <span className="voice text-[9px] text-tertiary">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-tertiary/70"
      />
    </label>
  );
}

function ArtistFundCard({
  raised,
  goal,
  pct,
  isEditing,
  goalInput,
  onGoalChange,
  onFund,
}: {
  raised: number;
  goal: number;
  pct: number;
  isEditing: boolean;
  goalInput: string;
  onGoalChange: (v: string) => void;
  onFund: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0B1C33]/85 p-4 backdrop-blur-md">
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
      {!isEditing ? (
        <button
          type="button"
          onClick={onFund}
          className="voice mt-4 flex h-11 w-full items-center justify-center rounded-full bg-accent text-[12px] text-bg"
        >
          Fund artist
        </button>
      ) : (
        <p className="voice mt-3 text-center text-[9px] text-tertiary">
          Goal editable · fund button hidden while editing
        </p>
      )}
    </section>
  );
}
