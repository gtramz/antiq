import { NextRequest, NextResponse } from "next/server";
import {
  artistIdFromSpotifyUrl,
  getSpotifyAccessToken,
  spotifyConfigured,
} from "@/modules/artists/spotify-server";
import type {
  SpotifyAlbumType,
  SpotifyAlbumsPayload,
  SpotifyRelease,
} from "@/modules/artists/spotify-types";

type SpotifyAlbumItem = {
  id: string;
  name: string;
  album_type?: string;
  album_group?: string;
  release_date?: string;
  total_tracks?: number;
  external_urls?: { spotify?: string };
  images?: { url: string }[];
};

function mapAlbumType(raw: string | undefined): SpotifyAlbumType {
  const t = (raw ?? "album").toLowerCase();
  if (t === "single") return "single";
  if (t === "compilation") return "compilation";
  // Spotify uses album_group "appears_on" etc.; treat "ep" if present in name heuristics later
  if (t === "ep") return "ep";
  return "album";
}

/** Prefer album_group when Spotify marks EPs as album_type=single. */
function resolveAlbumType(item: SpotifyAlbumItem): SpotifyAlbumType {
  const group = (item.album_group ?? "").toLowerCase();
  if (group === "appears_on") return "compilation";
  if (group === "compilation") return "compilation";
  if (group === "single") {
    // Heuristic: few tracks often EP in MX catalog
    const tracks = item.total_tracks ?? 1;
    if (tracks >= 3 && tracks <= 6) return "ep";
    return "single";
  }
  if (group === "album") return "album";
  return mapAlbumType(item.album_type);
}

function dedupeKey(r: SpotifyRelease): string {
  return `${r.name.trim().toLowerCase()}::${r.albumType}`;
}

/**
 * GET /api/spotify/albums?url=
 * Artist discography via Client Credentials.
 */
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
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,ep&market=MX&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Albums fetch failed" },
        { status: res.status },
      );
    }

    const json = (await res.json()) as { items?: SpotifyAlbumItem[] };
    const items = json.items ?? [];

    const mapped: SpotifyRelease[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      albumType: resolveAlbumType(item),
      releaseDate: item.release_date ?? "",
      externalUrl:
        item.external_urls?.spotify ??
        `https://open.spotify.com/album/${item.id}`,
      imageUrl: item.images?.[0]?.url,
      totalTracks: item.total_tracks ?? 0,
    }));

    const seen = new Set<string>();
    const releases: SpotifyRelease[] = [];
    for (const r of mapped) {
      const key = dedupeKey(r);
      if (seen.has(key)) continue;
      seen.add(key);
      releases.push(r);
    }

    releases.sort((a, b) => {
      const da = a.releaseDate || "0000";
      const db = b.releaseDate || "0000";
      return db.localeCompare(da);
    });

    const payload: SpotifyAlbumsPayload = { artistId, releases };
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Spotify request error" },
      { status: 502 },
    );
  }
}
