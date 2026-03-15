"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { formatUnits, parseUnits } from "viem";
import { ArrowLeft, Clock, User, CheckCircle, AlertTriangle, DollarSign, Send, Shield } from "lucide-react";
import { CONTRACT_ADDRESS, SKILLSWAP_ABI, USDC_ABI, USDC_ADDRESS_SEPOLIA, JOB_STATUS, MILESTONE_STATUS } from "@/lib/contract";

const STATUS_COLORS: Record<number, string> = {
  0: "badge-open", 1: "badge-progress", 2: "badge-delivered",
  3: "badge-completed", 4: "badge-disputed", 5: "badge-completed", 6: "badge-cancelled"
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useAccount();
  const jobId = BigInt(id || "0");

  const [bidAmount, setBidAmount] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "bids" | "milestones">("overview");

  const { data: job, refetch: refetchJob } = useReadContract({
    address: CONTRACT_ADDRESS, abi: SKILLSWAP_ABI, functionName: "getJob", args: [jobId],
  }) as { data: any; refetch: () => void };

  const { data: bids } = useReadContract({
    address: CONTRACT_ADDRESS, abi: SKILLSWAP_ABI, functionName: "getJobBids", args: [jobId],
  }) as { data: any[] | undefined };

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS_SEPOLIA, abi: USDC_ABI, functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  if (!job) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div className="skeleton" style={{ width: 400, height: 300, borderRadius: 16 }} />
    </div>
  );

  const isClient = address?.toLowerCase() === job.client?.toLowerCase();
  const isFreelancer = address?.toLowerCase() === job.freelancer?.toLowerCase();
  const isAdmin = address?.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();

  const handleApproveAndBid = () => {
    const stakeAmount = parseUnits("5", 6);
    writeContract({
      address: USDC_ADDRESS_SEPOLIA, abi: USDC_ABI,
      functionName: "approve", args: [CONTRACT_ADDRESS, stakeAmount],
    });
  };

  const handlePlaceBid = () => {
    if (!bidAmount || !coverLetter || !deliveryDays) { alert("Fill all bid fields"); return; }
    writeContract({
      address: CONTRACT_ADDRESS, abi: SKILLSWAP_ABI, functionName: "placeBid",
      args: [jobId, parseUnits(parseFloat(bidAmount).toFixed(6), 6), coverLetter, BigInt(deliveryDays)],
    });
  };

  const handleAcceptBid = (bidIndex: number) => {
    writeContract({
      address: CONTRACT_ADDRESS, abi: SKILLSWAP_ABI,
      functionName: "acceptBid", args: [jobId, BigInt(bidIndex)],
    });
  };

  const handleDeliver = (milestoneIndex: number) => {
    if (!deliveryNote) { alert("Add a delivery note"); return; }
    writeContract({
      address: CONTRACT_ADDRESS, abi: SKILLSWAP_ABI,
      functionName: "deliverMilestone", args: [jobId, BigInt(milestoneIndex), deliveryNote],
    });
  };

  const handleApprove = (milestoneIndex: number) => {
    writeContract({
      address: CONTRACT_ADDRESS, abi: SKILLSWAP_ABI,
      functionName: "approveMilestone", args: [jobId, BigInt(milestoneIndex)],
    });
  };

  const handleAutoRelease = () => {
    writeContract({
      address: CONTRACT_ADDRESS, abi: SKILLSWAP_ABI,
      functionName: "triggerAutoRelease", args: [jobId],
    });
  };

  const handleDispute = (milestoneIndex: number) => {
    if (!disputeEvidence) { alert("Please provide evidence (IPFS hash or description)"); return; }
    writeContract({
      address: CONTRACT_ADDRESS, abi: SKILLSWAP_ABI,
      functionName: "raiseDispute", args: [jobId, BigInt(milestoneIndex), disputeEvidence],
    });
  };

  const handleCancelJob = () => {
    if (!confirm("Cancel this job? You'll receive a full refund.")) return;
    writeContract({
      address: CONTRACT_ADDRESS, abi: SKILLSWAP_ABI,
      functionName: "cancelJob", args: [jobId],
    });
  };

  const milestoneStatusColor: Record<number, string> = {
    0: "var(--text-muted)", 1: "var(--amber)", 2: "#A064FF",
    3: "var(--green)", 4: "var(--red)", 5: "var(--green)",
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav className="glass sticky top-0 z-50" style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/jobs" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
            <ArrowLeft size={16} /> All Jobs
          </Link>
          {!isConnected ? <ConnectWallet /> : (
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/profile"><button className="btn-secondary" style={{ padding: "8px 16px" }}>Profile</button></Link>
              {isAdmin && <Link href="/admin"><button className="btn-danger" style={{ padding: "8px 16px" }}>Admin</button></Link>}
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          {/* LEFT COLUMN */}
          <div>
            {/* Job Header */}
            <div className="card" style={{ padding: 32, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <span className={`badge ${STATUS_COLORS[job.status] || "badge-open"}`}>
                  {JOB_STATUS[job.status as keyof typeof JOB_STATUS]}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Job #{job.id?.toString()}
                </span>
              </div>
              <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{job.title}</h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 12, color: "var(--accent)", background: "var(--accent-dim)", padding: "4px 12px", borderRadius: 100, fontFamily: "var(--font-display)", fontWeight: 600 }}>
                  {job.category}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <User size={12} /> {job.client?.slice(0, 10)}...{job.client?.slice(-6)}
                </span>
              </div>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 15 }}>{job.descriptionHash}</p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "var(--bg-card)", borderRadius: 12, padding: 4 }}>
              {(["overview", "bids", "milestones"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: activeTab === tab ? "var(--bg-card-hover)" : "transparent",
                  color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
                  textTransform: "capitalize", transition: "all 0.2s"
                }}>
                  {tab} {tab === "bids" && bids ? `(${bids.filter(b => !b.withdrawn).length})` : ""}
                  {tab === "milestones" && job.milestones ? `(${job.milestones.length})` : ""}
                </button>
              ))}
            </div>

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
              <div className="animate-fade-in">
                {(job.milestones || []).map((m: any, i: number) => (
                  <div key={i} className="card" style={{ padding: 24, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, color: milestoneStatusColor[m.status], fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {MILESTONE_STATUS[m.status as keyof typeof MILESTONE_STATUS]}
                        </span>
                        <h3 className="font-display" style={{ fontSize: 17, marginTop: 4 }}>Milestone {i + 1}: {m.title}</h3>
                      </div>
                      <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}>
                        {formatUnits(m.amount, 6)} USDC
                      </span>
                    </div>
                    {m.description && <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>{m.description}</p>}
                    {m.deliveryNote && (
                      <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>DELIVERY NOTE</div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{m.deliveryNote}</p>
                      </div>
                    )}

                    {/* Freelancer: Deliver */}
                    {isFreelancer && (m.status === 0 || m.status === 1) && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input className="input-base" placeholder="Delivery note or link to work..." value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} />
                        <button className="btn-primary" style={{ whiteSpace: "nowrap" }} onClick={() => handleDeliver(i)} disabled={isPending}>
                          {isPending ? "..." : "Deliver"}
                        </button>
                      </div>
                    )}

                    {/* Client: Approve or Dispute */}
                    {isClient && m.status === 2 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn-primary" style={{ flex: 1, background: "var(--green)" }} onClick={() => handleApprove(i)} disabled={isPending}>
                          <CheckCircle size={14} style={{ marginRight: 6 }} />
                          {isPending ? "..." : "Approve & Release Funds"}
                        </button>
                        <div style={{ display: "flex", gap: 8, width: "100%" }}>
                          <input className="input-base" placeholder="Evidence (IPFS hash or description)..." value={disputeEvidence} onChange={(e) => setDisputeEvidence(e.target.value)} />
                          <button className="btn-danger" style={{ whiteSpace: "nowrap" }} onClick={() => handleDispute(i)} disabled={isPending}>
                            Dispute
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bids Tab */}
            {activeTab === "bids" && (
              <div className="animate-fade-in">
                {(!bids || bids.filter(b => !b.withdrawn).length === 0) ? (
                  <div className="card" style={{ padding: 40, textAlign: "center" }}>
                    <p style={{ color: "var(--text-muted)" }}>No bids yet. Be the first!</p>
                  </div>
                ) : bids.filter(b => !b.withdrawn).map((bid: any, i: number) => (
                  <div key={i} className="card" style={{ padding: 24, marginBottom: 16, borderColor: bid.accepted ? "var(--green)" : "var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {bid.accepted && <CheckCircle size={16} color="var(--green)" />}
                        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          {bid.freelancer?.slice(0, 10)}...{bid.freelancer?.slice(-6)}
                        </span>
                      </div>
                      <span className="font-display" style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}>
                        {formatUnits(bid.proposedAmount, 6)} USDC
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>⏱ {bid.deliveryDays?.toString()} days</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>🔒 5 USDC staked</span>
                    </div>
                    {bid.coverLetter && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>{bid.coverLetter}</p>}
                    {isClient && job.status === 0 && !bid.accepted && (
                      <button className="btn-primary" style={{ width: "100%" }} onClick={() => handleAcceptBid(i)} disabled={isPending}>
                        {isPending ? "Processing..." : "Accept This Bid"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="animate-fade-in">
                <div className="card" style={{ padding: 24 }}>
                  <h3 className="font-display" style={{ fontSize: 17, marginBottom: 16 }}>Milestone Overview</h3>
                  {(job.milestones || []).map((m: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < job.milestones.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: milestoneStatusColor[m.status] }} />
                        <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{m.title}</span>
                      </div>
                      <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: m.status === 3 ? "var(--green)" : "var(--text-secondary)" }}>
                        {formatUnits(m.amount, 6)} USDC
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div>
            {/* Payment Info */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", justify: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Total Budget</div>
                  <div className="font-display" style={{ fontSize: 32, fontWeight: 800, color: "var(--green)" }}>
                    {formatUnits(job.totalAmount || BigInt(0), 6)} USDC
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>Released</span>
                  <span style={{ color: "var(--text-primary)" }}>{formatUnits(job.releasedAmount || BigInt(0), 6)} USDC</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>Milestones</span>
                  <span style={{ color: "var(--text-primary)" }}>{job.milestones?.length || 0}</span>
                </div>
                {job.freelancer && job.freelancer !== "0x0000000000000000000000000000000000000000" && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Freelancer</span>
                    <span style={{ color: "var(--text-primary)", fontFamily: "monospace" }}>
                      {job.freelancer?.slice(0, 6)}...{job.freelancer?.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-release timer */}
            {job.status === 2 && job.autoReleaseAt > BigInt(0) && (
              <div className="card" style={{ padding: 20, marginBottom: 16, background: "var(--amber-dim)", borderColor: "rgba(255,184,48,0.2)" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <Clock size={16} color="var(--amber)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, color: "var(--amber)", fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>Auto-Release Active</div>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>Funds will release automatically 72h after delivery if not reviewed.</p>
                  </div>
                </div>
                <button className="btn-primary" style={{ width: "100%", marginTop: 12, background: "var(--amber)", fontSize: 13 }} onClick={handleAutoRelease} disabled={isPending}>
                  Trigger Auto-Release Now
                </button>
              </div>
            )}

            {/* Place Bid */}
            {isConnected && !isClient && job.status === 0 && (
              <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                <h3 className="font-display" style={{ fontSize: 17, marginBottom: 16 }}>Place a Bid</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Your Price (USDC)</label>
                    <input className="input-base" type="number" placeholder="0.00" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Delivery Days</label>
                    <input className="input-base" type="number" placeholder="7" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Cover Letter</label>
                    <textarea className="input-base" rows={3} placeholder="Why are you the right person for this job?" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} style={{ resize: "vertical" }} />
                  </div>
                  <div style={{ background: "var(--accent-dim)", borderRadius: 10, padding: 12, display: "flex", gap: 8 }}>
                    <Shield size={13} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: "var(--accent)", lineHeight: 1.6 }}>5 USDC stake required. Returned on successful completion.</p>
                  </div>
                  <button className="btn-primary" style={{ width: "100%" }} onClick={handleApproveAndBid} disabled={isPending}>
                    {isPending ? "Processing..." : isSuccess ? "✓ Done!" : "Approve & Place Bid"}
                  </button>
                </div>
              </div>
            )}

            {/* Client actions */}
            {isClient && job.status === 0 && (
              <button className="btn-danger" style={{ width: "100%" }} onClick={handleCancelJob} disabled={isPending}>
                Cancel Job & Refund
              </button>
            )}

            {/* Security notice */}
            <div style={{ padding: 16, display: "flex", gap: 10 }}>
              <Shield size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                All payments are secured by smart contracts on Base. No one can access funds without your approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
