"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddProjectSheet } from "@/modules/artists/add-project-sheet";
import { AccountProfileLayout } from "@/modules/auth/account-profile-layout";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/modules/data/store";
import { formatMoney } from "@/modules/shell/tokens";

/**
 * Artist account body — one catalog profile, list/create funding projects.
 */
export function ArtistProfileDashboard() {
  const { user } = useAuth();
  const { ensureArtistForUser, getArtistByOwner, projectsByArtist } =
    useStore();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (user?.role !== "artist") return;
    ensureArtistForUser({ id: user.id, name: user.name });
  }, [user, ensureArtistForUser]);

  if (!user || user.role !== "artist") return null;

  const myArtist = getArtistByOwner(user.id);
  if (!myArtist) {
    return (
      <AccountProfileLayout>
        <p className="mt-8 text-[14px] text-muted">Setting up your profile…</p>
      </AccountProfileLayout>
    );
  }

  const myProjects = projectsByArtist(myArtist.id);

  return (
    <>
      <AccountProfileLayout>
        <section className="mt-8 rounded-surface border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
          <h2 className="voice text-[11px] tracking-[0.12em] text-tertiary uppercase">
            Your projects
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Upload and fund singles, EPs, and albums — rap, reggaeton, corrido
            tumbado, and more.
          </p>

          {myProjects.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {myProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/project/${project.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-white/20"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-ink">
                        {project.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-muted">
                        {project.format}
                        {project.listedForFunding
                          ? ` · ${formatMoney(project.raised)} / ${formatMoney(project.goal)}`
                          : " · Not listed"}
                      </span>
                    </span>
                    <span className="shrink-0 text-tertiary" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[13px] text-muted">
              No projects yet. Add your first single, EP, or album to fund.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="voice flex h-12 items-center justify-center rounded-full bg-[#E8E0D0] px-6 text-[12px] font-semibold tracking-[0.06em] text-[#0A121C]"
            >
              Add project
            </button>
            <Link
              href={`/artist/${myArtist.id}`}
              className="voice flex h-12 items-center justify-center rounded-full border border-white/15 bg-black/20 px-6 text-[12px] text-ink"
            >
              View public profile
            </Link>
          </div>
        </section>
      </AccountProfileLayout>

      <AddProjectSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        artistId={myArtist.id}
        artistRole={myArtist.role}
        palette={myArtist.palette}
      />
    </>
  );
}
