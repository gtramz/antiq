import type { ArtistAnalytics } from "@antiq/types";
import { jsonError } from "@/lib/auth-server";

/**
 * GET /api/artists/[id]/analytics
 *
 * Public. When event tracking + catalog persistence land, this route will
 * return `source: "api"` with real views/series. Until then clients use
 * catalog fallback via analyticsService (501).
 *
 * Future: analytics_events (view_profile, view_project, fund) → metrics/series.
 */
export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    const artistId = context.params.id;
    if (!artistId?.trim()) {
      return jsonError("Artist id is required", 400);
    }

    // Catalog + event store not persisted server-side yet.
    // Stable contract for clients — do not invent mock series here.
    return Response.json(
      {
        message:
          "Artist analytics API not fully provisioned. Use catalog fallback.",
        error: "not_implemented",
        artistId: artistId.trim(),
        // Shape hint for future responders (not a full ArtistAnalytics payload).
        expected: {
          source: "api",
          metrics: {
            profileViews: "number|null",
            projectViews: "number|null",
          },
        } satisfies Partial<Record<string, unknown>>,
      },
      { status: 501 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load analytics";
    return jsonError(message, 500);
  }
}

/** Type anchor so the route file stays coupled to the public contract. */
export type ArtistAnalyticsResponse = ArtistAnalytics;
