"use client";

import { fundingPercent } from "@antiq/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/modules/data/store";
import { ArtistResultRow } from "./artist-result-row";
import { DiscoverSearch } from "./discover-search";
import {
  discoverResults,
  type CategoryFilter,
  type SearchScope,
} from "./filter-projects";
import { SearchMiniCard } from "./search-mini-card";

/**
 * Search — glass chrome, category swimlane, default Explore Projects grid.
 */
export function DiscoverSearchPage() {
  const { projects, artists, getArtist, projectSupportCount } = useStore();
  const [scope, setScope] = useState<SearchScope>("projects");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [subcategory, setSubcategory] = useState<string | "all">("all");
  const { user } = useAuth();

  const { artists: matchedArtists, projects: filtered } = useMemo(
    () =>
      discoverResults(
        projects,
        artists,
        { query, category, subcategory, scope },
        getArtist,
      ),
    [projects, artists, query, category, subcategory, scope, getArtist],
  );

  const exploreProjects = useMemo(() => {
    const listed = projects.filter(
      (p) => p.listedForFunding && p.status === "open",
    );
    return [...listed].sort((a, b) => {
      const supportDiff =
        projectSupportCount(b.id) - projectSupportCount(a.id);
      if (supportDiff !== 0) return supportDiff;
      const pctDiff = fundingPercent(b) - fundingPercent(a);
      if (pctDiff !== 0) return pctDiff;
      return b.raised - a.raised;
    });
  }, [projects, projectSupportCount]);

  function handleScope(next: SearchScope) {
    setScope(next);
    if (next === "artists") {
      setSubcategory("all");
    }
  }

  const searching = query.trim().length > 0;
  const filtering =
    scope === "projects" && (category !== "all" || subcategory !== "all");
  const artistFiltering = scope === "artists" && category !== "all";

  /** Default discovery when not actively searching/filtering projects. */
  const showExplore =
    scope === "projects" && !searching && category === "all" && subcategory === "all";

  const showProjectResults =
    scope === "projects" && (searching || filtering) && !showExplore;

  const showArtistResults = scope === "artists";

  const emptyProjects =
    showProjectResults && filtered.length === 0;
  const emptyArtists =
    showArtistResults &&
    matchedArtists.length === 0 &&
    (searching || artistFiltering);
  const emptyArtistExplore =
    showArtistResults &&
    !searching &&
    !artistFiltering &&
    matchedArtists.length === 0;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Deep smoky blue wash behind search chrome */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#0B1C33]/80 via-[#041018]/40 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-content flex-1 flex-col overflow-hidden pt-[max(12px,env(safe-area-inset-top))] lg:pt-6">
        <div className="shrink-0 px-5 pb-3 lg:px-8">
          <DiscoverSearch
            scope={scope}
            onScope={handleScope}
            query={query}
            onQuery={setQuery}
            category={category}
            subcategory={subcategory}
            onCategory={setCategory}
            onSubcategory={setSubcategory}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-6 [-webkit-overflow-scrolling:touch] lg:px-8 lg:pb-10">
          {/* 4. Default explore / results */}
          {showExplore ? (
            <section className="animate-fade-in">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="voice text-[10px] text-tertiary">
                  Explore projects
                </h2>
                <span className="voice text-[9px] text-tertiary/70">
                  {exploreProjects.length} open
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                {exploreProjects.map((project) => (
                  <SearchMiniCard
                    key={project.id}
                    project={project}
                    artistName={
                      getArtist(project.artistId)?.name ?? "Artist"
                    }
                  />
                ))}
              </div>
              {exploreProjects.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-[13px] text-muted">No open funding yet</p>
                  {user?.role === "artist" ? (
                    <Link
                      href="/profile"
                      className="voice mt-4 text-[11px] text-accent"
                    >
                      Add a project →
                    </Link>
                  ) : (
                    <Link
                      href="/register"
                      className="voice mt-4 text-[11px] text-accent"
                    >
                      Create account →
                    </Link>
                  )}
                </div>
              ) : null}
            </section>
          ) : null}

          {showProjectResults ? (
            <section className="animate-fade-in">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="voice text-[10px] text-tertiary">Results</h2>
                <span className="voice text-[9px] text-tertiary/70">
                  {filtered.length}
                </span>
              </div>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  {filtered.map((project) => (
                    <SearchMiniCard
                      key={project.id}
                      project={project}
                      artistName={
                        getArtist(project.artistId)?.name ?? "Artist"
                      }
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {showArtistResults ? (
            <section className="animate-fade-in">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="voice text-[10px] text-tertiary">
                  {searching || artistFiltering ? "Artists" : "Explore artists"}
                </h2>
                <span className="voice text-[9px] text-tertiary/70">
                  {matchedArtists.length}
                </span>
              </div>
              {matchedArtists.length > 0 ? (
                <div className="flex flex-col gap-2 lg:mx-auto lg:max-w-2xl">
                  {matchedArtists.map((artist) => (
                    <ArtistResultRow key={artist.id} artist={artist} />
                  ))}
                </div>
              ) : null}
              {emptyArtistExplore ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-[13px] text-muted">No artists yet</p>
                  {user?.role === "artist" ? (
                    <Link
                      href="/profile"
                      className="voice mt-4 text-[11px] text-accent"
                    >
                      Add a project →
                    </Link>
                  ) : (
                    <Link
                      href="/register"
                      className="voice mt-4 text-[11px] text-accent"
                    >
                      Create account →
                    </Link>
                  )}
                </div>
              ) : null}
            </section>
          ) : null}

          {emptyProjects || emptyArtists ? (
            <p className="py-10 text-center text-[13px] text-muted">
              No matches
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
