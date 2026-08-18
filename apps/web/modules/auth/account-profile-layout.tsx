"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/modules/data/store";
import type { UserRole } from "@/types/auth";
import { validateEmail, validateName } from "./auth-validation";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function roleLabel(role: UserRole): string {
  return role === "artist" ? "Artist" : "Investor";
}

const inputClass =
  "mt-1.5 w-full rounded-[14px] border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-tertiary focus:border-accent/40";

type Props = {
  children: ReactNode;
};

/**
 * Shared private Profile chrome — identity, edit, single Log Out.
 */
export function AccountProfileLayout({ children }: Props) {
  const { user, logout, updateProfile, error, clearError } = useAuth();
  const { getArtistByOwner, updateArtist } = useStore();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || editing) return;
    setName(user.name);
    setEmail(user.email);
  }, [user, editing]);

  if (!user) return null;

  function startEditing() {
    clearError();
    setSaveMessage(null);
    setFieldErrors({});
    setName(user!.name);
    setEmail(user!.email);
    setEditing(true);
  }

  function cancelEditing() {
    clearError();
    setFieldErrors({});
    setSaveMessage(null);
    setName(user!.name);
    setEmail(user!.email);
    setEditing(false);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    clearError();
    setSaveMessage(null);

    const nextErrors: Record<string, string> = {};
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    if (nameError) nextErrors.name = nameError;
    if (emailError) nextErrors.email = emailError;
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const trimmedName = name.trim();
      await updateProfile({
        name: trimmedName,
        email: email.trim(),
      });
      if (user!.role === "artist") {
        const owned = getArtistByOwner(user!.id);
        if (owned) updateArtist(owned.id, { name: trimmedName });
      }
      setEditing(false);
      setSaveMessage("Account updated");
    } catch {
      // Context stores error.
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-transparent">
      <div className="mx-auto w-full max-w-content px-5 pb-12 pt-[max(16px,env(safe-area-inset-top))] lg:px-8 lg:pt-8">
        <header>
          <p className="voice text-[11px] tracking-[0.12em] text-tertiary">
            Profile
          </p>
          <h1 className="mt-2 font-sans text-[28px] font-bold tracking-[-0.03em] text-ink sm:text-[32px]">
            Your account
          </h1>
        </header>

        <section
          className="mt-6 rounded-surface border border-white/10 bg-black/20 p-5 backdrop-blur-xl sm:p-6"
          aria-label="Account identity"
        >
          {!editing ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 font-sans text-[16px] font-bold text-ink"
                    aria-hidden
                  >
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[20px] font-bold tracking-[-0.02em] text-ink">
                      {user.name}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-muted">
                      {user.email}
                    </p>
                    <p className="voice mt-2 inline-flex rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[9px] text-accent">
                      {roleLabel(user.role)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startEditing}
                  className="voice shrink-0 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-[10px] text-ink transition hover:border-white/25 hover:bg-white/10"
                >
                  Account settings
                </button>
              </div>
              {saveMessage ? (
                <p className="mt-3 text-[13px] text-success">{saveMessage}</p>
              ) : null}
            </>
          ) : (
            <form onSubmit={onSave} className="space-y-4" noValidate>
              <div className="flex items-center justify-between gap-3">
                <p className="voice text-[10px] tracking-[0.12em] text-tertiary">
                  Account settings
                </p>
                <p className="voice rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[9px] text-accent">
                  {roleLabel(user.role)}
                </p>
              </div>

              {error ? (
                <p className="text-[13px] text-danger" role="alert">
                  {error}
                </p>
              ) : null}

              <label className="block">
                <span className="voice text-[9px] text-tertiary">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                  disabled={saving}
                  autoFocus
                />
                {fieldErrors.name ? (
                  <span className="mt-1 block text-[12px] text-danger">
                    {fieldErrors.name}
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="voice text-[9px] text-tertiary">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                  disabled={saving}
                />
                {fieldErrors.email ? (
                  <span className="mt-1 block text-[12px] text-danger">
                    {fieldErrors.email}
                  </span>
                ) : null}
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="voice flex h-11 flex-1 items-center justify-center rounded-full bg-[#E8E0D0] text-[11px] font-semibold tracking-[0.06em] text-[#0A121C] disabled:opacity-55"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="voice flex h-11 flex-1 items-center justify-center rounded-full border border-white/15 text-[11px] text-muted disabled:opacity-55"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {children}

        {/* Single Log Out — not duplicated in the header */}
        <section className="mt-10 border-t border-white/10 pt-6">
          <p className="voice text-[10px] text-tertiary">Settings</p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="voice mt-3 flex h-12 w-full max-w-sm items-center justify-center rounded-full border border-white/15 bg-black/20 text-[12px] font-semibold tracking-[0.06em] text-[#E8E0D0] transition hover:border-white/25 disabled:opacity-55"
          >
            {loggingOut ? "Signing out…" : "Log Out"}
          </button>
        </section>
      </div>
    </div>
  );
}
