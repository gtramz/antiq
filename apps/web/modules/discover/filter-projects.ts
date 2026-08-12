import type { Artist, Project } from "@antiq/types";
import type { CategoryId } from "./taxonomy";
import { categoryLabel } from "./taxonomy";

export type CategoryFilter = CategoryId | "all";

export type SearchScope = "artists" | "projects";

export type ProjectFilter = {
  query: string;
  category: CategoryFilter;
  subcategory: string | "all";
  scope?: SearchScope;
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function wordsMatch(hay: string, query: string): boolean {
  const q = fold(query);
  if (!q) return true;
  const words = q.split(/\s+/).filter(Boolean);
  const foldedHay = fold(hay);
  return words.every((word) => foldedHay.includes(word));
}

/** Genre / name / title search — genres (subcategory) match first. */
function matchesProjectQuery(
  project: Project,
  artistName: string,
  query: string,
): boolean {
  const q = fold(query);
  if (!q) return true;

  const words = q.split(/\s+/).filter(Boolean);
  const genre = fold(project.subcategory);

  // "pop", "folk", "hip hop" → subcategory / genre
  if (genre) {
    if (genre === q) return true;
    if (q.length >= 2 && genre.startsWith(q)) return true;
    if (words.length > 0 && words.every((w) => genre.includes(w))) return true;
  }

  const hay = [
    project.title,
    project.pitch,
    project.format,
    project.snippetLabel ?? "",
    project.subcategory,
    artistName,
    categoryLabel(project.category),
    project.category,
  ].join(" ");

  return wordsMatch(hay, query);
}

/** AND: listed ∩ category ∩ subcategory ∩ text/genre query. */
export function filterProjects(
  projects: Project[],
  filter: ProjectFilter,
  getArtist: (id: string) => Artist | undefined,
): Project[] {
  const { category, subcategory, query } = filter;

  return projects.filter((p) => {
    if (!p.listedForFunding) return false;
    if (category !== "all" && p.category !== category) return false;
    if (subcategory !== "all" && p.subcategory !== subcategory) return false;
    const artist = getArtist(p.artistId)?.name ?? "";
    return matchesProjectQuery(p, artist, query);
  });
}

/**
 * Match artists by name, bio, and role.
 * Empty query returns all (optionally role-filtered) for browse / explore.
 */
export function filterArtists(
  artists: Artist[],
  query: string,
  category: CategoryFilter = "all",
): Artist[] {
  return artists.filter((a) => {
    if (category !== "all" && a.role !== category) return false;
    const q = fold(query);
    if (!q) return true;
    return wordsMatch(
      `${a.name} ${a.bio} ${categoryLabel(a.role)} ${a.role}`,
      query,
    );
  });
}

export type DiscoverResults = {
  artists: Artist[];
  projects: Project[];
};

/**
 * Scoped search: artists XOR projects.
 * Empty query still returns browse results (category-aware).
 */
export function discoverResults(
  projects: Project[],
  artists: Artist[],
  filter: ProjectFilter,
  getArtist: (id: string) => Artist | undefined,
): DiscoverResults {
  const scope = filter.scope ?? "projects";

  if (scope === "artists") {
    return {
      artists: filterArtists(artists, filter.query, filter.category),
      projects: [],
    };
  }

  return {
    artists: [],
    projects: filterProjects(projects, filter, getArtist),
  };
}

export function filterSummary(
  category: CategoryFilter,
  subcategory: string | "all",
): string {
  if (category === "all") return "All";
  const cat = categoryLabel(category);
  if (subcategory === "all") return cat;
  return `${cat} · ${subcategory}`;
}
