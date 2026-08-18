import type { UserRole } from "@/types/auth";

export type RoleCtaAction = "fund" | "support" | "login";

/** Primary backing action for the current account role. */
export function roleCtaAction(role: UserRole | null | undefined): RoleCtaAction {
  if (role === "investor") return "fund";
  if (role === "artist") return "support";
  return "login";
}

export function projectCtaLabel(action: RoleCtaAction): string {
  if (action === "support") return "Support this project";
  if (action === "fund") return "Fund this project";
  return "Sign in to continue";
}

export function projectCardCtaLabel(action: RoleCtaAction): string {
  if (action === "support") return "Support Project";
  if (action === "fund") return "Back Project";
  return "Sign in to continue";
}

export function artistCtaLabel(action: RoleCtaAction): string {
  if (action === "support") return "Support artist";
  if (action === "fund") return "Fund artist";
  return "Sign in to continue";
}

export function investCardCtaLabel(action: RoleCtaAction): string {
  if (action === "support") return "Support";
  if (action === "fund") return "Invest";
  return "Sign in";
}
