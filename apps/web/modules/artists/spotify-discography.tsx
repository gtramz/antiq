"use client";

import { useEffect, useMemo, useState } from "react";
import type { Palette } from "@antiq/types";
import type {
  SpotifyAlbumType,
  SpotifyAlbumsPayload,
  SpotifyArtistPayload,
  SpotifyRelease,
} from "@/modules/artists/spotify-types";
import {
  normalizeSpotifyArtistUrl,
  SpotifyPreview,
} from "@/modules/artists/spotify-preview";
import { ReleaseCard, type PastRelease } from "./release-card";

type FormatFilter = "all" | "singles" | "eps" | "albums";

type Props = {
  artistId: string;
  spotifyUrl?: string;
  palette: Palette;
  format: FormatFilter;
};

function yearFromDate(iso: string): number {
  const y = Number.parseInt(iso.slice(0, 4), 10);
  return Number.isFinite(y) ? y : 0;
}

function formatFromType(t: SpotifyAlbumType): string {
  if (t === "single") return "Single";
  if (t === "ep") return "EP";
  if (t === "compilation") return "Compilation";
  return "Album";
}

function matchesFormat(
  albumType: SpotifyAlbumType,
  filter: FormatFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "singles") return albumType === "single";
  if (filter === "eps") return albumType === "ep";
  if (filter === "albums") {
    return albumType === "album" || albumType === "compilation";
  }
  return true;
}

function toPastRelease(
  artistId: string,
  palette: Palette,
  r: SpotifyRelease,
): PastRelease {
  return {
    id: r.id,
    artistId,
    title: r.name,
    format: formatFromType(r.albumType),
    year: yearFromDate(r.releaseDate),
    seed: r.id,
    palette,
    coverUrl: r.imageUrl,
    externalUrl: r.externalUrl,
    albumType: r.albumType,
  };
}

/**
 * Discography: listen (top tracks) + Spotify release grid.
 */
export function SpotifyDiscography({
  artistId,
  spotifyUrl,
  palette,
  format,
}: Props) {
  const normalized = spotifyUrl
    ? normalizeSpotifyArtistUrl(spotifyUrl)
    : undefined;
  const [releases, setReleases] = useState<SpotifyRelease[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credsMissing, setCredsMissing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!normalized) {
      setReleases(null);
      setError(null);
      setCredsMissing(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setCredsMissing(false);

    (async () => {
      try {
        const [artistRes, albumsRes] = await Promise.all([
          fetch(`/api/spotify/artist?url=${encodeURIComponent(normalized)}`),
          fetch(`/api/spotify/albums?url=${encodeURIComponent(normalized)}`),
        ]);

        if (cancelled) return;

        const artistBody = (await artistRes.json().catch(() => null)) as
          | (SpotifyArtistPayload & { code?: string; error?: string })
          | null;
        const albumsBody = (await albumsRes.json().catch(() => null)) as
          | (SpotifyAlbumsPayload & { code?: string; error?: string })
          | null;

        const missingCreds =
          artistBody?.code === "NO_CREDENTIALS" ||
          albumsBody?.code === "NO_CREDENTIALS";

        if (missingCreds) {
          // Listen still works via oEmbed/embed; albums need Client Credentials.
          setCredsMissing(true);
          setReleases([]);
          setLoading(false);
          return;
        }

        if (albumsRes.ok && albumsBody?.releases) {
          setReleases(albumsBody.releases);
        } else {
          setReleases([]);
          const artistOk = artistRes.ok && Boolean(artistBody?.id);
          if (!artistOk) {
            setError(
              albumsBody?.error ||
                artistBody?.error ||
                "Could not load discography",
            );
          }
        }

        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Could not load discography");
          setReleases([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [normalized]);

  const filtered = useMemo(() => {
    if (!releases) return [];
    return releases
      .filter((r) => matchesFormat(r.albumType, format))
      .map((r) => toPastRelease(artistId, palette, r));
  }, [releases, format, artistId, palette]);

  if (!normalized) {
    return (
      <div className="rounded-surface border border-white/10 bg-black/20 px-5 py-12 text-center backdrop-blur-xl">
        <p className="voice text-[11px] tracking-[0.12em] text-tertiary uppercase">
          Discography
        </p>
        <h3 className="mt-3 font-sans text-[20px] font-bold tracking-[-0.03em] text-ink">
          Link Spotify to load releases
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
          Add an artist URL in Connect (open.spotify.com/artist/… or
          spotify:artist:…) to show listens and albums here.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <p className="py-10 text-center text-[13px] text-muted">
        Loading Spotify discography…
      </p>
    );
  }

  if (error && !credsMissing && filtered.length === 0) {
    return (
      <div className="rounded-surface border border-white/10 bg-black/20 px-5 py-10 text-center">
        <p className="text-[13px] leading-relaxed text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {credsMissing ? (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-[13px] leading-relaxed text-ink">
          <p className="font-medium">Spotify API keys missing</p>
          <p className="mt-1 text-muted">
            Add <code className="text-ink">SPOTIFY_CLIENT_ID</code> and{" "}
            <code className="text-ink">SPOTIFY_CLIENT_SECRET</code> in{" "}
            <code className="text-ink">apps/web/.env.local</code>, then restart{" "}
            <code className="text-ink">pnpm --filter @antiq/web dev</code>.
            Create an app at{" "}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              developer.spotify.com/dashboard
            </a>
            . Listen still works via Spotify embed below; album grid needs the
            keys.
          </p>
        </div>
      ) : null}

      <section>
        <p className="voice mb-3 text-[10px] tracking-[0.12em] text-tertiary uppercase">
          Listen
        </p>
        <SpotifyPreview spotifyUrl={normalized} variant="listen" />
      </section>

      <section>
        <p className="voice mb-3 text-[10px] tracking-[0.12em] text-tertiary uppercase">
          Releases
        </p>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
            {filtered.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-[13px] text-muted">
            {credsMissing
              ? "Album grid needs Spotify API credentials (see note above)."
              : error
                ? error
                : releases && releases.length > 0
                  ? "No releases in this format"
                  : "No album releases found for this artist"}
          </p>
        )}
      </section>
    </div>
  );
}
