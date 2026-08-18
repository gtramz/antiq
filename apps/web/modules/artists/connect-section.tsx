"use client";

import {
  InstagramProfileCard,
  normalizeInstagramProfileUrl,
} from "./instagram-preview";
import {
  normalizeSpotifyArtistUrl,
  SpotifyPreview,
} from "./spotify-preview";

type SocialDraft = {
  instagram: string;
  spotify: string;
  website: string;
};

type Props = {
  isEditing: boolean;
  draft: SocialDraft | null;
  onDraftChange: (next: SocialDraft) => void;
  /** Public view values (already trimmed). */
  instagram?: string;
  spotify?: string;
  website?: string;
};

const ROWS: {
  id: keyof SocialDraft;
  label: string;
  placeholder: string;
  icon: "instagram" | "spotify" | "web";
}[] = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/…",
    icon: "instagram",
  },
  {
    id: "spotify",
    label: "Spotify Artist",
    placeholder: "spotify:artist:… or open.spotify.com/artist/…",
    icon: "spotify",
  },
  {
    id: "website",
    label: "Website",
    placeholder: "https://…",
    icon: "web",
  },
];

/**
 * CONNECT — Instagram, Spotify profile, Website.
 */
export function ConnectSection({
  isEditing,
  draft,
  onDraftChange,
  instagram,
  spotify,
  website,
}: Props) {
  const spotifyHref = spotify
    ? normalizeSpotifyArtistUrl(spotify)
    : undefined;
  const instagramHref = instagram
    ? normalizeInstagramProfileUrl(instagram) ?? instagram
    : undefined;

  const hasAnyPublic =
    Boolean(instagramHref) || Boolean(spotifyHref) || Boolean(website);

  return (
    <section className="mt-10 rounded-surface border border-white/10 bg-[rgba(8,18,36,0.55)] p-4 backdrop-blur-xl sm:p-5">
      <h2 className="voice text-[11px] tracking-[0.16em] text-tertiary uppercase">
        Connect
      </h2>

      {isEditing && draft ? (
        <ul className="mt-4 divide-y divide-white/10">
          {ROWS.map((row) => {
            const value = draft[row.id];
            const spotifyOk =
              row.id !== "spotify" ||
              !value.trim() ||
              Boolean(normalizeSpotifyArtistUrl(value));
            const instagramOk =
              row.id !== "instagram" ||
              !value.trim() ||
              Boolean(normalizeInstagramProfileUrl(value));
            const fieldOk = spotifyOk && instagramOk;
            return (
              <li key={row.id} className="flex items-start gap-3 py-3.5 first:pt-1">
                <PlatformIcon kind={row.icon} />
                <label className="min-w-0 flex-1">
                  <span className="voice text-[10px] text-muted">{row.label}</span>
                  <input
                    value={value}
                    onChange={(e) =>
                      onDraftChange({ ...draft, [row.id]: e.target.value })
                    }
                    placeholder={row.placeholder}
                    className={`mt-1 w-full border-0 border-b bg-transparent pb-1.5 text-[14px] text-ink outline-none placeholder:text-tertiary/60 ${
                      fieldOk
                        ? "border-white/15 focus:border-accent/50"
                        : "border-danger/40 focus:border-danger/60"
                    }`}
                  />
                  {row.id === "spotify" && value.trim() && !spotifyOk ? (
                    <span className="mt-1 block text-[11px] text-muted">
                      Use a valid artist URL or URI — saved only when valid.
                    </span>
                  ) : null}
                  {row.id === "instagram" && value.trim() && !instagramOk ? (
                    <span className="mt-1 block text-[11px] text-muted">
                      Use https://instagram.com/username — saved only when valid.
                    </span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
      ) : hasAnyPublic ? (
        <div className="mt-4 space-y-4">
          {instagramHref ? (
            <InstagramProfileCard profileUrl={instagramHref} />
          ) : null}
          {spotifyHref ? (
            <SpotifyPreview spotifyUrl={spotifyHref} variant="profile" />
          ) : null}
          {website ? (
            <ul className="divide-y divide-white/10">
              <li>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 py-3.5 transition first:pt-1 hover:bg-white/[0.03]"
                >
                  <PlatformIcon kind="web" />
                  <span className="min-w-0 flex-1 text-[15px] font-medium text-ink">
                    Website
                  </span>
                  <span
                    className="text-[16px] text-tertiary transition group-hover:text-ink"
                    aria-hidden
                  >
                    →
                  </span>
                </a>
              </li>
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-muted">No links connected yet</p>
      )}
    </section>
  );
}

function PlatformIcon({
  kind,
}: {
  kind: "instagram" | "spotify" | "web";
}) {
  const tone =
    kind === "spotify"
      ? "border-[#1DB954]/35 bg-[#1DB954]/10 text-[#1DB954]"
      : kind === "instagram"
        ? "border-pink-400/30 bg-pink-400/10 text-pink-200"
        : "border-accent/30 bg-accent/10 text-accent";

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${tone}`}
      aria-hidden
    >
      {kind === "instagram" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      ) : kind === "spotify" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.75.75 0 0 1-1.03.25c-2.82-1.72-6.38-2.11-10.57-1.16a.75.75 0 1 1-.33-1.46c4.56-1.04 8.5-.6 11.68 1.34.36.22.48.68.25 1.03Zm1.4-2.9a.9.9 0 0 1-1.24.3c-3.23-1.98-8.15-2.56-11.97-1.4a.9.9 0 1 1-.53-1.72c4.3-1.32 9.7-.67 13.44 1.62.42.26.55.82.3 1.2Zm.12-3.02c-3.86-2.3-10.24-2.51-13.92-1.39a1.05 1.05 0 1 1-.6-2.01c4.22-1.27 11.2-1.02 15.66 1.62a1.05 1.05 0 1 1-1.14 1.78Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3Z" />
        </svg>
      )}
    </span>
  );
}
