"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { Shield, AlertTriangle, CheckCircle, XCircle, Scale, DollarSign, ArrowLeft, FileText } from "lucide-react";
import { CONTRACT_ADDRESS, SKILLSWAP_ABI, DISPUTE_OUTCOME } from "@/lib/contract";

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase() || "";

type Dispute = {
  jobId: bigint;
  milestoneIndex: bigint;
  raisedBy: string;
  clientEvidence: string;
  freelancerEvidence: string;
  raisedAt: bigint;
  resolvedAt: bigint;
  outcome: number;
  clientAmount: bigint;
  freelancerAmount: bigint;
  adminNote: string;
  resolved: boolean;
};

type Job = {
  id: bigint;
  client: string;
  freelancer: string;
  title: string;
  totalAmount: bigint;
  releasedAmount: bigint;
  status: number;
  milestones: any[];
};

function DisputeCard({ disputeId }: { disputeId: number }) {
  const [outcome, setOutcome] = useState(1);
  const [clientAmt, setClientAmt] = useState("");
  const [freelancerAmt, setFreelancerAmt] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [expanded, setExpanded] = useState(false);

  const { data: dispute } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getDispute",
    args: [BigInt(disputeId)],
  }) as { data: Dispute | undefined };

  const { data: job } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getJob",
    args: dispute ? [dispute.jobId] : undefined,
    query: { enabled: !!dispute },
  }) as { data: Job | undefined };

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  if (!dispute || !job) return (
    <div className="skeleton" style={{ height: 80, borderRadius: 16 }} />
  );

  const handleResolve = () => {
    if (!adminNote.trim()) { alert("Please add an admin note explaining your decision."); return; }

    let cAmt = BigInt(0), fAmt = BigInt(0);
    if (outcome === 3) {
      // Split
      const disputedAmount = job.totalAmount - job.releasedAmount;
      const clientPct = parseFloat(clientAmt) / 100;
      const freelancerPct = parseFloat(freelancerAmt) / 100;
      cAmt = BigInt(Math.floor(Number(disputedAmount) * clientPct));
      fAmt = disputedAmount - cAmt;
      if (Math.abs(clientPct + freelancerPct - 1) > 0.01) {
        alert("Split percentages must add up to 100%"); return;
      }
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SKILLSWAP_ABI,
      functionName: "resolveDispute",
      args: [BigInt(disputeId), outcome, cAmt, fAmt, adminNote],
    });
  };

  const timeAgo = (ts: bigint) => {
    const seconds = Math.floor(Date.now() / 1000) - Number(ts);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {dispute.resolved ? (
              <CheckCircle size={16} color="var(--green)" />
            ) : (
              <AlertTriangle size={16} color="var(--red)" />
            )}
            <span className="font-display" style={{ fontSize: 13, fontWeight: 700, color: dispute.resolved ? "var(--green)" : "var(--red)" }}>
              {dispute.resolved ? "RESOLVED" : "OPEN DISPUTE"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>#{disputeId}</span>
          </div>
          <h3 className="font-display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
            Job #{job.id.toString()}: {job.title}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Raised {timeAgo(dispute.raisedAt)}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "var(--green)" }}>
            {formatUnits(job.totalAmount, 6)} USDC
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>total job value</div>
        </div>
      </div>

      {/* Participants */}
      <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-display)" }}>Client</div>
          <div style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "monospace" }}>
            {job.client.slice(0, 10)}...{job.client.slice(-6)}
          </div>
          {dispute.clientEvidence && (
            <a href={`https://ipfs.io/ipfs/${dispute.clientEvidence}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4, marginTop: 8, textDecoration: "none" }}>
              <FileText size={12} /> View Evidence
            </a>
          )}
        </div>
        <div style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-display)" }}>Freelancer</div>
          <div style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "monospace" }}>
            {job.freelancer !== "0x0000000000000000000000000000000000000000"
              ? `${job.freelancer.slice(0, 10)}...${job.freelancer.slice(-6)}`
              : "Not assigned"}
          </div>
          {dispute.freelancerEvidence && (
            <a href={`https://ipfs.io/ipfs/${dispute.freelancerEvidence}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4, marginTop: 8, textDecoration: "none" }}>
              <FileText size={12} /> View Evidence
            </a>
          )}
        </div>
      </div>

      {/* Resolved result */}
      {dispute.resolved && (
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ background: "var(--green-dim)", border: "1px solid rgba(0,208,132,0.2)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--green)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 6 }}>
              OUTCOME: {DISPUTE_OUTCOME[dispute.outcome as keyof typeof DISPUTE_OUTCOME]}
            </div>
            {dispute.adminNote && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{dispute.adminNote}</p>
            )}
          </div>
        </div>
      )}

      {/* Admin resolution form */}
      {!dispute.resolved && (
        <div style={{ borderTop: "1px solid var(--border)", padding: 24 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-secondary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Scale size={14} />
            {expanded ? "Hide Resolution Form" : "Resolve Dispute"}
          </button>

          {expanded && (
            <div style={{ marginTop: 24 }} className="animate-fade-in">
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 8, fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Decision
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[
                    { value: 1, label: "Client Wins", icon: XCircle, color: "var(--red)" },
                    { value: 2, label: "Freelancer Wins", icon: CheckCircle, color: "var(--green)" },
                    { value: 3, label: "Split", icon: Scale, color: "var(--amber)" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOutcome(opt.value)}
                      style={{
                        background: outcome === opt.value ? `${opt.color}20` : "var(--bg-secondary)",
                        border: `1px solid ${outcome === opt.value ? opt.color : "var(--border)"}`,
                        borderRadius: 10, padding: "12px 8px", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        transition: "all 0.2s"
                      }}
                    >
                      <opt.icon size={16} color={opt.color} />
                      <span style={{ fontSize: 12, color: opt.color, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {outcome === 3 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Client % (0-100)</label>
                    <input className="input-base" type="number" min="0" max="100" placeholder="40"
                      value={clientAmt} onChange={(e) => setClientAmt(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Freelancer % (0-100)</label>
                    <input className="input-base" type="number" min="0" max="100" placeholder="60"
                      value={freelancerAmt} onChange={(e) => setFreelancerAmt(e.target.value)} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Admin Note (required)</label>
                <textarea
                  className="input-base"
                  rows={3}
                  placeholder="Explain your reasoning for this decision..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button
                className="btn-primary"
                style={{ width: "100%" }}
                onClick={handleResolve}
                disabled={isPending || isConfirming}
              >
                {isPending || isConfirming ? "Processing..." : isSuccess ? "✓ Resolved!" : "Confirm Resolution"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  const { data: totalDisputes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getTotalDisputes",
  });

  const { data: totalJobs } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "getTotalJobs",
  });

  const { data: accFees } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SKILLSWAP_ABI,
    functionName: "accumulatedFees",
  });

  const { writeContract, data: feesTxHash, isPending: feesIsPending } = useWriteContract();
  const { isSuccess: feesSuccess } = useWaitForTransactionReceipt({ hash: feesTxHash });

  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_ADDRESS;

  if (!isConnected) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <Shield size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h2 className="font-display" style={{ fontSize: 24, marginBottom: 8 }}>Admin Panel</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Connect your admin wallet to continue</p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <XCircle size={48} color="var(--red)" style={{ margin: "0 auto 16px" }} />
          <h2 className="font-display" style={{ fontSize: 24, marginBottom: 8 }}>Access Denied</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
            This wallet ({address?.slice(0, 10)}...) is not authorized.
          </p>
          <Link href="/"><button className="btn-secondary">← Go Home</button></Link>
        </div>
      </div>
    );
  }

  const disputeIds = totalDisputes
    ? Array.from({ length: Number(totalDisputes) }, (_, i) => i + 1)
    : [];

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav className="glass sticky top-0 z-50" style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span className="font-display gradient-text" style={{ fontSize: 22, fontWeight: 800 }}>SkillSwap</span>
            </Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="font-display" style={{ fontSize: 14, color: "var(--red)", fontWeight: 700 }}>Admin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} className="animate-pulse-dot" />
            <span style={{ fontSize: 13, color: "var(--green)", fontFamily: "var(--font-display)", fontWeight: 700 }}>Admin Active</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 className="font-display" style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 48 }}>Manage disputes and platform operations</p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 }}>
          {[
            { label: "Total Jobs", value: totalJobs?.toString() || "0", color: "var(--accent)" },
            { label: "Total Disputes", value: totalDisputes?.toString() || "0", color: "var(--red)" },
            { label: "Accumulated Fees", value: `${formatUnits(accFees as bigint || BigInt(0), 6)} USDC`, color: "var(--green)" },
            { label: "Admin Address", value: `${address?.slice(0, 8)}...`, color: "var(--amber)" },
          ].map((stat) => (
            <div key={stat.label} className="card" style={{ padding: 24 }}>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: stat.color, marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Fee Withdrawal */}
        {(accFees as bigint) > BigInt(0) && (
          <div className="card" style={{ padding: 24, marginBottom: 32, background: "linear-gradient(135deg, rgba(0,208,132,0.05), transparent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 className="font-display" style={{ fontSize: 18, marginBottom: 4 }}>Platform Fees Available</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  {formatUnits(accFees as bigint, 6)} USDC ready to withdraw
                </p>
              </div>
              <button
                className="btn-primary"
                style={{ background: "var(--green)" }}
                onClick={() => writeContract({
                  address: CONTRACT_ADDRESS,
                  abi: SKILLSWAP_ABI,
                  functionName: "withdrawFees",
                  args: [address!],
                })}
                disabled={feesIsPending}
              >
                <DollarSign size={14} style={{ marginRight: 6 }} />
                {feesIsPending ? "Withdrawing..." : feesSuccess ? "✓ Withdrawn!" : "Withdraw Fees"}
              </button>
            </div>
          </div>
        )}

        {/* Disputes */}
        <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
          Disputes ({disputeIds.length})
        </h2>

        {disputeIds.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <CheckCircle size={48} color="var(--green)" style={{ margin: "0 auto 16px" }} />
            <h3 className="font-display" style={{ fontSize: 20, marginBottom: 8 }}>No disputes</h3>
            <p style={{ color: "var(--text-muted)" }}>The platform is running smoothly.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {disputeIds.reverse().map((id) => (
              <DisputeCard key={id} disputeId={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
