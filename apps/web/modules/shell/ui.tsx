import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AntiqLogo } from "./antiq-logo";

const WORDMARK = "antiq";

/** Compact top bar mark: logo + wordmark with coordinated hover motion. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`group flex items-center gap-2.5 text-ink ${className}`}
      aria-label="antiq"
      tabIndex={0}
    >
      <AntiqLogo className="h-7 w-7 shrink-0" />
      <span
        className="flex font-sans text-[22px] font-bold leading-none tracking-[-0.04em]"
        aria-hidden
      >
        {WORDMARK.split("").map((letter, i) => (
          <span
            key={`${letter}-${i}`}
            className="inline-block transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5"
            style={{ transitionDelay: `${i * 45}ms` }}
          >
            {letter}
          </span>
        ))}
      </span>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="voice text-[11px] text-tertiary text-veil">{children}</p>
  );
}

export function GlassButton({
  children,
  strong,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { strong?: boolean }) {
  return (
    <button
      type="button"
      className={`voice h-[52px] w-full rounded-full px-4 text-[13px] transition active:opacity-80 disabled:opacity-40 ${
        strong
          ? "bg-accent text-bg border border-accent"
          : "glass-band text-ink text-veil"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
