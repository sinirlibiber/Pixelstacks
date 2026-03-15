"use client";

import { useAccount, useReadContract } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import Link from "next/link";
import { formatUnits } from "viem";
import { Star, Briefcase, DollarSign, Shield, Award } from "lucide-react";
import { CONTRACT_ADDRESS, SKILLSWAP_ABI, JOB_STATUS } from "@/lib/contract";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  const { data: profile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getUserProfile",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as { data: any };

  const { data: clientJobIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getClientJobs",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as { data: bigint[] | undefined };

  const { data: freelancerJobIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getFreelancerJobs",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }) as { data: bigint[] | undefined };

  if (!isConnected) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ textAlign: "center" }}>
        <h2 className="font-display" style={{ fontSize: 24, marginBottom: 16 }}>Connect to view your profile</h2>
        <ConnectWallet />
      </div>
    </div>
  );

  const reputationScore = Number(profile?.reputationScore || 0);
  const reputationLabel = reputationScore >= 800 ? "Excellent" : reputationScore >= 600 ? "Good" : reputationScore >= 400 ? "Fair" : "New";
  const reputationColor = reputationScore >= 800 ? "var(--green)" : reputationScore >= 600 ? "var(--accent)" : reputationScore >= 400 ? "var(--amber)" : "var(--text-muted)";

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <nav className="glass sticky top-0 z-50" style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display gradient-text" style={{ fontSize: 22, fontWeight: 800 }}>SkillSwap</span>
          </Link>
          <Link href="/jobs"><button className="btn-secondary" style={{ padding: "8px 16px" }}>Browse Jobs</button></Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Profile Header */}
        <div className="card" style={{ padding: 32, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-dim)", border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <span className="font-display" style={{ fontSize: 24, color: "var(--accent)" }}>
                {address?.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>{address}</div>
            {profile?.joinedAt && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Member since {new Date(Number(profile.joinedAt) * 1000).toLocaleDateString()}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Reputation Score</div>
            <div className="font-display" style={{ fontSize: 48, fontWeight: 800, color: reputationColor }}>{reputationScore}</div>
            <div style={{ fontSize: 14, color: reputationColor, fontFamily: "var(--font-display)", fontWeight: 700 }}>{reputationLabel}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { icon: Briefcase, label: "Jobs Completed", value: profile?.totalJobsCompleted?.toString() || "0", color: "var(--accent)" },
            { icon: DollarSign, label: "Total Earned", value: `${formatUnits(profile?.totalEarned || BigInt(0), 6)} USDC`, color: "var(--green)" },
            { icon: Shield, label: "Disputes Won", value: profile?.disputesWon?.toString() || "0", color: "var(--amber)" },
            { icon: Award, label: "Jobs as Client", value: profile?.totalJobsAsClient?.toString() || "0", color: "#A064FF" },
          ].map((stat) => (
            <div key={stat.label} className="card" style={{ padding: 20, textAlign: "center" }}>
              <stat.icon size={20} color={stat.color} style={{ margin: "0 auto 10px" }} />
              <div className="font-display" style={{ fontSize: 20, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Job History */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 20, marginBottom: 16 }}>Jobs as Client ({clientJobIds?.length || 0})</h2>
            {(!clientJobIds || clientJobIds.length === 0) ? (
              <div className="card" style={{ padding: 32, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>No jobs posted yet</p>
                <Link href="/jobs/post"><button className="btn-primary">Post a Job</button></Link>
              </div>
            ) : clientJobIds.map((id) => <JobRow key={id.toString()} jobId={id} />)}
          </div>
          <div>
            <h2 className="font-display" style={{ fontSize: 20, marginBottom: 16 }}>Jobs as Freelancer ({freelancerJobIds?.length || 0})</h2>
            {(!freelancerJobIds || freelancerJobIds.length === 0) ? (
              <div className="card" style={{ padding: 32, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>No jobs taken yet</p>
                <Link href="/jobs"><button className="btn-primary">Browse Jobs</button></Link>
              </div>
            ) : freelancerJobIds.map((id) => <JobRow key={id.toString()} jobId={id} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobRow({ jobId }: { jobId: bigint }) {
  const { data: job } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getJob",
    args: [jobId],
  }) as { data: any };

  if (!job) return <div className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 12 }} />;

  const statusColors: Record<number, string> = {
    0: "var(--accent)", 1: "var(--amber)", 2: "#A064FF",
    3: "var(--green)", 4: "var(--red)", 5: "var(--green)", 6: "var(--text-muted)"
  };

  return (
    <Link href={`/jobs/${job.id}`} style={{ textDecoration: "none" }}>
      <div className="card" style={{ padding: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>{job.title}</div>
          <span style={{ fontSize: 11, color: statusColors[job.status], fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase" }}>
            {JOB_STATUS[job.status as keyof typeof JOB_STATUS]}
          </span>
        </div>
        <span className="font-display" style={{ fontSize: 15, fontWeight: 800, color: "var(--green)" }}>
          {formatUnits(job.totalAmount, 6)} USDC
        </span>
      </div>
    </Link>
  );
}
