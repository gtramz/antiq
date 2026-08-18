"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/modules/data/store";

/**
 * Keeps 1:1 catalog Artist for each signed-in artist account.
 * Lives under StoreProvider (AuthProvider wraps it).
 */
export function EnsureArtistBridge() {
  const { user } = useAuth();
  const { ensureArtistForUser } = useStore();

  useEffect(() => {
    if (user?.role !== "artist") return;
    ensureArtistForUser({ id: user.id, name: user.name });
  }, [user?.id, user?.role, user?.name, ensureArtistForUser]);

  return null;
}
