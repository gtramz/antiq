"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/modules/data/store";
import { GlassButton } from "@/modules/shell/ui";

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

/**
 * Symbolic artist-to-artist support — no money, public + drives Featured.
 */
export function SupportSheet(props: Props) {
  const { mode, open, onClose } = props;
  const {
    getProject,
    getArtist,
    getArtistByOwner,
    supportProject,
    unsupportProject,
    supportArtist,
    unsupportArtist,
    hasSupportedProject,
    hasSupportedArtist,
  } = useStore();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    if (!isAuthenticated) {
      onClose();
      const next = encodeURIComponent(pathname || "/explore");
      router.push(`/login?next=${next}`);
      return;
    }
    if (user?.role !== "artist") {
      onClose();
      return;
    }
    setError(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isAuthenticated, user?.role, onClose, pathname, router]);

  if (!mounted || !open || !isAuthenticated || user?.role !== "artist") {
    return null;
  }

  const myArtist = getArtistByOwner(user.id);
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
  if (!myArtist) return null;

  const targetArtistId =
    mode === "project" ? project!.artistId : props.artistId;
  const isSelf = myArtist.id === targetArtistId;
  const already =
    mode === "project"
      ? hasSupportedProject(props.projectId, myArtist.id)
      : hasSupportedArtist(props.artistId, myArtist.id);

  const title = mode === "project" ? project!.title : artist!.name;
  const eyebrow =
    mode === "project" ? "Support project" : "Support artist";

  function confirm() {
    if (!myArtist || isSelf) {
      setError("You can’t support your own work");
      return;
    }
    if (already) {
      if (mode === "project") {
        unsupportProject(props.projectId, myArtist.id);
      } else {
        unsupportArtist(props.artistId, myArtist.id);
      }
      onClose();
      return;
    }
    const created =
      mode === "project"
        ? supportProject(props.projectId, myArtist.id)
        : supportArtist(props.artistId, myArtist.id);
    if (!created) {
      setError("Could not add support");
      return;
    }
    onClose();
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
        <p className="mt-5 text-[14px] leading-relaxed text-muted">
          Symbolic support from artists — public signal that helps projects
          trend in Featured. No money changes hands.
        </p>
        {isSelf ? (
          <p className="mt-4 text-[13px] text-danger">
            You can’t support your own work
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 text-[13px] text-danger">{error}</p>
        ) : null}
        <div className="mt-6 space-y-2">
          <GlassButton strong disabled={isSelf} onClick={confirm}>
            {already ? "Remove support" : "Support"}
          </GlassButton>
          <GlassButton onClick={onClose}>Cancel</GlassButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
