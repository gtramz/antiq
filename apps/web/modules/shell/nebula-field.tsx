"use client";

import {
  createNebulaRenderer,
  resolvePalette,
  type BubblePaletteInput,
  type NebulaRenderer,
} from "@antiq/nebula";
import { useEffect, useRef, useState } from "react";

type Props = {
  colors?: BubblePaletteInput | null;
  seed?: string | null;
  className?: string;
  active?: boolean;
  speed?: number;
  /** Borrow another viewport's domain scale (Zero wash uses 1.4). */
  refAspect?: number | null;
  /** Cap device pixel ratio (wash defaults low for perf). */
  maxDpr?: number;
  /** Target frames per second (default 30 for wash). */
  fps?: number;
};

function CssNebulaFallback({ colors }: { colors?: BubblePaletteInput | null }) {
  const p = resolvePalette(colors);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          left: "42%",
          top: "-40%",
          backgroundColor: p.a,
          opacity: 0.55,
          filter: "blur(48px)",
          animation: "antiq-nebula-drift 7.2s ease-in-out 0ms infinite alternate",
          ["--dx" as string]: "22px",
          ["--dy" as string]: "-16px",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 170,
          height: 170,
          left: "-28%",
          top: "8%",
          backgroundColor: p.b,
          opacity: 0.4,
          filter: "blur(48px)",
          animation: "antiq-nebula-drift 8s ease-in-out 400ms infinite alternate",
          ["--dx" as string]: "-20px",
          ["--dy" as string]: "18px",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 140,
          height: 140,
          left: "58%",
          top: "35%",
          backgroundColor: p.c,
          opacity: 0.48,
          filter: "blur(44px)",
          animation: "antiq-nebula-drift 7.6s ease-in-out 800ms infinite alternate",
          ["--dx" as string]: "18px",
          ["--dy" as string]: "-14px",
        }}
      />
    </div>
  );
}

/** Liquid Light Nebula — WebGL with CSS fallback. Tuned for cheap wash. */
export function NebulaField({
  colors,
  seed,
  className,
  active = true,
  speed = 1,
  refAspect = null,
  maxDpr = 0.75,
  fps = 30,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<NebulaRenderer | null>(null);
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  const seedRef = useRef(seed);
  seedRef.current = seed;
  const activeRef = useRef(active);
  activeRef.current = active;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const refAspectRef = useRef(refAspect);
  refAspectRef.current = refAspect;
  const maxDprRef = useRef(maxDpr);
  maxDprRef.current = maxDpr;
  const fpsRef = useRef(fps);
  fpsRef.current = fps;
  const [useFallback, setUseFallback] = useState(false);

  const palette = resolvePalette(colors);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const gl =
      canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: "low-power",
      }) ||
      (canvas.getContext("experimental-webgl", {
        alpha: false,
        antialias: false,
      }) as WebGLRenderingContext | null);

    if (!gl) {
      setUseFallback(true);
      return;
    }

    let renderer: NebulaRenderer;
    try {
      renderer = createNebulaRenderer(gl, {
        colors: colorsRef.current,
        seed: seedRef.current,
      });
    } catch {
      setUseFallback(true);
      return;
    }
    rendererRef.current = renderer;
    renderer.setSpeed(speedRef.current);
    renderer.setRefAspect(refAspectRef.current);
    setUseFallback(false);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, rect.width || 350);
      const h = Math.max(1, rect.height || 140);
      const dpr = Math.min(window.devicePixelRatio || 1, maxDprRef.current);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      renderer.setSize(w, h, dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let lastDraw = 0;
    const start = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!activeRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;
      const minDelta = 1000 / Math.max(1, fpsRef.current);
      if (now - lastDraw < minDelta) return;
      lastDraw = now;
      renderer.render((now - start) / 1000);
    };
    raf = requestAnimationFrame(tick);

    const onVis = () => {
      if (!document.hidden) lastDraw = 0;
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.setPalette(colors);
    rendererRef.current?.setSeed(seed);
  }, [colors?.bg, colors?.a, colors?.b, colors?.c, seed]);

  useEffect(() => {
    rendererRef.current?.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    rendererRef.current?.setRefAspect(refAspect ?? null);
  }, [refAspect]);

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={{ backgroundColor: palette.bg, transform: "translateZ(0)" }}
    >
      {useFallback ? <CssNebulaFallback colors={colors} /> : null}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute left-0 top-0"
        style={{
          display: useFallback ? "none" : "block",
          width: "100%",
          height: "100%",
          transform: "translateZ(0)",
          willChange: "transform",
        }}
        aria-hidden
      />
    </div>
  );
}
