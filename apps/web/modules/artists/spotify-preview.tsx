"use client";

import { useEffect, useRef, useState } from "react";
import type { SpotifyArtistPayload } from "@/modules/artists/spotify-types";

type OEmbed = {
  title?: string;
  thumbnail_url?: string;
};

type Props = {
  spotifyUrl?: string;
  /** profile = Connect identity only; listen = top tracks + preview (Discography). */
  variant?: "profile" | "listen";
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
            ? "Paste an artist URL or URI in Connect."
            : "Use open.spotify.com/artist/… or spotify:artist:…"}
        </p>
      </div>
    </div>
  );
}

type LoadState = {
  artist: SpotifyArtistPayload | null;
  oembed: OEmbed | null;
  mode: "loading" | "api" | "embed" | "invalid";
  errorCode: string | null;
};

function useSpotifyArtist(spotifyUrl: string | undefined, enabled: boolean) {
  const trimmed = spotifyUrl?.trim() ?? "";
  const artistId = trimmed ? parseSpotifyArtistId(trimmed) : null;
  const [state, setState] = useState<LoadState>({
    artist: null,
    oembed: null,
    mode: "loading",
    errorCode: null,
  });

  useEffect(() => {
    if (!enabled) return;
    setState({
      artist: null,
      oembed: null,
      mode: "loading",
      errorCode: null,
    });
  }, [trimmed, enabled]);

  useEffect(() => {
    if (!enabled || !artistId) return;
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
          setState({
            artist: data,
            oembed: null,
            mode: "api",
            errorCode: null,
          });
          return;
        }
        if (!cancelled && apiRes.status === 503) {
          const body = (await apiRes.json().catch(() => null)) as {
            code?: string;
          } | null;
          if (body?.code === "NO_CREDENTIALS") {
            // Fall through to oEmbed
          }
        }
      } catch {
        /* fall through */
      }

      try {
        const oe = await fetch(
          `/api/spotify/oembed?url=${encodeURIComponent(url)}`,
        );
        if (!cancelled && oe.ok) {
          setState({
            artist: null,
            oembed: (await oe.json()) as OEmbed,
            mode: "embed",
            errorCode: null,
          });
          return;
        }
      } catch {
        /* ignore */
      }

      if (!cancelled) {
        setState({
          artist: null,
          oembed: null,
          mode: "invalid",
          errorCode: "load_failed",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trimmed, artistId, enabled]);

  return { trimmed, artistId, ...state };
}

/**
 * Spotify artist card.
 * - profile: identity + Open on Spotify (Connect)
 * - listen: top tracks + audio/embed (Discography)
 */
export function SpotifyPreview({
  spotifyUrl,
  variant = "profile",
  forcePlaceholder,
}: Props) {
  const enabled = !forcePlaceholder;
  const { trimmed, artistId, artist, oembed, mode } = useSpotifyArtist(
    spotifyUrl,
    enabled,
  );
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [playingPreview, setPlayingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setActiveTrack(null);
    setPlayingPreview(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [trimmed, variant]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  function stopPreviewAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingPreview(false);
  }

  function toggleTrack(track: SpotifyArtistPayload["topTracks"][number]) {
    const selecting = activeTrack !== track.id;
    setActiveTrack(selecting ? track.id : null);

    if (!selecting) {
      stopPreviewAudio();
      return;
    }

    stopPreviewAudio();

    if (track.previewUrl) {
      const audio = new Audio(track.previewUrl);
      audioRef.current = audio;
      audio.addEventListener("ended", () => setPlayingPreview(false));
      void audio.play().then(
        () => setPlayingPreview(true),
        () => setPlayingPreview(false),
      );
    }
  }

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
          <p className="mt-0.5 text-[13px] text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  const title = artist?.name ?? oembed?.title ?? "Artist";
  const image = artist?.imageUrl ?? oembed?.thumbnail_url;
  const profileUrl =
    artist?.externalUrl ?? normalizeSpotifyArtistUrl(trimmed) ?? "#";

  const header = (
    <div className="flex items-center gap-3 px-3 py-3">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          width={variant === "profile" ? 56 : 40}
          height={variant === "profile" ? 56 : 40}
          className={`shrink-0 rounded-full object-cover ${
            variant === "profile" ? "h-14 w-14" : "h-10 w-10"
          }`}
        />
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center rounded-full bg-[#1DB954]/20 text-[#1DB954] ${
            variant === "profile" ? "h-14 w-14 text-[14px]" : "h-10 w-10 text-[11px]"
          }`}
        >
          ♫
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="voice text-[9px] tracking-[0.12em] text-[#1DB954]">
          Spotify
        </p>
        <p
          className={`truncate font-medium text-ink ${
            variant === "profile" ? "text-[16px]" : "text-[13px]"
          }`}
        >
          {title}
        </p>
        {artist ? (
          <p className="truncate text-[11px] text-muted">
            {formatFollowers(artist.followers)} followers
            {artist.genres[0] ? ` · ${artist.genres[0]}` : ""}
          </p>
        ) : null}
      </div>
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="voice shrink-0 rounded-full border border-[#1DB954]/35 bg-[#1DB954]/15 px-3 py-1.5 text-[10px] text-[#1DB954] transition hover:bg-[#1DB954]/25"
      >
        Open on Spotify
      </a>
    </div>
  );

  if (variant === "profile") {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md">
        {header}
      </div>
    );
  }

  // listen variant
  const active = artist?.topTracks.find((t) => t.id === activeTrack);
  const useMp3 = Boolean(active?.previewUrl);
  const embedSrc = activeTrack
    ? `https://open.spotify.com/embed/track/${activeTrack}?utm_source=generator&theme=0`
    : `https://open.spotify.com/embed/artist/${artistId}?utm_source=generator&theme=0`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md">
      {header}

      {mode === "api" && artist && artist.topTracks.length > 0 ? (
        <ul className="border-t border-white/10 px-2 py-2">
          <li className="px-2 pb-1.5">
            <p className="voice text-[9px] tracking-[0.08em] text-tertiary uppercase">
              Listen · top tracks
            </p>
          </li>
          {artist.topTracks.map((track, i) => {
            const selected = activeTrack === track.id;
            return (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => toggleTrack(track)}
                  className={`flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-left transition ${
                    selected
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
                  <span className="voice shrink-0 text-[9px] text-tertiary">
                    {selected && track.previewUrl && playingPreview
                      ? "Playing"
                      : track.previewUrl
                        ? "Preview"
                        : "Embed"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {active && useMp3 ? (
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2.5">
          <p className="min-w-0 truncate text-[12px] text-muted">
            30s preview · {active.name}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!audioRef.current || !active.previewUrl) {
                  toggleTrack(active);
                  return;
                }
                if (playingPreview) {
                  audioRef.current.pause();
                  setPlayingPreview(false);
                } else {
                  void audioRef.current.play().then(
                    () => setPlayingPreview(true),
                    () => setPlayingPreview(false),
                  );
                }
              }}
              className="voice rounded-full bg-[#1DB954] px-3 py-1.5 text-[10px] font-semibold text-black"
            >
              {playingPreview ? "Pause" : "Play"}
            </button>
            <a
              href={active.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="voice text-[10px] text-[#1DB954]"
            >
              Full track
            </a>
          </div>
        </div>
      ) : (
        <iframe
          title={title}
          src={embedSrc}
          width="100%"
          height={152}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="block w-full border-0 border-t border-white/10"
        />
      )}
    </div>
  );
}
