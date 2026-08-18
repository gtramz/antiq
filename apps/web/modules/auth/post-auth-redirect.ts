import type { UserRole } from "@/types/auth";

/** Destination after successful login / register. */
export function pathForRole(role: UserRole): string {
  return role === "artist" || role === "investor" ? "/profile" : "/explore";
}
