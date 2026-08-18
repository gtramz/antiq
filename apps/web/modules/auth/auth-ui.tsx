"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/modules/shell/ui";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-[16px] text-ink outline-none placeholder:text-tertiary/80 focus:border-accent/40 lg:rounded-[14px] lg:py-3 lg:text-[15px]";

function AuthBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="voice flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 text-[10px] text-muted backdrop-blur-md transition hover:border-white/20 hover:text-ink"
    >
      <span aria-hidden>←</span>
      Back
    </button>
  );
}

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[radial-gradient(120%_80%_at_50%_-8%,#1A3358_0%,#0A1528_42%,#03060C_100%)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] lg:justify-center lg:px-8 lg:pb-16 lg:pt-10">
        <header className="mb-7 flex items-center justify-between gap-3 lg:mb-10">
          <AuthBackButton />
          <Link href="/" className="shrink-0" aria-label="antiq home">
            <BrandMark className="origin-right scale-90 lg:scale-100" />
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}

/** Light on mobile (open form); fuller glass card on desktop. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="lg:rounded-surface lg:border lg:border-white/10 lg:bg-black/20 lg:p-6 lg:backdrop-blur-xl">
      {children}
    </div>
  );
}

export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="voice text-[9px] tracking-[0.08em] text-tertiary">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-1.5 text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

export function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`${inputClass} ${props.className ?? ""}`} />
  );
}

export function AuthErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="rounded-2xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-[13px] text-danger"
      role="alert"
    >
      {message}
    </div>
  );
}

export function AuthSubmitButton({
  children,
  loading,
  disabled,
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="voice mt-1 flex h-12 w-full items-center justify-center rounded-full bg-[#E8E0D0] text-[12px] font-semibold tracking-[0.06em] text-[#0A121C] transition hover:bg-[#F0EAE0] disabled:cursor-not-allowed disabled:opacity-55"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p className="mt-8 text-center text-[13px] text-muted/90 lg:mt-6">
      {prompt}{" "}
      <Link href={href} className="font-medium text-accent hover:underline">
        {label}
      </Link>
    </p>
  );
}
