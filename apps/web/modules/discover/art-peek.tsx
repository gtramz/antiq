import type { Palette } from "@antiq/types";
import { seedUnit } from "./initials";

type Props = {
  palette: Palette;
  seed: string;
  className?: string;
  /** Larger hero composition. */
  hero?: boolean;
  label?: string;
};

function isNearBlack(hex: string): boolean {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return false;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r + g + b < 36;
}

/**
 * Static CSS “cover / work” peek from palette + seed — not WebGL nebula.
 */
export function ArtPeek({
  palette,
  seed,
  className = "",
  hero,
  label,
}: Props) {
  const u = seedUnit(seed);
  const rot = Math.round(u * 40 - 20);
  const shiftX = Math.round((u * 30 - 15) * (hero ? 2 : 1));
  const shiftY = Math.round(((1 - u) * 24 - 12) * (hero ? 2 : 1));
  /** Hero never sits on pure black — use accent wash as base. */
  const base =
    hero && isNearBlack(palette.bg) ? palette.a : palette.bg;
  const mid =
    hero && isNearBlack(palette.bg) ? palette.b : palette.bg;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: base }}
      aria-hidden={!label}
    >
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        style={{
          background: `linear-gradient(145deg, ${palette.a} 0%, ${mid} 42%, ${palette.c} 100%)`,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: hero ? "58%" : "70%",
          height: hero ? "72%" : "68%",
          left: `calc(18% + ${shiftX}px)`,
          top: `calc(12% + ${shiftY}px)`,
          background: `linear-gradient(160deg, ${palette.b}cc, ${palette.a}88)`,
          transform: `rotate(${rot}deg)`,
          boxShadow: `0 12px 40px ${base}aa`,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: hero ? "36%" : "42%",
          height: hero ? "28%" : "32%",
          right: hero ? "8%" : "6%",
          bottom: hero ? "14%" : "10%",
          backgroundColor: palette.c,
          opacity: 0.85,
          mixBlendMode: "screen",
          transform: `rotate(${-rot * 0.6}deg)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.08) 3px, rgba(255,255,255,0.08) 4px)",
        }}
      />
      {label ? (
        <span className="voice absolute bottom-2 left-2 z-10 text-[9px] text-ink/80 text-veil">
          {label}
        </span>
      ) : null}
    </div>
  );
}
