export type BubblePalette = {
  bg: string;
  a: string;
  b: string;
  c: string;
};

/** Loose input from API nullables. */
export type BubblePaletteInput = {
  [K in keyof BubblePalette]?: string | null;
};

export const DEFAULT_BUBBLE_PALETTE: BubblePalette = {
  bg: "#050505",
  a: "#C4A574",
  b: "#E8E4D9",
  c: "#5A4628",
};

export function resolvePalette(
  colors?: BubblePaletteInput | null,
): BubblePalette {
  return {
    bg: colors?.bg || DEFAULT_BUBBLE_PALETTE.bg,
    a: colors?.a || DEFAULT_BUBBLE_PALETTE.a,
    b: colors?.b || DEFAULT_BUBBLE_PALETTE.b,
    c: colors?.c || DEFAULT_BUBBLE_PALETTE.c,
  };
}

/** Parse #RGB / #RRGGBB → [r,g,b] in 0..1. */
export function hexToRgb01(hex: string): [number, number, number] {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return [0.02, 0.02, 0.02];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
