"use client";

import { useEffect, useState } from "react";
import type { InstagramProfilePayload } from "@/modules/artists/instagram-types";
import {
  normalizeInstagramProfileUrl,
  usernameFromInstagramUrl,
} from "@/modules/artists/instagram-url";

export { normalizeInstagramProfileUrl, usernameFromInstagramUrl };

type Props = {
  profileUrl: string;
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

type LoadState =
  | { mode: "loading" }
  | { mode: "api"; profile: InstagramProfilePayload }
  | {
      mode: "fallback";
      reason: "NO_CREDENTIALS" | "error" | "invalid";
      message?: string;
    };

/**
 * Connect Instagram card — Business Discovery profile header + 3-col media grid.
 */
export function InstagramProfileCard({ profileUrl }: Props) {
  const normalized = normalizeInstagramProfileUrl(profileUrl);
  const username = normalized
    ? usernameFromInstagramUrl(normalized)
    : null;
  const [state, setState] = useState<LoadState>({ mode: "loading" });

  useEffect(() => {
    if (!normalized || !username) {
      setState({ mode: "fallback", reason: "invalid" });
      return;
    }

    let cancelled = false;
    setState({ mode: "loading" });

    (async () => {
      try {
        const res = await fetch(
          `/api/instagram/profile?url=${encodeURIComponent(normalized)}`,
        );
        if (cancelled) return;

        if (res.ok) {
          const profile = (await res.json()) as InstagramProfilePayload;
          setState({ mode: "api", profile });
          return;
        }

        const body = (await res.json().catch(() => null)) as {
          code?: string;
          error?: string;
        } | null;

        if (res.status === 503 && body?.code === "NO_CREDENTIALS") {
          setState({ mode: "fallback", reason: "NO_CREDENTIALS" });
          return;
        }

        setState({
          mode: "fallback",
          reason: "error",
          message: body?.error,
        });
      } catch {
        if (!cancelled) {
          setState({ mode: "fallback", reason: "error" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [normalized, username]);

  if (!normalized || !username) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
        <p className="text-[13px] font-medium text-ink">Invalid Instagram link</p>
        <p className="mt-0.5 text-[11px] text-muted">
          Use https://instagram.com/username
        </p>
      </div>
    );
  }

  const href = normalized;
  const handle =
    state.mode === "api" ? state.profile.username : username;
  const avatar =
    state.mode === "api" ? state.profile.profilePictureUrl : undefined;
  const followers =
    state.mode === "api" ? state.profile.followersCount : undefined;
  const media = state.mode === "api" ? state.profile.media : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
      <div className="flex items-center gap-3 px-3 py-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{
            background:
              "linear-gradient(135deg, #f58529, #dd2a7b 45%, #8134af)",
            padding: 2,
          }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              className="h-full w-full rounded-full object-cover bg-bg"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-bg text-[10px] text-ink">
              IG
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="voice text-[9px] tracking-[0.12em] text-[#E1306C]/90">
            Instagram
          </p>
          <p className="truncate text-[14px] font-medium text-ink">@{handle}</p>
          {followers != null ? (
            <p className="mt-0.5 text-[11px] text-muted">
              {formatCount(followers)} followers
            </p>
          ) : state.mode === "loading" ? (
            <p className="mt-0.5 text-[11px] text-muted">Loading…</p>
          ) : null}
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="voice shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[10px] text-ink transition hover:border-white/30"
        >
          Open
        </a>
      </div>

      {state.mode === "loading" ? (
        <div className="grid grid-cols-3 gap-px border-t border-white/10 bg-white/5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse bg-white/[0.04]"
            />
          ))}
        </div>
      ) : null}

      {state.mode === "api" && media.length > 0 ? (
        <div className="grid grid-cols-3 gap-px border-t border-white/10 bg-white/5">
          {media.map((item) => {
            const thumb =
              item.mediaType === "VIDEO"
                ? item.thumbnailUrl ?? item.mediaUrl
                : item.mediaUrl ?? item.thumbnailUrl;
            return (
              <a
                key={item.id}
                href={item.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square bg-black/40 transition hover:opacity-90"
                title={item.caption?.slice(0, 80)}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] text-muted">
                    View
                  </span>
                )}
                {item.mediaType === "VIDEO" ? (
                  <span
                    className="absolute right-1.5 top-1.5 text-[10px] text-white drop-shadow"
                    aria-hidden
                  >
                    ▶
                  </span>
                ) : null}
                {item.mediaType === "CAROUSEL_ALBUM" ? (
                  <span
                    className="absolute right-1.5 top-1.5 text-[11px] text-white drop-shadow"
                    aria-hidden
                  >
                    ▦
                  </span>
                ) : null}
              </a>
            );
          })}
        </div>
      ) : null}

      {state.mode === "api" && media.length === 0 ? (
        <div className="border-t border-white/10 px-3 py-4">
          <p className="text-[12px] text-muted">No recent posts to show.</p>
        </div>
      ) : null}

      {state.mode === "fallback" ? (
        <div className="border-t border-white/10 px-3 py-4">
          <p className="text-[12px] text-muted">
            {state.reason === "NO_CREDENTIALS"
              ? "Add META_ACCESS_TOKEN and META_IG_BUSINESS_ID to enable the Instagram grid."
              : state.reason === "invalid"
                ? "Invalid Instagram profile URL."
                : state.message ??
                  "Couldn’t load this profile. It must be a Professional (Creator/Business) account."}
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="voice mt-3 inline-flex h-9 items-center justify-center rounded-full bg-accent px-4 text-[11px] text-bg"
          >
            Open Instagram
          </a>
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Prefer InstagramProfileCard (Business Discovery grid). */
export function InstagramPreviewCard({
  profileUrl,
}: {
  profileUrl: string;
  posts?: string[];
  handle?: string;
}) {
  return <InstagramProfileCard profileUrl={profileUrl} />;
}
