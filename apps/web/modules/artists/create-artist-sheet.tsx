"use client";

import type { CategoryId } from "@antiq/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/modules/data/store";
import { CATEGORY_IDS, categoryLabel } from "@/modules/discover/taxonomy";

const inputClass =
  "w-full rounded-[14px] border-0 bg-black/35 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-tertiary";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Bootstrap sheet — create the first (or next) artist profile.
 */
export function CreateArtistSheet({ open, onClose }: Props) {
  const { addArtist } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<CategoryId>("composer");
  const [goal, setGoal] = useState("100000");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setName("");
    setBio("");
    setRole("composer");
    setGoal("100000");
    setError(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const artistGoal = Number.parseInt(goal.replace(/[^\d]/g, ""), 10);
    if (!trimmed) {
      setError("Add an artist name");
      return;
    }
    if (!Number.isFinite(artistGoal) || artistGoal < 0) {
      setError("Enter a valid funding goal");
      return;
    }

    const artist = addArtist({
      name: trimmed,
      bio: bio.trim(),
      role,
      artistGoal,
    });
    if (!artist) {
      setError("Could not create artist");
      return;
    }
    onClose();
    router.push(`/artist/${artist.id}`);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center lg:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/55 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-phone flex-col overflow-hidden animate-sheet-up rounded-t-surface border border-white/10 bg-[rgba(8,18,36,0.94)] backdrop-blur-xl lg:animate-fade-in lg:max-w-lg lg:rounded-surface">
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/20 lg:hidden" />
        <div className="shrink-0 px-5 pt-4 pb-2 lg:pt-6">
          <p className="voice text-[11px] tracking-[0.12em] text-muted uppercase">
            Get started
          </p>
          <h2 className="mt-1 font-sans text-[24px] font-bold tracking-[-0.03em] text-ink">
            Create artist profile
          </h2>
        </div>

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] lg:pb-6"
        >
          <div className="mt-3 space-y-3">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Artist name"
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Role">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CategoryId)}
                className={inputClass}
              >
                {CATEGORY_IDS.map((id) => (
                  <option key={id} value={id} className="bg-surface">
                    {categoryLabel(id)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Short intro for your profile"
                className={`${inputClass} resize-none`}
              />
            </Field>
            <Field label="Artist fund goal (MXN)">
              <input
                inputMode="numeric"
                value={goal}
                onChange={(e) => setGoal(e.target.value.replace(/[^\d]/g, ""))}
                className={`${inputClass} tabular-nums`}
              />
            </Field>
          </div>

          {error ? (
            <p className="mt-3 text-[13px] text-danger">{error}</p>
          ) : null}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="voice flex h-12 flex-1 items-center justify-center rounded-full border border-white/15 text-[12px] text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="voice flex h-12 flex-[1.4] items-center justify-center rounded-full bg-[#E8E0D0] text-[12px] font-semibold tracking-[0.06em] text-[#0A121C]"
            >
              Create profile
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="voice text-[9px] tracking-[0.08em] text-tertiary uppercase">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
