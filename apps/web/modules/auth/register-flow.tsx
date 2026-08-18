"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/auth";
import { ArtistRegisterForm } from "./artist-register-form";
import {
  AuthCard,
  AuthErrorBanner,
  AuthField,
  AuthFooterLink,
  AuthInput,
  AuthScreen,
  AuthSubmitButton,
} from "./auth-ui";
import { validateRegisterForm } from "./auth-validation";
import { pathForRole } from "./post-auth-redirect";

type Step = "role" | "form";

export function RegisterFlow() {
  const { registerInvestor, error, clearError } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function chooseRole(next: UserRole) {
    setRole(next);
    setStep("form");
    clearError();
  }

  async function onInvestorSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();

    const nextErrors = validateRegisterForm({ name, email, password });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await registerInvestor({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      router.replace(pathForRole(user.role));
    } catch {
      // Context stores error.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen>
      {step === "role" ? (
        <>
          <p className="voice text-[11px] tracking-[0.12em] text-tertiary">
            Step 1 of 2
          </p>
          <h1 className="mt-2 font-sans text-[28px] font-bold tracking-[-0.03em] text-ink">
            How will you use antiq?
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            Choose a role to personalize your experience.
          </p>

          <div className="mt-8 grid gap-4">
            <RoleCard
              title="I am an Artist"
              description="Upload projects, open funding rounds, and grow your catalog."
              onClick={() => chooseRole("artist")}
            />
            <RoleCard
              title="I am an Investor"
              description="Discover artists and back singles, EPs, and albums."
              onClick={() => chooseRole("investor")}
            />
          </div>

          <AuthFooterLink
            prompt="Already have an account?"
            href="/login"
            label="Log in"
          />
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setStep("role");
              clearError();
            }}
            className="voice mb-4 w-fit text-[10px] text-muted hover:text-ink"
          >
            ← Change role
          </button>

          {role === "artist" ? (
            <ArtistRegisterForm />
          ) : (
            <AuthCard>
              <p className="voice text-[11px] tracking-[0.12em] text-tertiary">
                Step 2 of 2 · Investor
              </p>
              <h1 className="mt-2 font-sans text-[28px] font-bold tracking-[-0.03em] text-ink">
                Create account
              </h1>
              <p className="mt-2 text-[14px] text-muted">
                Name, email, and a secure password.
              </p>

              <form
                onSubmit={onInvestorSubmit}
                className="mt-6 space-y-4"
                noValidate
              >
                <AuthErrorBanner message={error} />

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
                    placeholder="Your name"
                    disabled={submitting}
                    autoFocus
                  />
                </AuthField>

                <AuthField label="Email" error={fieldErrors.email}>
                  <AuthInput
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.email;
                          return next;
                        });
                      }
                    }}
                    placeholder="you@email.com"
                    disabled={submitting}
                  />
                </AuthField>

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

                <AuthSubmitButton loading={submitting}>
                  Create account
                </AuthSubmitButton>
              </form>
            </AuthCard>
          )}

          <AuthFooterLink
            prompt="Already have an account?"
            href="/login"
            label="Log in"
          />
        </>
      )}
    </AuthScreen>
  );
}

function RoleCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-surface border border-white/10 bg-black/20 p-5 text-left backdrop-blur-xl transition hover:border-accent/35 hover:bg-black/30 sm:p-6"
    >
      <h2 className="font-sans text-[20px] font-bold tracking-[-0.02em] text-ink sm:text-[22px]">
        {title}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">{description}</p>
      <span className="voice mt-4 inline-block text-[10px] text-accent transition group-hover:translate-x-0.5">
        Continue →
      </span>
    </button>
  );
}
