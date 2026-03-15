"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { Search, Plus, Briefcase, Clock, DollarSign, User } from "lucide-react";
import { CONTRACT_ADDRESS, SKILLSWAP_ABI, JOB_STATUS, JOB_CATEGORIES } from "@/lib/contract";
import { formatUnits } from "viem";

type Job = {
  id: bigint;
  client: string;
  freelancer: string;
  title: string;
  descriptionHash: string;
  category: string;
  totalAmount: bigint;
  releasedAmount: bigint;
  platformFeeAmount: bigint;
  status: number;
  createdAt: bigint;
  assignedAt: bigint;
  completedAt: bigint;
  autoReleaseAt: bigint;
  milestones: any[];
  freelancerStake: bigint;
};

function StatusBadge({ status }: { status: number }) {
  const classes: Record<number, string> = {
    0: "badge-open",
    1: "badge-progress",
    2: "badge-delivered",
    3: "badge-completed",
    4: "badge-disputed",
    5: "badge-completed",
    6: "badge-cancelled",
  };
  return (
    <span className={`badge ${classes[status] || "badge-open"}`}>
      {JOB_STATUS[status as keyof typeof JOB_STATUS]}
    </span>
  );
}

function JobCard({ job }: { job: Job }) {
  const timeAgo = (ts: bigint) => {
    const seconds = Math.floor(Date.now() / 1000) - Number(ts);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Link href={`/jobs/${job.id}`} style={{ textDecoration: "none" }}>
      <div className="card" style={{ padding: 24, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <StatusBadge status={job.status} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{timeAgo(job.createdAt)}</span>
        </div>

        <h3 className="font-display" style={{ fontSize: 17, marginBottom: 8, fontWeight: 700 }}>
          {job.title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "var(--accent)", background: "var(--accent-dim)", padding: "3px 10px", borderRadius: 100, fontFamily: "var(--font-display)", fontWeight: 600 }}>
            {job.category}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {job.milestones.length} milestone{job.milestones.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <DollarSign size={14} color="var(--green)" />
            <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}>
              {formatUnits(job.totalAmount, 6)} USDC
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <User size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
              {job.client.slice(0, 6)}...{job.client.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function JobsPage() {
  const { isConnected } = useAccount();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: totalJobs } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getTotalJobs",
  });

  const jobIds = totalJobs
    ? Array.from({ length: Number(totalJobs) }, (_, i) => i + 1)
    : [];

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav className="glass sticky top-0 z-50" style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display gradient-text" style={{ fontSize: 22, fontWeight: 800 }}>SkillSwap</span>
          </Link>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {isConnected ? (
              <>
                <Link href="/profile"><button className="btn-secondary" style={{ padding: "8px 16px" }}>My Profile</button></Link>
                <Link href="/jobs/post"><button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={14} />Post Job</button></Link>
              </>
            ) : (
              <ConnectWallet />
            )}
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 32px" }}>
        <h1 className="font-display" style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Browse Jobs</h1>
        <p style={{ color: "var(--text-secondary)" }}>Find work with trustless escrow payments on Base</p>
      </div>

      {/* FILTERS */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 32px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input
              className="input-base"
              style={{ paddingLeft: 40 }}
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-base"
            style={{ width: "auto", minWidth: 180 }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* JOBS GRID */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        {jobIds.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <Briefcase size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
            <h3 className="font-display" style={{ fontSize: 20, marginBottom: 8, color: "var(--text-secondary)" }}>No jobs yet</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Be the first to post a job on SkillSwap</p>
            <Link href="/jobs/post">
              <button className="btn-primary">Post a Job</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {jobIds.map((id) => (
              <JobFetcher key={id} jobId={id} search={search} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobFetcher({ jobId, search, category }: { jobId: number; search: string; category: string }) {
  const { data: job } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getJob",
    args: [BigInt(jobId)],
  });

  if (!job) return null;

  const j = job as unknown as Job;

  if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return null;
  if (category !== "all" && j.category !== category) return null;
  if (j.status === 6) return null; // Hide cancelled

  return <JobCard job={j} />;
}
