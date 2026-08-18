"use client";

import type { Artist, ArtistAnalytics, Pledge, Project } from "@antiq/types";
import { useEffect, useMemo, useState } from "react";
import type { ArtistAnalyticsSnapshot } from "@/lib/artist-analytics";
import { formatMoney } from "@/modules/shell/tokens";
import { getArtistAnalytics } from "@/services/analyticsService";

type Props = {
  artist: Artist;
  projects: Project[];
  pledges: Pledge[];
  artistSupports: number;
  projectSupports: number;
};

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

async function fetchSpotifyFollowers(
  spotifyUrl?: string,
): Promise<number | null> {
  if (!spotifyUrl?.trim()) return null;
  try {
    const res = await fetch(
      `/api/spotify/artist?url=${encodeURIComponent(spotifyUrl.trim())}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { followers?: number };
    return typeof data.followers === "number" ? data.followers : null;
  } catch {
    return null;
  }
}

function trustLabel(level: ArtistAnalytics["trust"]["level"]): string {
  if (level === "trusted") return "Trusted";
  if (level === "established") return "Established";
  return "Emerging";
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const w = 240;
  const h = 48;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-12 w-full text-accent"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

/**
 * Public artist analytics — trust + KPIs from analyticsService.
 */
export function ArtistAnalyticsPanel({
  artist,
  projects,
  pledges,
  artistSupports,
  projectSupports,
}: Props) {
  const [data, setData] = useState<ArtistAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseSnapshot = useMemo((): Omit<
    ArtistAnalyticsSnapshot,
    "spotifyFollowers"
  > => {
    return {
      artist: {
        id: artist.id,
        name: artist.name,
        bio: artist.bio,
        avatarUrl: artist.avatarUrl,
        bannerUrl: artist.bannerUrl,
        socials: artist.socials,
        artistRaised: artist.artistRaised,
        artistGoal: artist.artistGoal,
      },
      projects: projects.map((p) => ({
        id: p.id,
        status: p.status,
        listedForFunding: p.listedForFunding,
        goal: p.goal,
        raised: p.raised,
      })),
      pledges: pledges.map((pl) => ({
        id: pl.id,
        kind: pl.kind,
        artistId: pl.artistId,
        projectId: pl.projectId,
        amount: pl.amount,
      })),
      artistSupports,
      projectSupports,
    };
  }, [artist, projects, pledges, artistSupports, projectSupports]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const followers = await fetchSpotifyFollowers(artist.socials.spotify);
      if (cancelled) return;
      try {
        const analytics = await getArtistAnalytics(artist.id, {
          ...baseSnapshot,
          spotifyFollowers: followers,
        });
        if (!cancelled) {
          setData(analytics);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load analytics",
          );
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [artist.id, artist.socials.spotify, baseSnapshot]);

  if (loading && !data) {
    return (
      <div className="rounded-surface border border-white/10 bg-black/20 px-5 py-12 text-center text-[13px] text-muted backdrop-blur-xl">
        Loading analytics…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-surface border border-danger/30 bg-danger/10 px-5 py-8 text-center text-[13px] text-danger">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { trust, metrics, series, source } = data;
  const ring = `conic-gradient(#7eb8ff ${trust.score}%, rgba(255,255,255,0.08) 0)`;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="voice text-[11px] tracking-[0.12em] text-muted uppercase">
            Performance
          </p>
          <p className="mt-1 text-[13px] text-tertiary">
            Source · {source === "api" ? "Live API" : "Catalog signals"}
          </p>
        </div>
        <p className="voice text-[9px] text-tertiary">
          Updated {new Date(data.updatedAt).toLocaleString()}
        </p>
      </div>

      <section className="rounded-surface border border-white/10 bg-[rgba(8,18,36,0.55)] p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="relative mx-auto flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full sm:mx-0"
            style={{ background: ring }}
          >
            <div className="flex h-[96px] w-[96px] flex-col items-center justify-center rounded-full bg-[rgba(8,18,36,0.95)]">
              <span className="font-sans text-[28px] font-bold tabular-nums text-ink">
                {trust.score}
              </span>
              <span className="voice text-[9px] text-tertiary">Trust</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="voice text-[10px] tracking-[0.1em] text-accent uppercase">
              {trustLabel(trust.level)}
            </p>
            <h3 className="mt-1 font-sans text-[22px] font-bold tracking-[-0.03em] text-ink">
              Trust level
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Composite score from funding activity, artist support, profile
              completeness, and Spotify reach. Not a financial rating.
            </p>
          </div>
        </div>

        <ul className="mt-5 divide-y divide-white/8 border-t border-white/10">
          {trust.factors.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-4"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">{f.label}</p>
                {f.note ? (
                  <p className="mt-0.5 truncate text-[11px] text-tertiary">
                    {f.note}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular-nums text-[14px] font-semibold text-ink">
                  {f.score}
                </p>
                <p className="voice text-[9px] text-tertiary">
                  w {Math.round(f.weight * 100)}%
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi
          label="Total raised"
          value={formatMoney(metrics.totalRaised)}
        />
        <Kpi label="Funding %" value={`${metrics.fundingPercent}%`} accent />
        <Kpi label="Active projects" value={String(metrics.activeProjects)} />
        <Kpi label="Funded projects" value={String(metrics.fundedProjects)} />
        <Kpi
          label="Investor actions"
          value={String(metrics.uniqueInvestors)}
        />
        <Kpi
          label="Artist supports"
          value={String(metrics.artistSupports)}
        />
        <Kpi
          label="Profile views"
          value={
            metrics.profileViews == null
              ? "—"
              : formatCompact(metrics.profileViews)
          }
          hint={metrics.profileViews == null ? "Tracking coming online" : undefined}
        />
        <Kpi
          label="Project views"
          value={
            metrics.projectViews == null
              ? "—"
              : formatCompact(metrics.projectViews)
          }
          hint={metrics.projectViews == null ? "Tracking coming online" : undefined}
        />
        <Kpi
          label="Spotify followers"
          value={
            metrics.spotifyFollowers == null
              ? "—"
              : formatCompact(metrics.spotifyFollowers)
          }
          hint={
            metrics.spotifyFollowers == null ? "Link or credentials needed" : undefined
          }
        />
      </section>

      {series.views30d && series.views30d.length > 1 ? (
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="voice text-[9px] text-tertiary uppercase">
            Views · 30d
          </p>
          <div className="mt-2">
            <Sparkline values={series.views30d} />
          </div>
        </section>
      ) : null}

      {series.funding30d && series.funding30d.length > 1 ? (
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="voice text-[9px] text-tertiary uppercase">
            Funding · 30d
          </p>
          <div className="mt-2">
            <Sparkline values={series.funding30d} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3.5 py-3 backdrop-blur-md">
      <p className="voice text-[9px] tracking-[0.08em] text-tertiary uppercase">
        {label}
      </p>
      <p
        className={`mt-1 font-sans text-[18px] font-bold tabular-nums sm:text-[20px] ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}
