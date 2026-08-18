"use client";

import {
  investorsSharePercent,
  ownershipAllocated,
  type OwnershipSplit,
} from "@antiq/types";
import type { ReactNode } from "react";

export const USE_OF_FUNDS_OPTIONS = [
  "Music Video",
  "Mastering",
  "Mixing",
  "Production",
  "Promotion",
  "Marketing",
  "Tour",
  "Other",
] as const;

export const SPLIT_ROLE_SUGGESTIONS = [
  "Artist",
  "Producer",
  "Co-writer",
  "Engineer",
  "Featured Artist",
] as const;

export type SplitDraft = OwnershipSplit;

export function makeSplitId() {
  return `split-${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultOwnershipSplits(): SplitDraft[] {
  return [{ id: makeSplitId(), role: "Artist", percent: 50 }];
}

export function formatReleaseDate(iso?: string): string {
  if (!iso) return "Not set";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function validateSplits(splits: SplitDraft[]): string | null {
  const allocated = ownershipAllocated(splits);
  if (allocated > 100) {
    return "Ownership splits cannot exceed 100%";
  }
  if (splits.some((s) => !s.role.trim())) {
    return "Each split needs a role name";
  }
  return null;
}

const inputClass =
  "w-full rounded-[14px] border border-white/15 bg-black/35 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-tertiary focus:border-white/30";

const sectionLabelClass =
  "voice text-[11px] tracking-[0.12em] text-muted uppercase";

export function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className={sectionLabelClass}>{children}</h3>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="voice text-[9px] tracking-[0.08em] text-tertiary uppercase">
      {children}
    </span>
  );
}

/** Pitch — view: clean text; edit: bordered textarea. */
export function PitchSection({
  pitch,
  editing,
  onChange,
}: {
  pitch: string;
  editing: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <section>
      <SectionHeading>The Pitch</SectionHeading>
      {editing ? (
        <textarea
          value={pitch}
          onChange={(e) => onChange?.(e.target.value)}
          rows={5}
          placeholder="Describe the track, the story, and why it matters…"
          className={`${inputClass} mt-3 resize-none`}
        />
      ) : (
        <p className="mt-3 text-[15px] leading-relaxed text-ink/90 whitespace-pre-wrap">
          {pitch || "No pitch yet."}
        </p>
      )}
    </section>
  );
}

/** Use of funds multi-select chips. */
export function UseOfFundsPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {USE_OF_FUNDS_OPTIONS.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`voice h-8 rounded-full border px-3 text-[10px] tracking-[0.06em] uppercase transition ${
              active
                ? "border-accent/50 bg-accent/20 text-ink"
                : "border-white/12 bg-black/20 text-muted hover:border-white/25 hover:text-ink"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

/** Funding Purpose & Timeline — view glass cards / edit controls. */
export function FundingPurposeTimelineSection({
  useOfFunds,
  targetReleaseDate,
  editing,
  onUseOfFundsChange,
  onDateChange,
}: {
  useOfFunds: string[];
  targetReleaseDate?: string;
  editing: boolean;
  onUseOfFundsChange?: (tags: string[]) => void;
  onDateChange?: (iso: string) => void;
}) {
  return (
    <section>
      <SectionHeading>Funding Purpose & Timeline</SectionHeading>
      {editing ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <FieldLabel>Use of Funds</FieldLabel>
            <div className="mt-2">
              <UseOfFundsPicker
                selected={useOfFunds}
                onChange={(tags) => onUseOfFundsChange?.(tags)}
              />
            </div>
          </label>
          <label className="block">
            <FieldLabel>Target Release Date</FieldLabel>
            <input
              type="date"
              value={targetReleaseDate ?? ""}
              onChange={(e) => onDateChange?.(e.target.value)}
              className={`${inputClass} mt-2`}
            />
          </label>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <GlassInfoCard title="Use of Funds">
            {useOfFunds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {useOfFunds.map((tag) => (
                  <span
                    key={tag}
                    className="voice rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] tracking-[0.06em] text-ink uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted">Not specified</p>
            )}
          </GlassInfoCard>
          <GlassInfoCard title="Target Release Date">
            <p className="font-sans text-[20px] font-semibold tracking-[-0.02em] text-ink">
              {formatReleaseDate(targetReleaseDate)}
            </p>
          </GlassInfoCard>
        </div>
      )}
    </section>
  );
}

function GlassInfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(8,18,36,0.55)] p-4 backdrop-blur-xl">
      <p className="voice text-[9px] tracking-[0.1em] text-tertiary uppercase">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Ownership & Splits — view list / edit dynamic rows. */
export function OwnershipSplitsSection({
  splits,
  editing,
  onChange,
}: {
  splits: SplitDraft[];
  editing: boolean;
  onChange?: (next: SplitDraft[]) => void;
}) {
  const investors = investorsSharePercent(splits);
  const allocated = ownershipAllocated(splits);

  function patchRow(id: string, patch: Partial<SplitDraft>) {
    onChange?.(splits.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeRow(id: string) {
    if (splits.length <= 1) return;
    onChange?.(splits.filter((s) => s.id !== id));
  }

  function addRow() {
    onChange?.([
      ...splits,
      { id: makeSplitId(), role: "Producer", percent: 0 },
    ]);
  }

  return (
    <section>
      <SectionHeading>Ownership & Splits</SectionHeading>
      {editing ? (
        <div className="mt-3 space-y-2">
          {splits.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                list="split-role-suggestions"
                value={row.role}
                onChange={(e) => patchRow(row.id, { role: e.target.value })}
                placeholder="Role"
                className={`${inputClass} flex-1`}
              />
              <div className="relative w-[88px] shrink-0">
                <input
                  inputMode="decimal"
                  value={row.percent === 0 ? "0" : String(row.percent)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d.]/g, "");
                    const n = Number.parseFloat(raw);
                    patchRow(row.id, {
                      percent: Number.isFinite(n) ? Math.min(100, n) : 0,
                    });
                  }}
                  className={`${inputClass} pr-7 tabular-nums`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px] text-tertiary">
                  %
                </span>
              </div>
              <button
                type="button"
                aria-label="Remove split"
                disabled={splits.length <= 1}
                onClick={() => removeRow(row.id)}
                className="voice flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 text-[16px] text-muted disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
          <datalist id="split-role-suggestions">
            {SPLIT_ROLE_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <div className="flex items-center justify-between rounded-[14px] border border-dashed border-white/15 px-3.5 py-2.5">
            <span className="text-[13px] text-muted">Available for Investors</span>
            <span
              className={`tabular-nums text-[14px] font-medium ${
                allocated > 100 ? "text-danger" : "text-accent"
              }`}
            >
              {investors}%
            </span>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="voice mt-1 text-[11px] tracking-[0.08em] text-accent uppercase"
          >
            + Add role
          </button>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-white/8 rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
          {splits.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between px-4 py-3 text-[14px]"
            >
              <span className="text-ink">{row.role}</span>
              <span className="tabular-nums text-muted">{row.percent}%</span>
            </li>
          ))}
          <li className="flex items-center justify-between px-4 py-3 text-[14px]">
            <span className="text-accent">Available for Investors</span>
            <span className="tabular-nums font-medium text-accent">
              {investors}%
            </span>
          </li>
        </ul>
      )}
    </section>
  );
}

/** Funding bar + optional goal edit / fund CTA. */
export function FundingBarSection({
  raised,
  goal,
  pct,
  editing,
  goalInput,
  onGoalChange,
  fundDisabled,
  fundLabel,
  onFund,
  formatMoney,
}: {
  raised: number;
  goal: number;
  pct: number;
  editing: boolean;
  goalInput?: string;
  onGoalChange?: (value: string) => void;
  fundDisabled?: boolean;
  fundLabel?: string;
  onFund?: () => void;
  formatMoney: (n: number) => string;
}) {
  return (
    <section>
      <SectionHeading>Funding</SectionHeading>
      {editing ? (
        <label className="mt-3 block">
          <FieldLabel>Target Goal (MXN)</FieldLabel>
          <input
            inputMode="numeric"
            value={goalInput ?? String(goal)}
            onChange={(e) =>
              onGoalChange?.(e.target.value.replace(/[^\d]/g, ""))
            }
            placeholder="50000"
            className={`${inputClass} mt-2 tabular-nums`}
          />
        </label>
      ) : (
        <>
          <div className="mt-3 mb-2 flex items-baseline justify-between">
            <span className="voice text-[11px] text-muted">{pct}% funded</span>
            <span className="text-[12px] text-muted">
              {formatMoney(raised)} / {formatMoney(goal)}
            </span>
          </div>
          <div className="h-[3px] w-full overflow-hidden bg-white/10">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {onFund ? (
            <div className="mt-6 lg:max-w-[320px]">
              <button
                type="button"
                disabled={fundDisabled}
                onClick={onFund}
                className="voice h-[52px] w-full rounded-full bg-accent px-4 text-[13px] text-bg border border-accent transition active:opacity-80 disabled:opacity-40"
              >
                {fundLabel ?? "Fund this project"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export { inputClass };
