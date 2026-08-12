/** Stable 0..1 seed from an arbitrary string (project id, palette, etc.). */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** Prefer explicit id; else hash palette hexes for a stable look. */
export function resolveNebulaSeed(
  seed?: string | null,
  colors?: {
    bg?: string | null;
    a?: string | null;
    b?: string | null;
    c?: string | null;
  } | null,
): number {
  if (seed && seed.length > 0) return hashSeed(seed);
  const key = [
    colors?.bg ?? "",
    colors?.a ?? "",
    colors?.b ?? "",
    colors?.c ?? "",
  ].join("|");
  if (key === "|||") return 0.37;
  return hashSeed(key);
}
