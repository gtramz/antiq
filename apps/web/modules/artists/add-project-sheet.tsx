"use client";

import type { CategoryId, Project } from "@antiq/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/modules/data/store";
import { GENRES } from "@/modules/discover/taxonomy";
import {
  defaultOwnershipSplits,
  FundingPurposeTimelineSection,
  inputClass,
  OwnershipSplitsSection,
  PitchSection,
  SectionHeading,
  type SplitDraft,
  validateSplits,
} from "@/modules/projects/project-sections";
import { ImageUploadField } from "@/modules/shell/image-upload-field";

const FORMATS = ["Single", "EP", "Album"] as const;

type FormState = {
  title: string;
  pitch: string;
  format: (typeof FORMATS)[number];
  subcategory: string;
  goal: string;
  returnModel: string;
  coverUrl: string;
  listedForFunding: boolean;
  useOfFunds: string[];
  targetReleaseDate: string;
  ownershipSplits: SplitDraft[];
};

const emptyForm = (genre: string): FormState => ({
  title: "",
  pitch: "",
  format: "Single",
  subcategory: genre,
  goal: "50000",
  returnModel: "Revenue share · 18 months",
  coverUrl: "",
  listedForFunding: true,
  useOfFunds: [],
  targetReleaseDate: "",
  ownershipSplits: defaultOwnershipSplits(),
});

type Props = {
  open: boolean;
  onClose: () => void;
  artistId: string;
  artistRole: CategoryId;
  defaultGenre?: string;
  palette: Project["palette"];
};

/**
 * Sheet to create an Active Funding project from the artist profile.
 */
export function AddProjectSheet({
  open,
  onClose,
  artistId,
  artistRole,
  defaultGenre = "Electronic",
  palette,
}: Props) {
  const router = useRouter();
  const { addProject } = useStore();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultGenre));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm(defaultGenre));
    setError(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, defaultGenre]);

  if (!mounted || !open) return null;

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    const pitch = form.pitch.trim();
    const goal = Number.parseInt(form.goal.replace(/[^\d]/g, ""), 10);

    if (!title) {
      setError("Add a project title");
      return;
    }
    if (!pitch) {
      setError("Add a pitch for the track");
      return;
    }
    if (!Number.isFinite(goal) || goal <= 0) {
      setError("Enter a valid funding goal");
      return;
    }
    const splitError = validateSplits(form.ownershipSplits);
    if (splitError) {
      setError(splitError);
      return;
    }

    const created = addProject({
      artistId,
      title,
      pitch,
      story: pitch,
      category: artistRole,
      subcategory: form.subcategory || defaultGenre,
      format: form.format,
      goal,
      listedForFunding: form.listedForFunding,
      returnModel: form.returnModel.trim() || undefined,
      coverUrl: form.coverUrl || undefined,
      palette,
      previewSeconds: 36,
      snippetLabel: "Preview",
      useOfFunds: form.useOfFunds,
      targetReleaseDate: form.targetReleaseDate || undefined,
      ownershipSplits: form.ownershipSplits,
    });

    if (!created) {
      setError("Could not create project");
      return;
    }
    onClose();
    router.push(`/project/${created.id}`);
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
            New project
          </p>
          <h2 className="mt-1 font-sans text-[24px] font-bold tracking-[-0.03em] text-ink">
            Add to Active Funding
          </h2>
        </div>

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] lg:pb-6"
        >
          <div className="mt-3 space-y-6">
            <section className="space-y-3">
              <SectionHeading>Basics</SectionHeading>
              <Field label="Title">
                <input
                  value={form.title}
                  onChange={(e) => patch("title", e.target.value)}
                  placeholder="Project title"
                  className={inputClass}
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Format">
                  <select
                    value={form.format}
                    onChange={(e) =>
                      patch("format", e.target.value as FormState["format"])
                    }
                    className={inputClass}
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f} className="bg-surface">
                        {f}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Genre">
                  <select
                    value={form.subcategory}
                    onChange={(e) => patch("subcategory", e.target.value)}
                    className={inputClass}
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g} className="bg-surface">
                        {g}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <ImageUploadField
                label="Cover photo"
                value={form.coverUrl || undefined}
                onChange={(dataUrl) => patch("coverUrl", dataUrl ?? "")}
                aspect="wide"
              />

              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3">
                <span>
                  <span className="block text-[14px] font-medium text-ink">
                    List for funding
                  </span>
                  <span className="voice mt-0.5 block text-[9px] text-tertiary">
                    Show in Active Funding & Discover
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.listedForFunding}
                  onClick={() =>
                    patch("listedForFunding", !form.listedForFunding)
                  }
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    form.listedForFunding ? "bg-accent" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-ink transition ${
                      form.listedForFunding ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </label>
            </section>

            <PitchSection
              pitch={form.pitch}
              editing
              onChange={(v) => patch("pitch", v)}
            />

            <FundingPurposeTimelineSection
              useOfFunds={form.useOfFunds}
              targetReleaseDate={form.targetReleaseDate || undefined}
              editing
              onUseOfFundsChange={(tags) => patch("useOfFunds", tags)}
              onDateChange={(iso) => patch("targetReleaseDate", iso)}
            />

            <OwnershipSplitsSection
              splits={form.ownershipSplits}
              editing
              onChange={(next) => patch("ownershipSplits", next)}
            />

            <section className="space-y-3">
              <SectionHeading>Funding Goal</SectionHeading>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Goal (MXN)">
                  <input
                    inputMode="numeric"
                    value={form.goal}
                    onChange={(e) =>
                      patch("goal", e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder="50000"
                    className={`${inputClass} tabular-nums`}
                  />
                </Field>
                <Field label="Return model">
                  <input
                    value={form.returnModel}
                    onChange={(e) => patch("returnModel", e.target.value)}
                    placeholder="Revenue share · 18 months"
                    className={inputClass}
                  />
                </Field>
              </div>
            </section>
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
              Create project
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
