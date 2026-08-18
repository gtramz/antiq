import type { PastRelease } from "./release-card";

/** Discography starts empty until artists add past releases. */
export const pastReleases: PastRelease[] = [];

export function releasesForArtist(artistId: string): PastRelease[] {
  return pastReleases.filter((r) => r.artistId === artistId);
}
