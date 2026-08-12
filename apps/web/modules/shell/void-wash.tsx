"use client";

import { NebulaField } from "./nebula-field";
import { VOID_FIELD, VOID_PALETTE } from "./tokens";

/** Full-screen house nebula — cheap wash (throttled WebGL). */
export function VoidWash() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden
      style={{ transform: "translateZ(0)" }}
    >
      <NebulaField
        colors={VOID_PALETTE}
        seed="tabs"
        speed={VOID_FIELD.speed}
        refAspect={VOID_FIELD.washRefAspect}
        maxDpr={VOID_FIELD.maxDpr}
        fps={VOID_FIELD.fps}
      />
    </div>
  );
}
