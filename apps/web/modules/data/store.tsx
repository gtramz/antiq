"use client";

import type { Artist, Pledge, Project, Support } from "@antiq/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  artists as seedArtists,
  initialPledges,
  initialProjects,
  initialSupports,
} from "./seed";

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

export type NewProjectInput = {
  artistId: string;
  title: string;
  pitch: string;
  story: string;
  category: Project["category"];
  subcategory: string;
  format: string;
  goal: number;
  listedForFunding?: boolean;
  returnModel?: string;
  coverUrl?: string;
  palette: Project["palette"];
  previewSeconds?: number;
  snippetLabel?: string;
  useOfFunds?: string[];
  targetReleaseDate?: string;
  ownershipSplits?: Project["ownershipSplits"];
};

export type ProjectUpdate = Partial<
  Pick<
    Project,
    | "title"
    | "pitch"
    | "story"
    | "format"
    | "subcategory"
    | "goal"
    | "listedForFunding"
    | "returnModel"
    | "coverUrl"
    | "useOfFunds"
    | "targetReleaseDate"
    | "ownershipSplits"
  >
>;

export type NewArtistInput = {
  name: string;
  bio?: string;
  role: Artist["role"];
  artistGoal?: number;
  ownerUserId?: string;
};

const DEFAULT_PALETTE: Artist["palette"] = {
  bg: "#000000",
  a: "#0B1C33",
  b: "#041018",
  c: "#1E4D7A",
};

type Store = {
  artists: Artist[];
  projects: Project[];
  pledges: Pledge[];
  supports: Support[];
  getArtist: (id: string) => Artist | undefined;
  getProject: (id: string) => Project | undefined;
  getArtistByOwner: (userId: string) => Artist | undefined;
  ensureArtistForUser: (user: { id: string; name: string }) => Artist;
  projectsByArtist: (artistId: string) => Project[];
  fundProject: (projectId: string, amount: number) => Pledge | null;
  fundArtist: (artistId: string, amount: number) => Pledge | null;
  supportProject: (projectId: string, fromArtistId: string) => Support | null;
  unsupportProject: (projectId: string, fromArtistId: string) => boolean;
  supportArtist: (artistId: string, fromArtistId: string) => Support | null;
  unsupportArtist: (artistId: string, fromArtistId: string) => boolean;
  getSupportsForProject: (projectId: string) => Support[];
  getSupportsForArtist: (artistId: string) => Support[];
  hasSupportedProject: (projectId: string, fromArtistId: string) => boolean;
  hasSupportedArtist: (artistId: string, fromArtistId: string) => boolean;
  projectSupportCount: (projectId: string) => number;
  setProjectListed: (projectId: string, listed: boolean) => void;
  addArtist: (input: NewArtistInput) => Artist | null;
  addProject: (input: NewProjectInput) => Project | null;
  updateProject: (projectId: string, patch: ProjectUpdate) => void;
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
  const [supports, setSupports] = useState<Support[]>(initialSupports);

  const getArtist = useCallback(
    (id: string) => artists.find((a) => a.id === id),
    [artists],
  );

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  );

  const getArtistByOwner = useCallback(
    (userId: string) => artists.find((a) => a.ownerUserId === userId),
    [artists],
  );

  const ensureArtistForUser = useCallback(
    (user: { id: string; name: string }): Artist => {
      let result: Artist | null = null;
      setArtists((prev) => {
        const found = prev.find((a) => a.ownerUserId === user.id);
        if (found) {
          result = found;
          return prev;
        }
        const name = user.name.trim() || "Artist";
        const created: Artist = {
          id: makeId("a"),
          name,
          bio: "",
          role: "composer",
          palette: DEFAULT_PALETTE,
          socials: {},
          ownerUserId: user.id,
          artistGoal: 100000,
          artistRaised: 0,
        };
        result = created;
        return [created, ...prev];
      });
      return result!;
    },
    [],
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

  const getSupportsForProject = useCallback(
    (projectId: string) =>
      supports.filter(
        (s) => s.kind === "project" && s.projectId === projectId,
      ),
    [supports],
  );

  const getSupportsForArtist = useCallback(
    (artistId: string) =>
      supports.filter((s) => s.kind === "artist" && s.artistId === artistId),
    [supports],
  );

  const hasSupportedProject = useCallback(
    (projectId: string, fromArtistId: string) =>
      supports.some(
        (s) =>
          s.kind === "project" &&
          s.projectId === projectId &&
          s.fromArtistId === fromArtistId,
      ),
    [supports],
  );

  const hasSupportedArtist = useCallback(
    (artistId: string, fromArtistId: string) =>
      supports.some(
        (s) =>
          s.kind === "artist" &&
          s.artistId === artistId &&
          s.fromArtistId === fromArtistId,
      ),
    [supports],
  );

  const projectSupportCount = useCallback(
    (projectId: string) =>
      supports.filter(
        (s) => s.kind === "project" && s.projectId === projectId,
      ).length,
    [supports],
  );

  const supportProject = useCallback(
    (projectId: string, fromArtistId: string): Support | null => {
      const project = projects.find((p) => p.id === projectId);
      const from = artists.find((a) => a.id === fromArtistId);
      if (!project || !from) return null;
      if (project.artistId === fromArtistId) return null;
      if (
        supports.some(
          (s) =>
            s.kind === "project" &&
            s.projectId === projectId &&
            s.fromArtistId === fromArtistId,
        )
      ) {
        return null;
      }
      const created: Support = {
        id: makeId("sup"),
        kind: "project",
        fromArtistId,
        artistId: project.artistId,
        projectId,
        createdAt: new Date().toISOString(),
      };
      setSupports((prev) => [created, ...prev]);
      return created;
    },
    [artists, projects, supports],
  );

  const unsupportProject = useCallback(
    (projectId: string, fromArtistId: string): boolean => {
      const exists = supports.some(
        (s) =>
          s.kind === "project" &&
          s.projectId === projectId &&
          s.fromArtistId === fromArtistId,
      );
      if (!exists) return false;
      setSupports((prev) =>
        prev.filter(
          (s) =>
            !(
              s.kind === "project" &&
              s.projectId === projectId &&
              s.fromArtistId === fromArtistId
            ),
        ),
      );
      return true;
    },
    [supports],
  );

  const supportArtist = useCallback(
    (artistId: string, fromArtistId: string): Support | null => {
      if (artistId === fromArtistId) return null;
      const target = artists.find((a) => a.id === artistId);
      const from = artists.find((a) => a.id === fromArtistId);
      if (!target || !from) return null;
      if (
        supports.some(
          (s) =>
            s.kind === "artist" &&
            s.artistId === artistId &&
            s.fromArtistId === fromArtistId,
        )
      ) {
        return null;
      }
      const created: Support = {
        id: makeId("sup"),
        kind: "artist",
        fromArtistId,
        artistId,
        createdAt: new Date().toISOString(),
      };
      setSupports((prev) => [created, ...prev]);
      return created;
    },
    [artists, supports],
  );

  const unsupportArtist = useCallback(
    (artistId: string, fromArtistId: string): boolean => {
      const exists = supports.some(
        (s) =>
          s.kind === "artist" &&
          s.artistId === artistId &&
          s.fromArtistId === fromArtistId,
      );
      if (!exists) return false;
      setSupports((prev) =>
        prev.filter(
          (s) =>
            !(
              s.kind === "artist" &&
              s.artistId === artistId &&
              s.fromArtistId === fromArtistId
            ),
        ),
      );
      return true;
    },
    [supports],
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

  const addProject = useCallback(
    (input: NewProjectInput): Project | null => {
      const artist = artists.find((a) => a.id === input.artistId);
      if (!artist) return null;
      if (!input.title.trim() || !Number.isFinite(input.goal) || input.goal <= 0) {
        return null;
      }

      const id = makeId("p");
      const pitch = input.pitch.trim();
      const splits =
        input.ownershipSplits?.filter((s) => s.role.trim()) ??
        [
          {
            id: makeId("split"),
            role: "Artist",
            percent: 50,
          },
        ];
      const project: Project = {
        id,
        artistId: input.artistId,
        title: input.title.trim(),
        pitch,
        story: input.story.trim() || pitch,
        category: input.category,
        subcategory: input.subcategory.trim() || "Electronic",
        format: input.format.trim() || "Single",
        goal: Math.round(input.goal),
        raised: 0,
        seed: id,
        palette: input.palette,
        status: "open",
        listedForFunding: input.listedForFunding ?? true,
        coverUrl: input.coverUrl,
        previewSeconds: input.previewSeconds ?? 36,
        snippetLabel: input.snippetLabel ?? "Preview",
        returnModel: input.returnModel,
        useOfFunds: input.useOfFunds ?? [],
        targetReleaseDate: input.targetReleaseDate || undefined,
        ownershipSplits: splits.map((s) => ({
          id: s.id || makeId("split"),
          role: s.role.trim(),
          percent: Math.max(0, Math.min(100, s.percent)),
        })),
      };

      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [artists],
  );

  const updateProject = useCallback(
    (projectId: string, patch: ProjectUpdate) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const next: Project = { ...p, ...patch };
          if (patch.pitch !== undefined) {
            next.pitch = patch.pitch.trim();
            if (patch.story === undefined) {
              next.story = next.pitch;
            }
          }
          if (patch.story !== undefined) {
            next.story = patch.story.trim();
          }
          if (patch.title !== undefined) {
            next.title = patch.title.trim();
          }
          if (patch.goal !== undefined) {
            next.goal = Math.max(0, Math.round(patch.goal));
            if (next.raised >= next.goal && next.goal > 0) {
              next.status = "funded";
            } else if (next.status === "funded" && next.raised < next.goal) {
              next.status = "open";
            }
          }
          if (patch.ownershipSplits) {
            next.ownershipSplits = patch.ownershipSplits
              .filter((s) => s.role.trim())
              .map((s) => ({
                id: s.id || makeId("split"),
                role: s.role.trim(),
                percent: Math.max(0, Math.min(100, s.percent)),
              }));
          }
          if (patch.useOfFunds) {
            next.useOfFunds = [...patch.useOfFunds];
          }
          if (patch.targetReleaseDate !== undefined) {
            next.targetReleaseDate = patch.targetReleaseDate || undefined;
          }
          return next;
        }),
      );
    },
    [],
  );

  const addArtist = useCallback((input: NewArtistInput): Artist | null => {
    const name = input.name.trim();
    if (!name) return null;
    const goal = Math.max(0, Math.round(input.artistGoal ?? 100000));
    let result: Artist | null = null;
    setArtists((prev) => {
      if (input.ownerUserId) {
        const found = prev.find((a) => a.ownerUserId === input.ownerUserId);
        if (found) {
          result = found;
          return prev;
        }
      }
      const artist: Artist = {
        id: makeId("a"),
        name,
        bio: (input.bio ?? "").trim(),
        role: input.role,
        palette: DEFAULT_PALETTE,
        socials: {},
        ownerUserId: input.ownerUserId,
        artistGoal: goal,
        artistRaised: 0,
      };
      result = artist;
      return [artist, ...prev];
    });
    return result;
  }, []);

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
      supports,
      getArtist,
      getProject,
      getArtistByOwner,
      ensureArtistForUser,
      projectsByArtist,
      fundProject,
      fundArtist,
      supportProject,
      unsupportProject,
      supportArtist,
      unsupportArtist,
      getSupportsForProject,
      getSupportsForArtist,
      hasSupportedProject,
      hasSupportedArtist,
      projectSupportCount,
      setProjectListed,
      addArtist,
      addProject,
      updateProject,
      updateArtist,
    }),
    [
      artists,
      projects,
      pledges,
      supports,
      getArtist,
      getProject,
      getArtistByOwner,
      ensureArtistForUser,
      projectsByArtist,
      fundProject,
      fundArtist,
      supportProject,
      unsupportProject,
      supportArtist,
      unsupportArtist,
      getSupportsForProject,
      getSupportsForArtist,
      hasSupportedProject,
      hasSupportedArtist,
      projectSupportCount,
      setProjectListed,
      addArtist,
      addProject,
      updateProject,
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
