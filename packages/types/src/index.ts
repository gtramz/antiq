import { z } from "zod";

export const PaletteSchema = z.object({
  bg: z.string(),
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

export type Palette = z.infer<typeof PaletteSchema>;

export const ArtistSocialsSchema = z.object({
  instagram: z.string().url().optional(),
  x: z.string().url().optional(),
  spotify: z.string().url().optional(),
  website: z.string().url().optional(),
});

export type ArtistSocials = z.infer<typeof ArtistSocialsSchema>;

/** @deprecated Mock IG preview — prefer instagramPosts embeds. */
export const InstagramPreviewSchema = z.object({
  handle: z.string(),
  followersLabel: z.string(),
  postsLabel: z.string(),
  tiles: z.array(z.string()).min(1).max(9),
});

export type InstagramPreview = z.infer<typeof InstagramPreviewSchema>;

/** Music role — also used as project category filter. */
export const CategoryIdSchema = z.enum([
  "vocalist",
  "producer",
  "songwriter",
  "composer",
  "dj",
  "band",
  "instrumentalist",
  "engineer",
]);
export type CategoryId = z.infer<typeof CategoryIdSchema>;

export const ArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string(),
  palette: PaletteSchema,
  /** Primary music role. */
  role: CategoryIdSchema,
  socials: ArtistSocialsSchema.default({}),
  /** Auth user id when this catalog artist is the account's public profile (1:1). */
  ownerUserId: z.string().optional(),
  /** Profile photo — https URL or local data URL from upload. */
  avatarUrl: z.string().optional(),
  /** Profile banner — https URL or local data URL from upload. */
  bannerUrl: z.string().optional(),
  /** Real Instagram post/reel permalinks for official embeds. */
  instagramPosts: z.array(z.string().url()).optional(),
  /** @deprecated */
  instagramPreview: InstagramPreviewSchema.optional(),
  /** General artist funding goal (MXN). */
  artistGoal: z.number().int().nonnegative(),
  artistRaised: z.number().int().nonnegative(),
});

export type Artist = z.infer<typeof ArtistSchema>;

export const ProjectStatusSchema = z.enum(["open", "funded", "closed"]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const OwnershipSplitSchema = z.object({
  id: z.string(),
  role: z.string().min(1),
  percent: z.number().min(0).max(100),
});

export type OwnershipSplit = z.infer<typeof OwnershipSplitSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  artistId: z.string(),
  title: z.string(),
  pitch: z.string(),
  story: z.string(),
  category: CategoryIdSchema,
  subcategory: z.string(),
  format: z.string(),
  goal: z.number().int().nonnegative(),
  raised: z.number().int().nonnegative(),
  seed: z.string(),
  palette: PaletteSchema,
  status: ProjectStatusSchema,
  /** Artist opted this work into Discover funding. */
  listedForFunding: z.boolean(),
  /** Artist-chosen cover — https URL or local data URL from upload. */
  coverUrl: z.string().optional(),
  previewSeconds: z.number().int().positive().optional(),
  snippetLabel: z.string().optional(),
  /** Short investor-facing return description. */
  returnModel: z.string().optional(),
  /** How funds will be used (tags). */
  useOfFunds: z.array(z.string()).default([]),
  /** Target release date as ISO YYYY-MM-DD. */
  targetReleaseDate: z.string().optional(),
  /** Royalty splits for creative roles (investors = remainder to 100). */
  ownershipSplits: z.array(OwnershipSplitSchema).default([]),
});

export type Project = z.infer<typeof ProjectSchema>;

/** Sum of role split percentages (excludes investors remainder). */
export function ownershipAllocated(
  splits: OwnershipSplit[],
): number {
  return splits.reduce((sum, s) => sum + (Number.isFinite(s.percent) ? s.percent : 0), 0);
}

/** Remainder available for investors (clamped at 0). */
export function investorsSharePercent(splits: OwnershipSplit[]): number {
  return Math.max(0, Math.round((100 - ownershipAllocated(splits)) * 10) / 10);
}

export const PledgeKindSchema = z.enum(["project", "artist"]);
export type PledgeKind = z.infer<typeof PledgeKindSchema>;

export const PledgeSchema = z.object({
  id: z.string(),
  kind: PledgeKindSchema,
  artistId: z.string(),
  projectId: z.string().optional(),
  amount: z.number().int().positive(),
  createdAt: z.string(),
});

export type Pledge = z.infer<typeof PledgeSchema>;

/** Symbolic endorsement from one catalog artist (no money). */
export const SupportKindSchema = z.enum(["project", "artist"]);
export type SupportKind = z.infer<typeof SupportKindSchema>;

export const SupportSchema = z.object({
  id: z.string(),
  kind: SupportKindSchema,
  /** Catalog artist giving the support. */
  fromArtistId: z.string(),
  /** Target artist (project owner or supported artist). */
  artistId: z.string(),
  projectId: z.string().optional(),
  createdAt: z.string(),
});

export type Support = z.infer<typeof SupportSchema>;

export function supportsForProject(
  supports: Support[],
  projectId: string,
): Support[] {
  return supports.filter(
    (s) => s.kind === "project" && s.projectId === projectId,
  );
}

export function supportsForArtist(
  supports: Support[],
  artistId: string,
): Support[] {
  return supports.filter(
    (s) => s.kind === "artist" && s.artistId === artistId,
  );
}

export function supportCount(
  supports: Support[],
  projectId: string,
): number {
  return supportsForProject(supports, projectId).length;
}

export function fundingPercent(project: Pick<Project, "goal" | "raised">): number {
  if (project.goal <= 0) return 0;
  return Math.min(100, Math.round((project.raised / project.goal) * 100));
}

export function artistFundingPercent(
  artist: Pick<Artist, "artistGoal" | "artistRaised">,
): number {
  if (artist.artistGoal <= 0) return 0;
  return Math.min(
    100,
    Math.round((artist.artistRaised / artist.artistGoal) * 100),
  );
}

/** Investor-facing artist analytics contract (API + catalog fallback). */
export const TrustLevelSchema = z.enum([
  "emerging",
  "established",
  "trusted",
]);
export type TrustLevel = z.infer<typeof TrustLevelSchema>;

export const TrustFactorSchema = z.object({
  id: z.string(),
  label: z.string(),
  weight: z.number().min(0).max(1),
  score: z.number().min(0).max(100),
  note: z.string().optional(),
});
export type TrustFactor = z.infer<typeof TrustFactorSchema>;

export const ArtistAnalyticsSchema = z.object({
  artistId: z.string(),
  source: z.enum(["catalog", "api"]),
  updatedAt: z.string(),
  trust: z.object({
    score: z.number().min(0).max(100),
    level: TrustLevelSchema,
    factors: z.array(TrustFactorSchema),
  }),
  metrics: z.object({
    /** null until event tracking exists */
    profileViews: z.number().int().nonnegative().nullable(),
    projectViews: z.number().int().nonnegative().nullable(),
    uniqueInvestors: z.number().int().nonnegative(),
    totalRaised: z.number().int().nonnegative(),
    totalGoal: z.number().int().nonnegative(),
    fundingPercent: z.number().min(0).max(100),
    activeProjects: z.number().int().nonnegative(),
    fundedProjects: z.number().int().nonnegative(),
    artistSupports: z.number().int().nonnegative(),
    spotifyFollowers: z.number().int().nonnegative().nullable(),
  }),
  series: z.object({
    views30d: z.array(z.number()).nullable(),
    funding30d: z.array(z.number()).nullable(),
  }),
});

export type ArtistAnalytics = z.infer<typeof ArtistAnalyticsSchema>;

export function trustLevelFromScore(score: number): TrustLevel {
  if (score >= 70) return "trusted";
  if (score >= 40) return "established";
  return "emerging";
}
