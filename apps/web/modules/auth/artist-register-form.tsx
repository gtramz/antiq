"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { verifyAntiqAccount } from "@/services/authService";
import type { AntiqUserData } from "@/types/auth";
import {
  AuthCard,
  AuthErrorBanner,
  AuthField,
  AuthInput,
  AuthSubmitButton,
} from "./auth-ui";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "./auth-validation";
import { pathForRole } from "./post-auth-redirect";

type LookupStatus = "idle" | "loading" | "found" | "new" | "error";

const LOOKUP_DEBOUNCE_MS = 450;

/**
 * Artist registration — verifies Antiq DB email, then Link Account or new signup.
 */
export function ArtistRegisterForm() {
  const { registerArtist, error, clearError } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [antiqUser, setAntiqUser] = useState<AntiqUserData | null>(null);

  const lookupSeq = useRef(0);

  const runLookup = useCallback(async (rawEmail: string) => {
    const emailError = validateEmail(rawEmail);
    if (emailError) {
      setLookupStatus("idle");
      setAntiqUser(null);
      setLookupError(null);
      return;
    }

    const seq = ++lookupSeq.current;
    setLookupStatus("loading");
    setLookupError(null);

    try {
      const result = await verifyAntiqAccount(rawEmail);
      if (seq !== lookupSeq.current) return;

      if (result.exists && result.data) {
        setAntiqUser(result.data);
        setName(result.data.name);
        setLookupStatus("found");
      } else {
        setAntiqUser(null);
        setLookupStatus("new");
      }
    } catch (err) {
      if (seq !== lookupSeq.current) return;
      setAntiqUser(null);
      setLookupStatus("error");
      setLookupError(
        err instanceof Error ? err.message : "Unable to verify account",
      );
    }
  }, []);

  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      setLookupStatus("idle");
      setAntiqUser(null);
      setLookupError(null);
      return;
    }

    const handle = window.setTimeout(() => {
      void runLookup(trimmed);
    }, LOOKUP_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [email, runLookup]);

  const isLinkMode = lookupStatus === "found" && Boolean(antiqUser);
  const busy = submitting || lookupStatus === "loading";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();

    const nextErrors: Record<string, string> = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;

    if (!isLinkMode) {
      const nameError = validateName(name);
      if (nameError) nextErrors.name = nameError;
    }

    if (lookupStatus === "loading") {
      nextErrors.email = "Checking Antiq account…";
    }
    if (lookupStatus === "error") {
      nextErrors.email = lookupError || "Unable to verify email";
    }
    if (lookupStatus === "idle" && !emailError) {
      nextErrors.email = "Wait for account verification to finish";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await registerArtist(
        isLinkMode && antiqUser
          ? {
              name: antiqUser.name,
              email: email.trim(),
              password,
              antiqUserId: antiqUser.id,
            }
          : {
              name: name.trim(),
              email: email.trim(),
              password,
            },
      );
      router.replace(pathForRole(user.role));
    } catch {
      // Context stores error.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard>
      <p className="voice text-[11px] tracking-[0.12em] text-tertiary">
        Step 2 of 2 · Artist
      </p>
      <h1 className="mt-2 font-sans text-[28px] font-bold tracking-[-0.03em] text-ink">
        {isLinkMode ? "Link Account" : "Create artist account"}
      </h1>
      <p className="mt-2 text-[14px] text-muted">
        {isLinkMode
          ? "We found your Antiq profile. Set a password to link this account."
          : "Enter your email — we’ll check if you already exist in Antiq."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <AuthErrorBanner message={error || lookupError} />

        <AuthField label="Email" error={fieldErrors.email}>
          <div className="relative">
            <AuthInput
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLookupStatus("idle");
                if (fieldErrors.email) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
              onBlur={() => {
                if (email.trim()) void runLookup(email);
              }}
              placeholder="you@email.com"
              disabled={submitting}
              autoFocus
            />
            {lookupStatus === "loading" ? (
              <span
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
                aria-label="Checking account"
              />
            ) : null}
          </div>
          {lookupStatus === "loading" ? (
            <p className="voice mt-1.5 text-[9px] text-tertiary">
              Checking Antiq database…
            </p>
          ) : null}
          {lookupStatus === "new" ? (
            <p className="mt-1.5 text-[12px] text-muted">
              No Antiq account found — continue as a new artist.
            </p>
          ) : null}
        </AuthField>

        {isLinkMode && antiqUser ? (
          <div className="rounded-2xl border border-accent/25 bg-accent/10 px-3.5 py-3">
            <p className="voice text-[9px] text-accent">Antiq profile found</p>
            <p className="mt-1 text-[15px] font-medium text-ink">
              {antiqUser.name}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">{antiqUser.email}</p>
          </div>
        ) : null}

        {!isLinkMode &&
        (lookupStatus === "new" ||
          lookupStatus === "idle" ||
          lookupStatus === "error") ? (
          <AuthField label="Name" error={fieldErrors.name}>
            <AuthInput
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              placeholder="Artist name"
              disabled={busy}
            />
          </AuthField>
        ) : null}

        {(isLinkMode ||
          lookupStatus === "new" ||
          lookupStatus === "error") && (
          <AuthField label="Password" error={fieldErrors.password}>
            <AuthInput
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
                }
              }}
              placeholder="At least 6 characters"
              disabled={submitting}
            />
          </AuthField>
        )}

        {lookupStatus === "loading" ? (
          <div className="h-12 animate-pulse rounded-full bg-white/10" />
        ) : (
          <AuthSubmitButton
            loading={submitting}
            disabled={lookupStatus === "idle" && !isLinkMode}
          >
            {isLinkMode ? "Link Account" : "Create account"}
          </AuthSubmitButton>
        )}
      </form>
    </AuthCard>
  );
}
