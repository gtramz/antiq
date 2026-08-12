"use client";

import { useEffect, useState } from "react";
import type { SpotifyArtistPayload } from "@/modules/artists/spotify-types";

type OEmbed = {
  title?: string;
  thumbnail_url?: string;
};

type Props = {
  spotifyUrl?: string;
  /** When true, always show the glass placeholder instead of fetching. */
  forcePlaceholder?: boolean;
};

/** Accept open.spotify.com/artist/… or spotify:artist:… */
export function parseSpotifyArtistId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const uri = value.match(/^spotify:artist:([a-zA-Z0-9]+)$/i);
  if (uri?.[1]) return uri[1];
  const web = value.match(
    /(?:open\.)?spotify\.com\/artist\/([a-zA-Z0-9]+)/i,
  );
  return web?.[1] ?? null;
}

export function normalizeSpotifyArtistUrl(raw: string): string | undefined {
  const id = parseSpotifyArtistId(raw);
  if (!id) return undefined;
  return `https://open.spotify.com/artist/${id}`;
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function SpotifyPlaceholder({ reason }: { reason: "empty" | "invalid" }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-md">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1DB954]/30 bg-[#1DB954]/10 text-[16px] text-[#1DB954]">
        ♫
      </span>
      <div className="min-w-0">
        <p className="voice text-[9px] tracking-[0.12em] text-[#1DB954]/80">
          Spotify
        </p>
        <p className="mt-0.5 text-[13px] font-medium text-ink">
          {reason === "empty" ? "No Spotify linked" : "Invalid Spotify link"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          {reason === "empty"
            ? "Paste an artist URL or URI to preview the embed."
            : "Use open.spotify.com/artist/… or spotify:artist:…"}
        </p>
      </div>
    </div>
  );
}

/**
 * Spotify artist — Web API when configured, else oEmbed + official embed.
 * Invalid / empty URLs render a stylized placeholder (never a hard error).
 */
export function SpotifyPreview({ spotifyUrl, forcePlaceholder }: Props) {
  const trimmed = spotifyUrl?.trim() ?? "";
  const artistId = trimmed ? parseSpotifyArtistId(trimmed) : null;
  const [artist, setArtist] = useState<SpotifyArtistPayload | null>(null);
  const [oembed, setOembed] = useState<OEmbed | null>(null);
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [mode, setMode] = useState<"loading" | "api" | "embed" | "invalid">(
    "loading",
  );

  useEffect(() => {
    setArtist(null);
    setOembed(null);
    setActiveTrack(null);
    setMode("loading");
  }, [trimmed]);

  useEffect(() => {
    if (!artistId || forcePlaceholder) return;
    const url = normalizeSpotifyArtistUrl(trimmed);
    if (!url) return;
    let cancelled = false;

    (async () => {
      try {
        const apiRes = await fetch(
          `/api/spotify/artist?url=${encodeURIComponent(url)}`,
        );
        if (!cancelled && apiRes.ok) {
          const data = (await apiRes.json()) as SpotifyArtistPayload;
          setArtist(data);
          setMode("api");
          return;
        }
      } catch {
        /* fall through */
      }

      try {
        const oe = await fetch(
          `/api/spotify/oembed?url=${encodeURIComponent(url)}`,
        );
        if (!cancelled && oe.ok) {
          setOembed((await oe.json()) as OEmbed);
          setMode("embed");
          return;
        }
      } catch {
        /* ignore */
      }

      /* Bad / unknown artist — never mount a 404 iframe. */
      if (!cancelled) setMode("invalid");
    })();

    return () => {
      cancelled = true;
    };
  }, [trimmed, artistId, forcePlaceholder]);

  if (forcePlaceholder || !trimmed) {
    return <SpotifyPlaceholder reason="empty" />;
  }

  if (!artistId || mode === "invalid") {
    return <SpotifyPlaceholder reason="invalid" />;
  }

  if (mode === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur-md">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1DB954]/30 bg-[#1DB954]/10 text-[16px] text-[#1DB954]">
          ♫
        </span>
        <div>
          <p className="voice text-[9px] tracking-[0.12em] text-[#1DB954]/80">
            Spotify
          </p>
          <p className="mt-0.5 text-[13px] text-muted">Loading preview…</p>
        </div>
      </div>
    );
  }

  const title = artist?.name ?? oembed?.title ?? "Artist";
  const image = artist?.imageUrl ?? oembed?.thumbnail_url;
  const embedSrc = activeTrack
    ? `https://open.spotify.com/embed/track/${activeTrack}?utm_source=generator&theme=0`
    : `https://open.spotify.com/embed/artist/${artistId}?utm_source=generator&theme=0`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md">
      <div className="flex items-center gap-3 px-3 py-2.5">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1DB954]/20 text-[11px] text-[#1DB954]">
            ♫
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="voice text-[9px] tracking-[0.12em] text-[#1DB954]">
            Spotify
          </p>
          <p className="truncate text-[13px] font-medium text-ink">{title}</p>
          {artist ? (
            <p className="truncate text-[11px] text-muted">
              {formatFollowers(artist.followers)} followers
              {artist.genres[0] ? ` · ${artist.genres[0]}` : ""}
            </p>
          ) : null}
        </div>
        <a
          href={artist?.externalUrl ?? normalizeSpotifyArtistUrl(trimmed)}
          target="_blank"
          rel="noopener noreferrer"
          className="voice shrink-0 text-[10px] text-muted"
        >
          Open
        </a>
      </div>

      {mode === "api" && artist && artist.topTracks.length > 0 ? (
        <ul className="border-t border-white/10 px-2 py-2">
          {artist.topTracks.map((track, i) => (
            <li key={track.id}>
              <button
                type="button"
                onClick={() =>
                  setActiveTrack((id) =>
                    id === track.id ? null : track.id,
                  )
                }
                className={`flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-left transition ${
                  activeTrack === track.id
                    ? "bg-[#1DB954]/15"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <span className="voice w-4 shrink-0 text-[10px] text-tertiary">
                  {i + 1}
                </span>
                {track.albumImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.albumImage}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded-sm object-cover"
                  />
                ) : null}
                <span className="min-w-0 flex-1 truncate text-[12px] text-ink">
                  {track.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <iframe
        title={title}
        src={embedSrc}
        width="100%"
        height={152}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block w-full border-0 border-t border-white/10"
      />
    </div>
  );
}
