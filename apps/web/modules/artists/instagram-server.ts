/** Server-only Instagram Graph API (Business Discovery) helpers. */

import type {
  InstagramMediaItem,
  InstagramMediaType,
  InstagramProfilePayload,
} from "@/modules/artists/instagram-types";

export {
  normalizeInstagramProfileUrl,
  usernameFromInstagramUrl,
} from "@/modules/artists/instagram-url";

const GRAPH_VERSION = "v21.0";

export function instagramConfigured(): boolean {
  return Boolean(
    process.env.META_ACCESS_TOKEN?.trim() &&
      process.env.META_IG_BUSINESS_ID?.trim(),
  );
}

type GraphMediaNode = {
  id: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
};

type GraphDiscovery = {
  business_discovery?: {
    username?: string;
    name?: string;
    biography?: string;
    profile_picture_url?: string;
    followers_count?: number;
    media_count?: number;
    media?: { data?: GraphMediaNode[] };
  };
  error?: { message?: string; code?: number; error_subcode?: number };
};

function mapMediaType(raw: string | undefined): InstagramMediaType {
  if (raw === "VIDEO") return "VIDEO";
  if (raw === "CAROUSEL_ALBUM") return "CAROUSEL_ALBUM";
  return "IMAGE";
}

/**
 * Fetch another Professional account's public profile + recent media
 * via Business Discovery (requires our IG business id + access token).
 */
export async function fetchBusinessDiscovery(
  username: string,
): Promise<
  | { ok: true; profile: InstagramProfilePayload }
  | { ok: false; status: number; error: string; code?: string }
> {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  const igBusinessId = process.env.META_IG_BUSINESS_ID?.trim();
  if (!token || !igBusinessId) {
    return {
      ok: false,
      status: 503,
      error: "Instagram credentials not configured",
      code: "NO_CREDENTIALS",
    };
  }

  const fields = [
    "username",
    "name",
    "biography",
    "profile_picture_url",
    "followers_count",
    "media_count",
    "media.limit(12){id,media_type,media_url,thumbnail_url,permalink,caption}",
  ].join(",");

  const url = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/${igBusinessId}`,
  );
  url.searchParams.set(
    "fields",
    `business_discovery.username(${username}){${fields}}`,
  );
  url.searchParams.set("access_token", token);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 600 },
    });
    const json = (await res.json()) as GraphDiscovery;

    if (!res.ok || json.error) {
      const message = json.error?.message ?? "Instagram fetch failed";
      const status =
        res.status === 400 || message.toLowerCase().includes("invalid user")
          ? 404
          : res.status >= 400
            ? res.status
            : 502;
      return { ok: false, status, error: message };
    }

    const disc = json.business_discovery;
    if (!disc?.username) {
      return {
        ok: false,
        status: 404,
        error:
          "Profile not found. Instagram account must be Professional (Creator/Business).",
      };
    }

    const media: InstagramMediaItem[] = (disc.media?.data ?? [])
      .filter((m) => m.id && m.permalink)
      .map((m) => ({
        id: m.id,
        mediaType: mapMediaType(m.media_type),
        mediaUrl: m.media_url,
        thumbnailUrl: m.thumbnail_url,
        permalink: m.permalink!,
        caption: m.caption,
      }));

    return {
      ok: true,
      profile: {
        username: disc.username,
        name: disc.name,
        biography: disc.biography,
        profilePictureUrl: disc.profile_picture_url,
        followersCount: disc.followers_count,
        mediaCount: disc.media_count,
        externalUrl: `https://www.instagram.com/${disc.username}/`,
        media,
      },
    };
  } catch {
    return { ok: false, status: 502, error: "Instagram request error" };
  }
}
