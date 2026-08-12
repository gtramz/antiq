/** Music-only taxonomy: role (category) → genres (subs). */
export const GENRES = [
  "Pop",
  "Electronic",
  "Folk",
  "Hip-Hop",
  "Jazz",
  "Latin",
  "Ambient",
  "R&B",
  "Rock",
] as const;

export const CATEGORY_IDS = [
  "vocalist",
  "producer",
  "songwriter",
  "composer",
  "dj",
  "band",
  "instrumentalist",
  "engineer",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type CategoryDef = {
  id: CategoryId;
  label: string;
  /** Genres available under this role. */
  subs: readonly string[];
};

export const TAXONOMY: Record<CategoryId, CategoryDef> = {
  vocalist: { id: "vocalist", label: "Vocalist", subs: GENRES },
  producer: { id: "producer", label: "Producer", subs: GENRES },
  songwriter: { id: "songwriter", label: "Songwriter", subs: GENRES },
  composer: { id: "composer", label: "Composer", subs: GENRES },
  dj: { id: "dj", label: "DJ", subs: GENRES },
  band: { id: "band", label: "Band", subs: GENRES },
  instrumentalist: {
    id: "instrumentalist",
    label: "Instrumentalist",
    subs: GENRES,
  },
  engineer: { id: "engineer", label: "Engineer", subs: GENRES },
};

export function categoryLabel(id: CategoryId | string): string {
  if (id in TAXONOMY) return TAXONOMY[id as CategoryId].label;
  return id;
}

export function subsFor(category: CategoryId | "all"): readonly string[] {
  if (category === "all") return [];
  return TAXONOMY[category].subs;
}
