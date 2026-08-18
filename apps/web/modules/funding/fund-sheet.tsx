"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/modules/data/store";
import { formatMoney } from "@/modules/shell/tokens";
import { GlassButton } from "@/modules/shell/ui";

const PRESETS = [250, 500, 1000, 2500];

type Props =
  | {
      mode: "project";
      projectId: string;
      open: boolean;
      onClose: () => void;
    }
  | {
      mode: "artist";
      artistId: string;
      open: boolean;
      onClose: () => void;
    };

export function FundSheet(props: Props) {
  const { mode, open, onClose } = props;
  const { getProject, getArtist, fundProject, fundArtist } = useStore();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");
  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    if (!isAuthenticated) {
      onClose();
      const next = encodeURIComponent(pathname || "/explore");
      router.push(`/login?next=${next}`);
      return;
    }
    if (user?.role !== "investor") {
      setBlocked(true);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    setBlocked(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isAuthenticated, user?.role, onClose, pathname, router]);

  if (!mounted || !open || !isAuthenticated) return null;

  if (blocked || user?.role !== "investor") {
    return createPortal(
      <div className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center lg:p-6">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/55 animate-fade-in"
          onClick={onClose}
        />
        <div className="relative z-10 w-full max-w-phone animate-sheet-up rounded-t-surface glass-band-strong px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 lg:animate-fade-in lg:rounded-surface lg:pb-6 lg:pt-6">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 lg:hidden" />
          <p className="voice text-[11px] text-muted">Funding</p>
          <h2 className="mt-1 font-display text-[28px] leading-tight text-ink">
            Investors only
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            Only investor accounts can fund projects economically. Artists can
            Support symbolically instead.
          </p>
          <div className="mt-6">
            <GlassButton onClick={onClose}>Close</GlassButton>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const project =
    mode === "project" ? getProject(props.projectId) : undefined;
  const artist =
    mode === "artist"
      ? getArtist(props.artistId)
      : project
        ? getArtist(project.artistId)
        : undefined;

  if (mode === "project" && !project) return null;
  if (mode === "artist" && !artist) return null;

  const title =
    mode === "project" ? project!.title : artist!.name;
  const eyebrow = mode === "project" ? "Fund project" : "Fund artist";

  const resolved =
    custom.trim().length > 0 ? Number.parseInt(custom, 10) || 0 : amount;

  function confirm() {
    if (user?.role !== "investor") return;
    const pledge =
      mode === "project"
        ? fundProject(props.projectId, resolved)
        : fundArtist(props.artistId, resolved);
    if (!pledge) return;
    onClose();
    router.push(`/pledges/receipt?id=${pledge.id}`);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center lg:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/55 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-phone animate-sheet-up rounded-t-surface glass-band-strong px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 lg:animate-fade-in lg:rounded-surface lg:pb-6 lg:pt-6">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 lg:hidden" />
        <p className="voice text-[11px] text-muted">{eyebrow}</p>
        <h2 className="mt-1 font-display text-[28px] leading-tight text-ink">
          {title}
        </h2>
        {mode === "project" && artist ? (
          <p className="mt-1 text-[13px] text-muted">{artist.name}</p>
        ) : null}
        <p className="mt-6 voice text-[11px] text-tertiary">Choose amount</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setAmount(n);
                setCustom("");
              }}
              className={`voice h-11 rounded-full text-[11px] ${
                custom === "" && amount === n
                  ? "glass-band-strong text-accent"
                  : "glass-band text-ink"
              }`}
            >
              {formatMoney(n)}
            </button>
          ))}
        </div>
        <div className="glass-band mt-3 flex h-12 items-center rounded-full px-3">
          <span className="voice mr-2 text-[11px] text-muted">MXN</span>
          <input
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Custom"
            className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-tertiary"
          />
        </div>
        <div className="mt-6 space-y-2">
          <GlassButton strong disabled={resolved <= 0} onClick={confirm}>
            Confirm {resolved > 0 ? formatMoney(resolved) : ""}
          </GlassButton>
          <GlassButton onClick={onClose}>Cancel</GlassButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
