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
  /** Profile photo URL. */
  avatarUrl: z.string().url().optional(),
  /** Profile banner / cover URL. */
  bannerUrl: z.string().url().optional(),
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
  /** Artist-chosen cover image URL (Discover / detail hero). */
  coverUrl: z.string().url().optional(),
  previewSeconds: z.number().int().positive().optional(),
  snippetLabel: z.string().optional(),
  /** Short investor-facing return description. */
  returnModel: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

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
