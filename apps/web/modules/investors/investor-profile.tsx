"use client";

import type { Project } from "@antiq/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AccountProfileLayout } from "@/modules/auth/account-profile-layout";
import { useAuth } from "@/context/AuthContext";
import { ProjectCard } from "@/modules/discover/project-card";
import { useStore } from "@/modules/data/store";
import { FundSheet } from "@/modules/funding/fund-sheet";
import { formatMoney } from "@/modules/shell/tokens";

/** Mock starting wallet (MXN) until a real ledger exists. */
const STARTING_BALANCE = 250_000;

/**
 * Investor profile body — wallet + investments under shared Profile chrome.
 */
export function InvestorProfile() {
  const { user } = useAuth();
  const { pledges, getProject, getArtist } = useStore();
  const [fundProjectId, setFundProjectId] = useState<string | null>(null);

  const totalInvested = useMemo(
    () => pledges.reduce((sum, p) => sum + p.amount, 0),
    [pledges],
  );

  const availableBalance = Math.max(0, STARTING_BALANCE - totalInvested);

  const backedProjects = useMemo(() => {
    const byId = new Map<string, Project>();
    for (const pledge of pledges) {
      if (pledge.kind !== "project" || !pledge.projectId) continue;
      const project = getProject(pledge.projectId);
      if (project && !byId.has(project.id)) {
        byId.set(project.id, project);
      }
    }
    return Array.from(byId.values());
  }, [pledges, getProject]);

  if (!user || user.role !== "investor") return null;

  return (
    <>
      <AccountProfileLayout>
        <section
          className="mt-6 rounded-surface border border-white/10 bg-black/20 p-5 backdrop-blur-xl sm:p-6"
          aria-label="Wallet summary"
        >
          <p className="voice text-[10px] tracking-[0.12em] text-tertiary">
            Wallet Summary
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="voice text-[9px] text-tertiary">Available Balance</p>
              <p className="mt-1 font-sans text-[22px] font-bold tabular-nums tracking-[-0.02em] text-ink sm:text-[26px]">
                {formatMoney(availableBalance)}
              </p>
            </div>
            <div>
              <p className="voice text-[9px] text-tertiary">Total Invested</p>
              <p className="mt-1 font-sans text-[22px] font-bold tabular-nums tracking-[-0.02em] text-accent sm:text-[26px]">
                {formatMoney(totalInvested)}
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((totalInvested / STARTING_BALANCE) * 100),
                )}%`,
              }}
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="voice text-[11px] tracking-[0.12em] text-tertiary uppercase">
              Your Investments
            </h2>
            {backedProjects.length > 0 ? (
              <span className="voice text-[9px] text-tertiary/70">
                {backedProjects.length} active
              </span>
            ) : null}
          </div>

          {backedProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {backedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  variant="compact"
                  project={project}
                  artistId={project.artistId}
                  artistName={
                    getArtist(project.artistId)?.name ?? "Artist"
                  }
                  showFundingBadge
                  ctaLabel="Invest more"
                  onBack={() => setFundProjectId(project.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-surface border border-white/10 bg-black/20 px-5 py-12 text-center backdrop-blur-xl">
              <p className="font-sans text-[18px] font-bold text-ink">
                No investments yet
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
                Discover open projects and back the music you believe in.
              </p>
              <Link
                href="/explore"
                className="voice mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#E8E0D0] px-8 text-[12px] font-semibold tracking-[0.06em] text-[#0A121C] transition hover:bg-[#F0EAE0]"
              >
                Discover Projects
              </Link>
            </div>
          )}
        </section>
      </AccountProfileLayout>

      {fundProjectId ? (
        <FundSheet
          mode="project"
          projectId={fundProjectId}
          open
          onClose={() => setFundProjectId(null)}
        />
      ) : null}
    </>
  );
}
