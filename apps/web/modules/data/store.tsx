"use client";

import type { Artist, Pledge, Project } from "@antiq/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { artists as seedArtists, initialPledges, initialProjects } from "./seed";

export type ArtistUpdate = Partial<
  Pick<
    Artist,
    | "name"
    | "bio"
    | "role"
    | "socials"
    | "avatarUrl"
    | "bannerUrl"
    | "artistGoal"
  >
>;

type Store = {
  artists: Artist[];
  projects: Project[];
  pledges: Pledge[];
  getArtist: (id: string) => Artist | undefined;
  getProject: (id: string) => Project | undefined;
  projectsByArtist: (artistId: string) => Project[];
  fundProject: (projectId: string, amount: number) => Pledge | null;
  fundArtist: (artistId: string, amount: number) => Pledge | null;
  setProjectListed: (projectId: string, listed: boolean) => void;
  updateArtist: (artistId: string, patch: ArtistUpdate) => void;
};

const StoreContext = createContext<Store | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [artists, setArtists] = useState<Artist[]>(seedArtists);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [pledges, setPledges] = useState<Pledge[]>(initialPledges);

  const getArtist = useCallback(
    (id: string) => artists.find((a) => a.id === id),
    [artists],
  );

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  );

  const projectsByArtist = useCallback(
    (artistId: string) => projects.filter((p) => p.artistId === artistId),
    [projects],
  );

  const fundProject = useCallback(
    (projectId: string, amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) return null;
      const rounded = Math.round(amount);
      const project = projects.find((p) => p.id === projectId);
      if (!project || !project.listedForFunding || project.status !== "open") {
        return null;
      }

      let created: Pledge | null = null;

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const raised = p.raised + rounded;
          return {
            ...p,
            raised,
            status: raised >= p.goal ? "funded" : p.status,
          };
        }),
      );

      created = {
        id: makeId("pl"),
        kind: "project",
        artistId: project.artistId,
        projectId,
        amount: rounded,
        createdAt: new Date().toISOString(),
      };
      setPledges((prev) => [created!, ...prev]);
      return created;
    },
    [projects],
  );

  const fundArtist = useCallback(
    (artistId: string, amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) return null;
      const rounded = Math.round(amount);
      const artist = artists.find((a) => a.id === artistId);
      if (!artist) return null;

      setArtists((prev) =>
        prev.map((a) =>
          a.id === artistId
            ? { ...a, artistRaised: a.artistRaised + rounded }
            : a,
        ),
      );

      const created: Pledge = {
        id: makeId("pl"),
        kind: "artist",
        artistId,
        amount: rounded,
        createdAt: new Date().toISOString(),
      };
      setPledges((prev) => [created, ...prev]);
      return created;
    },
    [artists],
  );

  const setProjectListed = useCallback(
    (projectId: string, listed: boolean) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, listedForFunding: listed } : p,
        ),
      );
    },
    [],
  );

  const updateArtist = useCallback((artistId: string, patch: ArtistUpdate) => {
    setArtists((prev) =>
      prev.map((a) => {
        if (a.id !== artistId) return a;
        return {
          ...a,
          ...patch,
          socials: patch.socials
            ? { ...a.socials, ...patch.socials }
            : a.socials,
        };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      artists,
      projects,
      pledges,
      getArtist,
      getProject,
      projectsByArtist,
      fundProject,
      fundArtist,
      setProjectListed,
      updateArtist,
    }),
    [
      artists,
      projects,
      pledges,
      getArtist,
      getProject,
      projectsByArtist,
      fundProject,
      fundArtist,
      setProjectListed,
      updateArtist,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
