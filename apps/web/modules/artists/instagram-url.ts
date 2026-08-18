/** Client-safe Instagram profile URL helpers. */

/** Extract username from profile URL or @handle. */
export function usernameFromInstagramUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const at = value.match(/^@?([a-zA-Z0-9._]{1,30})$/);
  if (at?.[1] && !value.includes("/")) return at[1].toLowerCase();

  try {
    const withProto = value.startsWith("http")
      ? value
      : `https://${value.replace(/^\/+/, "")}`;
    const u = new URL(withProto);
    if (!u.hostname.includes("instagram.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const first = parts[0];
    if (!first) return null;
    if (
      ["p", "reel", "reels", "stories", "explore", "accounts"].includes(first)
    ) {
      return null;
    }
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(first)) return null;
    return first.toLowerCase();
  } catch {
    return null;
  }
}

export function normalizeInstagramProfileUrl(raw: string): string | undefined {
  const username = usernameFromInstagramUrl(raw);
  if (!username) return undefined;
  return `https://www.instagram.com/${username}/`;
}
