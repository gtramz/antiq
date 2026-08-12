"use client";

import { useEffect, useState } from "react";
import {
  filterSummary,
  type CategoryFilter,
  type SearchScope,
} from "./filter-projects";
import {
  CATEGORY_IDS,
  TAXONOMY,
  type CategoryId,
  subsFor,
} from "./taxonomy";

type Props = {
  scope: SearchScope;
  onScope: (s: SearchScope) => void;
  query: string;
  onQuery: (q: string) => void;
  category: CategoryFilter;
  subcategory: string | "all";
  onCategory: (c: CategoryFilter) => void;
  onSubcategory: (s: string | "all") => void;
};

/**
 * Glass search chrome: scope pill, translucent bar + Filter, category swimlane.
 */
export function DiscoverSearch({
  scope,
  onScope,
  query,
  onQuery,
  category,
  subcategory,
  onCategory,
  onSubcategory,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasFilter = category !== "all" || subcategory !== "all";
  const summary = filterSummary(category, subcategory);
  const subOptions = category === "all" ? [] : subsFor(category);

  useEffect(() => {
    if (scope === "artists") setFiltersOpen(false);
  }, [scope]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  function pickCategory(id: CategoryFilter) {
    onCategory(id);
    onSubcategory("all");
  }

  function pickSub(sub: string) {
    onSubcategory(sub);
    setFiltersOpen(false);
  }

  const placeholder =
    scope === "artists" ? "Search artists" : "Search projects";

  return (
    <div className="relative z-40 shrink-0 space-y-3">
      {/* 1. Pill scope toggle */}
      <div className="mx-auto flex h-10 w-full max-w-xs items-stretch overflow-hidden rounded-full border border-white/10 bg-black/20 p-0.5 backdrop-blur-md">
        {(
          [
            { id: "artists" as const, label: "Artists" },
            { id: "projects" as const, label: "Projects" },
          ] as const
        ).map((opt) => {
          const active = scope === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onScope(opt.id)}
              className={`voice flex-1 rounded-full text-[10px] transition ${
                active
                  ? "bg-white/10 text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                  : "text-muted hover:text-ink/80"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 2. Search bar + Filter */}
      <div className="relative">
        <div className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-4 pr-1.5 backdrop-blur-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="h-4 w-4 shrink-0 text-tertiary"
            aria-hidden
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 20 20" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-tertiary/80"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQuery("")}
              className="shrink-0 px-1.5 text-[14px] text-muted"
            >
              ×
            </button>
          ) : null}
          {scope === "projects" ? (
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-label={hasFilter ? `Filter: ${summary}` : "Filters"}
              title={summary}
              className={`voice flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-[10px] transition ${
                hasFilter || filtersOpen
                  ? "bg-white/10 text-accent"
                  : "text-tertiary hover:text-muted"
              }`}
            >
              <span className="max-w-[5.5rem] truncate">
                {hasFilter && subcategory !== "all" ? summary : "Filter"}
              </span>
              <span aria-hidden>{filtersOpen ? "▴" : "▾"}</span>
            </button>
          ) : null}
        </div>

        {scope === "projects" && filtersOpen ? (
          <>
            <button
              type="button"
              aria-label="Close filters"
              className="fixed inset-0 z-40 bg-black/50 animate-fade-in backdrop-blur-[2px]"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[42dvh] overflow-y-auto overscroll-contain rounded-[24px] border border-white/10 bg-[#0B1C33]/90 px-3 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.55)] animate-expand-in backdrop-blur-md">
              <p className="voice mb-2 text-[9px] text-tertiary">Genre</p>
              {category === "all" ? (
                <p className="px-1 py-2 text-[12px] text-muted">
                  Pick a category below, then refine by genre.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    label="All"
                    active={subcategory === "all"}
                    onClick={() => {
                      onSubcategory("all");
                      setFiltersOpen(false);
                    }}
                  />
                  {subOptions.map((sub) => (
                    <Chip
                      key={sub}
                      label={sub}
                      active={subcategory === sub}
                      onClick={() => pickSub(sub)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* 3. Category swimlane */}
      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:-mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Categories"
      >
        <SwimChip
          label="All"
          active={category === "all"}
          onClick={() => pickCategory("all")}
        />
        {CATEGORY_IDS.map((id) => (
          <SwimChip
            key={id}
            label={TAXONOMY[id].label}
            active={category === id}
            onClick={() => pickCategory(id as CategoryId)}
          />
        ))}
      </div>
    </div>
  );
}

function SwimChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={`voice h-8 shrink-0 rounded-full border px-3.5 text-[10px] transition ${
        active
          ? "border-accent/40 bg-accent/20 text-ink backdrop-blur-md"
          : "border-white/10 bg-black/20 text-muted backdrop-blur-md hover:border-white/20 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`voice h-8 rounded-full border px-2.5 text-[10px] ${
        active
          ? "border-accent/40 bg-white/10 text-accent"
          : "border-white/10 bg-black/20 text-muted"
      }`}
    >
      {label}
    </button>
  );
}
