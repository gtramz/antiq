"use client";

import Image from "next/image";
import { useState } from "react";
import { isLocalMediaUrl } from "@/lib/read-local-image";
import { initialsFromName } from "@/modules/discover/initials";
import { paletteTint } from "@/modules/shell/tokens";

type Props = {
  name: string;
  tint: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-10 w-10 text-[11px]",
  lg: "h-[88px] w-[88px] text-[22px]",
} as const;

/**
 * Circular artist avatar — photo when available, else initials + palette tint.
 */
export function Avatar({
  name,
  tint,
  src,
  size = "sm",
  className = "",
}: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const local = isLocalMediaUrl(src);

  return (
    <span
      className={`avatar relative flex items-center justify-center overflow-hidden text-accent ${SIZE[size]} ${className}`}
      style={
        showImage
          ? {
              border: "2px solid rgba(255,255,255,0.12)",
              backgroundColor: "#050505",
            }
          : {
              backgroundColor: paletteTint(tint, 0.35),
              border: "1px solid rgba(255,255,255,0.1)",
            }
      }
    >
      {showImage ? (
        local ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Image
            src={src!}
            alt=""
            fill
            sizes={size === "lg" ? "88px" : "40px"}
            className="object-cover"
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <span className="voice">{initialsFromName(name)}</span>
      )}
    </span>
  );
}
