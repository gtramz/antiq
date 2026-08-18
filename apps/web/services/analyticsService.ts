import type { ArtistAnalytics } from "@antiq/types";
import {
  buildArtistAnalytics,
  type ArtistAnalyticsSnapshot,
} from "@/lib/artist-analytics";
import { ApiError, apiFetch } from "@/services/apiClient";
import { AUTH_TOKEN_KEY } from "@/services/authService";

function readToken(): string | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Load public artist analytics.
 * Tries GET /api/artists/[id]/analytics; on 401/403/404/501/network
 * falls back to deterministic catalog compute (same schema).
 */
export async function getArtistAnalytics(
  artistId: string,
  snapshot: ArtistAnalyticsSnapshot,
): Promise<ArtistAnalytics> {
  const token = readToken();
  try {
    const data = await apiFetch<ArtistAnalytics>(
      `/api/artists/${encodeURIComponent(artistId)}/analytics`,
      { token },
    );
    if (data?.artistId && data.trust && data.metrics) {
      return { ...data, source: data.source ?? "api" };
    }
  } catch (err) {
    if (err instanceof ApiError) {
      // Expected until backend analytics is provisioned (501) or auth edge cases.
      if (![401, 403, 404, 501].includes(err.status)) {
        // Still fall back — UI must keep working offline / mid-migration.
      }
    }
  }

  return buildArtistAnalytics(
    { ...snapshot, artist: { ...snapshot.artist, id: artistId } },
    "catalog",
  );
}
