"use client";

import { useEffect, useMemo, useState } from "react";
import { seedUnit } from "./initials";

type Props = {
  seed: string;
  durationSeconds?: number;
  label?: string;
};

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/**
 * Mock audio strip — CSS waveform + play toggle. No real audio files.
 */
export function AudioPreview({
  seed,
  durationSeconds = 45,
  label = "Preview",
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const bars = useMemo(() => {
    const base = seedUnit(seed);
    return Array.from({ length: 18 }, (_, i) => {
      const t = seedUnit(`${seed}-${i}`);
      return 0.25 + ((t + base) % 1) * 0.75;
    });
  }, [seed]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= durationSeconds) {
          setPlaying(false);
          return 0;
        }
        return e + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, durationSeconds]);

  return (
    <div
      className="glass-band flex h-11 items-center gap-2 rounded-full px-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={playing ? "Pause preview" : "Play preview"}
        onClick={(e) => {
          e.stopPropagation();
          setPlaying((p) => !p);
        }}
        className="voice flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] text-bg"
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <div className="flex h-7 flex-1 items-end gap-[2px]" aria-hidden>
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-accent/70 origin-bottom"
            style={{
              height: `${Math.round(h * 100)}%`,
              animation: playing
                ? `antiq-wave 0.9s ease-in-out ${i * 0.05}s infinite alternate`
                : undefined,
              opacity: playing ? 1 : 0.55,
            }}
          />
        ))}
      </div>

      <span className="voice shrink-0 text-[9px] text-muted tabular-nums">
        {formatTime(elapsed)}
      </span>
      <span className="voice hidden shrink-0 text-[9px] text-tertiary sm:inline">
        {label}
      </span>
    </div>
  );
}
