"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ArtistProfileDashboard } from "@/modules/auth/artist-profile-dashboard";
import { InvestorProfile } from "@/modules/investors/investor-profile";

/**
 * Shared /profile entry — artist and investor account profiles.
 */
export function ProfileHome() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center px-5">
        <p className="voice text-[11px] text-muted">Loading…</p>
      </div>
    );
  }

  if (user.role === "investor") {
    return <InvestorProfile />;
  }

  return <ArtistProfileDashboard />;
}
