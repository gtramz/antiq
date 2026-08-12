import { NextRequest, NextResponse } from "next/server";
import {
  artistIdFromSpotifyUrl,
  getSpotifyAccessToken,
  spotifyConfigured,
} from "@/modules/artists/spotify-server";
import type { SpotifyArtistPayload } from "@/modules/artists/spotify-types";

/** Real Spotify artist + top tracks (Client Credentials). */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const artistId = artistIdFromSpotifyUrl(url);
  if (!artistId) {
    return NextResponse.json({ error: "Invalid artist URL" }, { status: 400 });
  }

  if (!spotifyConfigured()) {
    return NextResponse.json(
      { error: "Spotify credentials not configured", code: "NO_CREDENTIALS" },
      { status: 503 },
    );
  }

  const token = await getSpotifyAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Spotify auth failed" }, { status: 502 });
  }

  try {
    const [artistRes, tracksRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      }),
      fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=MX`,
        {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 3600 },
        },
      ),
    ]);

    if (!artistRes.ok) {
      return NextResponse.json(
        { error: "Artist fetch failed" },
        { status: artistRes.status },
      );
    }

    const artist = (await artistRes.json()) as {
      id: string;
      name: string;
      images?: { url: string }[];
      followers?: { total: number };
      genres?: string[];
      external_urls?: { spotify?: string };
    };

    const tracksJson = tracksRes.ok
      ? ((await tracksRes.json()) as {
          tracks: {
            id: string;
            name: string;
            preview_url: string | null;
            external_urls?: { spotify?: string };
            album?: { images?: { url: string }[] };
          }[];
        })
      : { tracks: [] };

    const payload: SpotifyArtistPayload = {
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url,
      followers: artist.followers?.total ?? 0,
      genres: artist.genres ?? [],
      externalUrl:
        artist.external_urls?.spotify ??
        `https://open.spotify.com/artist/${artistId}`,
      topTracks: (tracksJson.tracks ?? []).slice(0, 5).map((t) => ({
        id: t.id,
        name: t.name,
        previewUrl: t.preview_url,
        externalUrl:
          t.external_urls?.spotify ??
          `https://open.spotify.com/track/${t.id}`,
        albumImage: t.album?.images?.[t.album.images.length - 1]?.url,
      })),
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Spotify request error" }, { status: 502 });
  }
}
