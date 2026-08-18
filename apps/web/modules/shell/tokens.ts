export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  screen: 20,
  cardGap: 16,
} as const;

/** House void nebula — antiq.xyz black + cool neon blue. */
export const VOID_PALETTE = {
  bg: "#000000",
  a: "#0B1C33",
  b: "#041018",
  c: "#163A5C",
} as const;

/**
 * Wash tempo/scale — same contract as Zero VOID_FIELD.
 * Faster than cards; mostly flat dark surface.
 */
export const VOID_FIELD = {
  speed: 1.2,
  washRefAspect: 1.4,
  maxDpr: 1,
  fps: 30,
} as const;

export function formatMoney(amount: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Light palette tint for glass over the page wash. */
export function paletteTint(hex: string, alpha: number): string {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(0,0,0,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
