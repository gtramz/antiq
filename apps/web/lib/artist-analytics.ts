import {
  trustLevelFromScore,
  type Artist,
  type ArtistAnalytics,
  type Pledge,
  type Project,
  type TrustFactor,
} from "@antiq/types";

/** Serializable snapshot used to compute analytics (catalog or future API). */
export type ArtistAnalyticsSnapshot = {
  artist: Pick<
    Artist,
    | "id"
    | "name"
    | "bio"
    | "avatarUrl"
    | "bannerUrl"
    | "socials"
    | "artistRaised"
    | "artistGoal"
  >;
  projects: Pick<
    Project,
    "id" | "status" | "listedForFunding" | "goal" | "raised"
  >[];
  /** Pledges targeting this artist or their projects. */
  pledges: Pick<Pledge, "id" | "kind" | "artistId" | "projectId" | "amount">[];
  /** Public symbolic supports of kind "artist" for this profile. */
  artistSupports: number;
  /** Supports across this artist's projects (kind "project"). */
  projectSupports: number;
  spotifyFollowers: number | null;
};

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function activeProjectsScore(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 55;
  if (count === 2) return 80;
  return 100;
}

function fundingScore(percent: number, totalRaised: number): number {
  if (totalRaised <= 0 && percent <= 0) return 10;
  return clampScore(percent * 0.85 + (totalRaised > 0 ? 15 : 0));
}

function supportsScore(artistSupports: number, projectSupports: number): number {
  const total = artistSupports + projectSupports;
  if (total <= 0) return 5;
  if (total === 1) return 40;
  if (total <= 3) return 65;
  if (total <= 8) return 85;
  return 100;
}

function spotifyScore(followers: number | null): number {
  if (followers == null) return 0;
  if (followers <= 0) return 15;
  // log10 scale: 100 → ~40, 1k → ~55, 10k → ~70, 100k → ~85, 1M → ~100
  const log = Math.log10(followers + 1);
  return clampScore((log / 6) * 100);
}

function completenessScore(
  artist: ArtistAnalyticsSnapshot["artist"],
): { score: number; note: string } {
  let points = 0;
  const parts: string[] = [];
  if (artist.bio.trim()) {
    points += 25;
    parts.push("bio");
  }
  if (artist.avatarUrl) {
    points += 25;
    parts.push("avatar");
  }
  if (artist.bannerUrl) {
    points += 15;
    parts.push("banner");
  }
  const socials = [
    artist.socials.spotify,
    artist.socials.instagram,
    artist.socials.x,
    artist.socials.website,
  ].filter(Boolean).length;
  points += Math.min(35, socials * 12);
  if (socials > 0) parts.push(`${socials} socials`);
  return {
    score: clampScore(points),
    note: parts.length ? parts.join(" · ") : "Profile incomplete",
  };
}

/**
 * Pure, deterministic artist analytics + trust score.
 * Shared by catalog fallback and future API implementations.
 */
export function buildArtistAnalytics(
  snapshot: ArtistAnalyticsSnapshot,
  source: ArtistAnalytics["source"] = "catalog",
): ArtistAnalytics {
  const { artist, projects, pledges } = snapshot;
  const activeProjects = projects.filter(
    (p) => p.listedForFunding && p.status === "open",
  ).length;
  const fundedProjects = projects.filter((p) => p.status === "funded").length;

  const projectRaised = projects.reduce((sum, p) => sum + p.raised, 0);
  const projectGoal = projects.reduce((sum, p) => sum + p.goal, 0);
  const totalRaised = projectRaised + artist.artistRaised;
  const totalGoal = projectGoal + artist.artistGoal;
  const fundingPercent =
    totalGoal > 0
      ? Math.min(100, Math.round((totalRaised / totalGoal) * 100))
      : 0;

  const projectIds = new Set(projects.map((p) => p.id));
  const relevantPledges = pledges.filter(
    (pl) =>
      (pl.kind === "artist" && pl.artistId === artist.id) ||
      (pl.kind === "project" &&
        pl.projectId != null &&
        projectIds.has(pl.projectId)),
  );
  // Until pledges carry investor identity, each pledge is one investor action.
  const uniqueInvestors = relevantPledges.length;

  const complete = completenessScore(artist);

  const factors: TrustFactor[] = [
    {
      id: "active_projects",
      label: "Active funding projects",
      weight: 0.2,
      score: activeProjectsScore(activeProjects),
      note:
        activeProjects === 0
          ? "No open listed projects"
          : `${activeProjects} open`,
    },
    {
      id: "funding_momentum",
      label: "Funding momentum",
      weight: 0.25,
      score: fundingScore(fundingPercent, totalRaised),
      note: `${fundingPercent}% of combined goals`,
    },
    {
      id: "artist_support",
      label: "Artist support signal",
      weight: 0.2,
      score: supportsScore(snapshot.artistSupports, snapshot.projectSupports),
      note: `${snapshot.artistSupports} profile · ${snapshot.projectSupports} project`,
    },
    {
      id: "spotify_reach",
      label: "Spotify reach",
      weight: 0.15,
      score: spotifyScore(snapshot.spotifyFollowers),
      note:
        snapshot.spotifyFollowers == null
          ? "Not linked or unavailable"
          : `${snapshot.spotifyFollowers.toLocaleString()} followers`,
    },
    {
      id: "profile_completeness",
      label: "Profile completeness",
      weight: 0.2,
      score: complete.score,
      note: complete.note,
    },
  ];

  const weighted = factors.reduce(
    (sum, f) => sum + f.score * f.weight,
    0,
  );
  const score = clampScore(weighted);
  const level = trustLevelFromScore(score);

  return {
    artistId: artist.id,
    source,
    updatedAt: new Date().toISOString(),
    trust: { score, level, factors },
    metrics: {
      profileViews: null,
      projectViews: null,
      uniqueInvestors,
      totalRaised,
      totalGoal,
      fundingPercent,
      activeProjects,
      fundedProjects,
      artistSupports: snapshot.artistSupports,
      spotifyFollowers: snapshot.spotifyFollowers,
    },
    series: {
      views30d: null,
      funding30d: null,
    },
  };
}
