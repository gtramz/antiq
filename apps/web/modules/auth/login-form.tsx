"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  AuthCard,
  AuthErrorBanner,
  AuthField,
  AuthFooterLink,
  AuthInput,
  AuthScreen,
  AuthSubmitButton,
} from "./auth-ui";
import { validateLoginForm } from "./auth-validation";
import { pathForRole } from "./post-auth-redirect";

export function LoginForm() {
  const { login, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();

    const nextErrors = validateLoginForm({ email, password });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login({
        email: email.trim(),
        password,
      });
      const next = searchParams.get("next");
      router.replace(
        next && next.startsWith("/") ? next : pathForRole(user.role),
      );
    } catch {
      // Context already stores error message.
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting;

  return (
    <AuthScreen>
      <AuthCard>
        <p className="voice text-[10px] tracking-[0.12em] text-tertiary">
          Account
        </p>
        <h1 className="mt-2 font-sans text-[32px] font-bold leading-none tracking-[-0.04em] text-ink lg:text-[28px]">
          Log in
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted lg:mt-2 lg:text-[14px]">
          Enter your email and password to continue.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 lg:mt-6 lg:space-y-4" noValidate>
          <AuthErrorBanner message={error} />

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
              disabled={busy}
            />
          </AuthField>

          <AuthField label="Password" error={fieldErrors.password}>
            <AuthInput
              type="password"
              autoComplete="current-password"
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
              placeholder="••••••••"
              disabled={busy}
            />
          </AuthField>

          <AuthSubmitButton loading={busy}>Log in</AuthSubmitButton>
        </form>
      </AuthCard>

      <AuthFooterLink
        prompt="New to antiq?"
        href="/register"
        label="Create an account"
      />
    </AuthScreen>
  );
}
