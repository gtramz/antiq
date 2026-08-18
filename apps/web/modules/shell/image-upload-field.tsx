"use client";

import { useRef, useState } from "react";
import { readLocalImage } from "@/lib/read-local-image";

type Props = {
  label: string;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  /** Aspect hint for the preview box. */
  aspect?: "square" | "wide";
  optional?: boolean;
  disabled?: boolean;
};

/**
 * Local photo picker — file input + preview. No URL paste.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  aspect = "square",
  optional = true,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (JPG, PNG, WebP…)");
      return;
    }
    // ~4MB soft limit — data URLs live in memory.
    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be under 4 MB");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readLocalImage(file);
      if (!dataUrl) {
        setError("Could not read that image");
        return;
      }
      onChange(dataUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="voice text-[9px] tracking-[0.08em] text-tertiary uppercase">
          {label}
          {optional ? " (optional)" : ""}
        </span>
        {value ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => {
              onChange(undefined);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="voice text-[9px] text-muted hover:text-ink disabled:opacity-50"
          >
            Remove
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => {
          void onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className={`mt-1.5 relative flex w-full items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-white/15 bg-black/35 transition hover:border-white/25 disabled:opacity-55 ${
          aspect === "wide" ? "aspect-[16/9]" : "aspect-square max-h-44"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="px-4 text-center">
            <span className="voice block text-[11px] text-ink">
              {busy ? "Reading…" : "Upload photo"}
            </span>
            <span className="mt-1 block text-[12px] text-muted">
              Tap to choose from your device
            </span>
          </span>
        )}
        {value ? (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-center">
            <span className="voice text-[10px] text-ink">Change photo</span>
          </span>
        ) : null}
      </button>

      {error ? (
        <p className="mt-1.5 text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
