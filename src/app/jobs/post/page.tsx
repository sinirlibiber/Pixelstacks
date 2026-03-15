"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { parseUnits } from "viem";
import { Plus, Trash2, ArrowLeft, Info } from "lucide-react";
import { CONTRACT_ADDRESS, SKILLSWAP_ABI, USDC_ABI, USDC_ADDRESS_SEPOLIA, JOB_CATEGORIES } from "@/lib/contract";
import { useRouter } from "next/navigation";

type Milestone = { title: string; description: string; amount: string };

export default function PostJobPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(JOB_CATEGORIES[0]);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: "", description: "", amount: "" },
  ]);
  const [step, setStep] = useState<"form" | "approve" | "post" | "done">("form");

  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const fee = totalAmount * 0.02;
  const totalWithFee = totalAmount + fee;

  // USDC allowance check
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS_SEPOLIA,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // Approve USDC
  const { writeContract: approve, data: approveTxHash, isPending: approveIsPending } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    query: {
      enabled: !!approveTxHash,
    },
  });

  // Post Job
  const { writeContract: postJob, data: postTxHash, isPending: postIsPending } = useWriteContract();
  const { isSuccess: postSuccess, data: postReceipt } = useWaitForTransactionReceipt({
    hash: postTxHash,
    query: { enabled: !!postTxHash },
  });

  const addMilestone = () => {
    if (milestones.length >= 10) return;
    setMilestones([...milestones, { title: "", description: "", amount: "" }]);
  };

  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, idx) => idx !== i));
  };

  const updateMilestone = (i: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones];
    updated[i][field] = value;
    setMilestones(updated);
  };

  const validate = () => {
    if (!title.trim()) { alert("Please enter a job title"); return false; }
    if (!description.trim()) { alert("Please enter a job description"); return false; }
    for (const m of milestones) {
      if (!m.title.trim()) { alert("All milestones need a title"); return false; }
      if (!m.amount || parseFloat(m.amount) <= 0) { alert("All milestones need an amount > 0"); return false; }
    }
    return true;
  };

  const handleApprove = async () => {
    if (!validate()) return;
    setStep("approve");
    const totalUsdc = parseUnits(totalWithFee.toFixed(6), 6);
    approve({
      address: USDC_ADDRESS_SEPOLIA,
      abi: USDC_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, totalUsdc],
    });
  };

  const handlePost = () => {
    setStep("post");
    postJob({
      address: CONTRACT_ADDRESS,
      abi: SKILLSWAP_ABI,
      functionName: "postJob",
      args: [
        title,
        description, // In production, upload to IPFS first
        category,
        milestones.map((m) => m.title),
        milestones.map((m) => m.description),
        milestones.map((m) => parseUnits(parseFloat(m.amount).toFixed(6), 6)),
      ],
    });
  };

  // Auto-proceed after approval
  if (approveSuccess && step === "approve") {
    refetchAllowance();
  }

  if (postSuccess) {
    setStep("done");
  }

  if (!isConnected) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <h2 className="font-display" style={{ fontSize: 24, marginBottom: 16 }}>Connect Wallet to Post a Job</h2>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav className="glass sticky top-0 z-50" style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/jobs" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
            <ArrowLeft size={16} /> Back to Jobs
          </Link>
          <span className="font-display gradient-text" style={{ fontSize: 20, fontWeight: 800 }}>SkillSwap</span>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 className="font-display" style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Post a Job</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 48 }}>Funds are locked in escrow until work is approved.</p>

        {/* Success state */}
        {step === "done" && (
          <div className="card animate-fade-in" style={{ padding: 48, textAlign: "center", background: "linear-gradient(135deg, rgba(0,208,132,0.08), transparent)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 className="font-display" style={{ fontSize: 28, marginBottom: 12 }}>Job Posted!</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Your job is live on Base. Freelancers can now place bids.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="/jobs"><button className="btn-primary">View All Jobs</button></Link>
              <Link href="/profile"><button className="btn-secondary">My Profile</button></Link>
            </div>
          </div>
        )}

        {step !== "done" && (
          <>
            {/* Job Details */}
            <div className="card" style={{ padding: 32, marginBottom: 24 }}>
              <h2 className="font-display" style={{ fontSize: 20, marginBottom: 24 }}>Job Details</h2>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  Job Title *
                </label>
                <input className="input-base" placeholder="e.g. Build a responsive landing page" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  Category *
                </label>
                <select className="input-base" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                  Description *
                </label>
                <textarea className="input-base" rows={5} placeholder="Describe the work in detail — requirements, deliverables, technical specs..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: "vertical" }} />
              </div>
            </div>

            {/* Milestones */}
            <div className="card" style={{ padding: 32, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 className="font-display" style={{ fontSize: 20 }}>Milestones</h2>
                <button onClick={addMilestone} className="btn-secondary" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }} disabled={milestones.length >= 10}>
                  <Plus size={14} /> Add Milestone
                </button>
              </div>

              {milestones.map((m, i) => (
                <div key={i} style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span className="font-display" style={{ fontSize: 14, color: "var(--accent)", fontWeight: 700 }}>Milestone {i + 1}</span>
                    {milestones.length > 1 && (
                      <button onClick={() => removeMilestone(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12, marginBottom: 12 }}>
                    <input className="input-base" placeholder="Milestone title" value={m.title} onChange={(e) => updateMilestone(i, "title", e.target.value)} />
                    <div style={{ position: "relative" }}>
                      <input className="input-base" type="number" placeholder="0.00" value={m.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} style={{ paddingRight: 60 }} />
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 700 }}>USDC</span>
                    </div>
                  </div>
                  <input className="input-base" placeholder="Describe what will be delivered in this milestone" value={m.description} onChange={(e) => updateMilestone(i, "description", e.target.value)} />
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="card" style={{ padding: 24, marginBottom: 32, background: "linear-gradient(135deg, rgba(79,127,255,0.05), transparent)" }}>
              <h3 className="font-display" style={{ fontSize: 16, marginBottom: 16 }}>Payment Summary</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {milestones.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "var(--text-secondary)" }}>Milestone {i + 1}: {m.title || "Untitled"}</span>
                    <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                      {m.amount || "0"} USDC
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "var(--text-muted)" }}>Platform fee (2%)</span>
                  <span style={{ color: "var(--text-muted)" }}>{fee.toFixed(2)} USDC</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="font-display" style={{ fontSize: 16, fontWeight: 800 }}>Total to lock</span>
                  <span className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "var(--green)" }}>{totalWithFee.toFixed(2)} USDC</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16, background: "var(--accent-dim)", borderRadius: 10, padding: 12 }}>
                <Info size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: "var(--accent)", lineHeight: 1.6 }}>
                  Funds are locked in the smart contract until milestones are approved. Freelancers are paid per milestone. If cancelled before a freelancer is assigned, full refund is given.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {step === "form" && (
              <button className="btn-primary" style={{ width: "100%", fontSize: 16, padding: 16 }} onClick={handleApprove}>
                Approve USDC & Post Job →
              </button>
            )}

            {step === "approve" && (
              <div>
                <button className="btn-primary" style={{ width: "100%", fontSize: 16, padding: 16 }} disabled={approveIsPending}>
                  {approveIsPending ? "⏳ Approving USDC..." : approveSuccess ? "✓ Approved! Proceed below" : "Approving..."}
                </button>
                {approveSuccess && (
                  <button className="btn-primary animate-fade-in" style={{ width: "100%", fontSize: 16, padding: 16, marginTop: 12, background: "var(--green)" }} onClick={handlePost}>
                    Post Job on Base →
                  </button>
                )}
              </div>
            )}

            {step === "post" && (
              <button className="btn-primary" style={{ width: "100%", fontSize: 16, padding: 16 }} disabled>
                {postIsPending ? "⏳ Posting job on-chain..." : "Processing..."}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
