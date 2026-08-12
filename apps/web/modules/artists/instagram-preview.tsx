"use client";

type Props = {
  profileUrl: string;
  /** Public Instagram post or reel permalinks. */
  posts?: string[];
  handle?: string;
};

function toEmbedSrc(permalink: string): string | null {
  try {
    const u = new URL(permalink);
    if (!u.hostname.includes("instagram.com")) return null;
    // /p/CODE/ or /reel/CODE/
    const parts = u.pathname.split("/").filter(Boolean);
    const kind = parts[0];
    const code = parts[1];
    if (!code || (kind !== "p" && kind !== "reel")) return null;
    return `https://www.instagram.com/${kind}/${code}/embed`;
  } catch {
    return null;
  }
}

function handleFromProfile(url: string): string | undefined {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[0];
  } catch {
    return undefined;
  }
}

/**
 * Real Instagram embeds via official post iframes (no Meta Graph / no mock grid).
 */
export function InstagramPreviewCard({
  profileUrl,
  posts = [],
  handle,
}: Props) {
  const displayHandle = handle ?? handleFromProfile(profileUrl) ?? "instagram";
  const embeds = posts
    .map((p) => ({ url: p, src: toEmbedSrc(p) }))
    .filter((x): x is { url: string; src: string } => Boolean(x.src))
    .slice(0, 3);

  return (
    <div className="overflow-hidden rounded-surface border border-white/[0.06] bg-black/40">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] text-ink"
          style={{
            background:
              "linear-gradient(135deg, #f58529, #dd2a7b 45%, #8134af)",
            padding: 2,
          }}
        >
          <span className="flex h-full w-full items-center justify-center rounded-full bg-bg text-[10px]">
            IG
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="voice text-[9px] tracking-[0.12em] text-[#E1306C]">
            INSTAGRAM
          </p>
          <p className="truncate text-[13px] font-medium text-ink">
            @{displayHandle}
          </p>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="voice shrink-0 text-[10px] text-muted"
        >
          Open
        </a>
      </div>

      {embeds.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-white/[0.06] p-2">
          {embeds.map((post) => (
            <iframe
              key={post.url}
              title="Instagram post"
              src={post.src}
              className="w-full rounded-soft border-0 bg-black"
              style={{ minHeight: 420 }}
              loading="lazy"
              allow="encrypted-media"
            />
          ))}
        </div>
      ) : (
        <div className="border-t border-white/[0.06] px-3 py-4">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="voice inline-flex h-10 items-center justify-center rounded-full bg-accent px-4 text-[11px] text-bg"
          >
            Open Instagram
          </a>
        </div>
      )}
    </div>
  );
}
