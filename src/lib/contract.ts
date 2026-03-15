// SkillSwap Contract Configuration
// Update CONTRACT_ADDRESS after deployment

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";

export const USDC_ADDRESS_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`;
export const USDC_ADDRESS_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;

export const SKILLSWAP_ABI = [
  // Events
  {
    type: "event",
    name: "JobPosted",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "amount", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "BidPlaced",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "freelancer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "stakeAmount", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "BidAccepted",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "freelancer", type: "address", indexed: true }
    ]
  },
  {
    type: "event",
    name: "MilestoneDelivered",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "milestoneIndex", type: "uint256", indexed: false },
      { name: "freelancer", type: "address", indexed: true }
    ]
  },
  {
    type: "event",
    name: "MilestoneApproved",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "milestoneIndex", type: "uint256", indexed: false },
      { name: "amount", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "JobCompleted",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "freelancer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "DisputeRaised",
    inputs: [
      { name: "disputeId", type: "uint256", indexed: true },
      { name: "jobId", type: "uint256", indexed: true },
      { name: "raisedBy", type: "address", indexed: true }
    ]
  },
  {
    type: "event",
    name: "DisputeResolved",
    inputs: [
      { name: "disputeId", type: "uint256", indexed: true },
      { name: "outcome", type: "uint8", indexed: false }
    ]
  },
  // Read Functions
  {
    type: "function",
    name: "getJob",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "id", type: "uint256" },
        { name: "client", type: "address" },
        { name: "freelancer", type: "address" },
        { name: "title", type: "string" },
        { name: "descriptionHash", type: "string" },
        { name: "category", type: "string" },
        { name: "totalAmount", type: "uint256" },
        { name: "releasedAmount", type: "uint256" },
        { name: "platformFeeAmount", type: "uint256" },
        { name: "status", type: "uint8" },
        { name: "createdAt", type: "uint256" },
        { name: "assignedAt", type: "uint256" },
        { name: "completedAt", type: "uint256" },
        { name: "autoReleaseAt", type: "uint256" },
        {
          name: "milestones",
          type: "tuple[]",
          components: [
            { name: "title", type: "string" },
            { name: "description", type: "string" },
            { name: "amount", type: "uint256" },
            { name: "status", type: "uint8" },
            { name: "deliveredAt", type: "uint256" },
            { name: "deliveryNote", type: "string" }
          ]
        },
        { name: "freelancerStake", type: "uint256" }
      ]
    }]
  },
  {
    type: "function",
    name: "getJobBids",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [{
      type: "tuple[]",
      components: [
        { name: "freelancer", type: "address" },
        { name: "proposedAmount", type: "uint256" },
        { name: "coverLetter", type: "string" },
        { name: "deliveryDays", type: "uint256" },
        { name: "stakeAmount", type: "uint256" },
        { name: "createdAt", type: "uint256" },
        { name: "accepted", type: "bool" },
        { name: "withdrawn", type: "bool" }
      ]
    }]
  },
  {
    type: "function",
    name: "getUserProfile",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "totalJobsCompleted", type: "uint256" },
        { name: "totalJobsAsClient", type: "uint256" },
        { name: "totalEarned", type: "uint256" },
        { name: "totalSpent", type: "uint256" },
        { name: "disputesWon", type: "uint256" },
        { name: "disputesLost", type: "uint256" },
        { name: "reputationScore", type: "uint256" },
        { name: "isRegistered", type: "bool" },
        { name: "joinedAt", type: "uint256" }
      ]
    }]
  },
  {
    type: "function",
    name: "getDispute",
    stateMutability: "view",
    inputs: [{ name: "disputeId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "jobId", type: "uint256" },
        { name: "milestoneIndex", type: "uint256" },
        { name: "raisedBy", type: "address" },
        { name: "clientEvidence", type: "string" },
        { name: "freelancerEvidence", type: "string" },
        { name: "raisedAt", type: "uint256" },
        { name: "resolvedAt", type: "uint256" },
        { name: "outcome", type: "uint8" },
        { name: "clientAmount", type: "uint256" },
        { name: "freelancerAmount", type: "uint256" },
        { name: "adminNote", type: "string" },
        { name: "resolved", type: "bool" }
      ]
    }]
  },
  {
    type: "function",
    name: "getClientJobs",
    stateMutability: "view",
    inputs: [{ name: "client", type: "address" }],
    outputs: [{ type: "uint256[]" }]
  },
  {
    type: "function",
    name: "getFreelancerJobs",
    stateMutability: "view",
    inputs: [{ name: "freelancer", type: "address" }],
    outputs: [{ type: "uint256[]" }]
  },
  {
    type: "function",
    name: "getTotalJobs",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "getTotalDisputes",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "platformFeeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "accumulatedFees",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "isAutoReleaseReady",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }]
  },
  // Write Functions
  {
    type: "function",
    name: "registerUser",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "postJob",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "descriptionHash", type: "string" },
      { name: "category", type: "string" },
      { name: "milestoneTitles", type: "string[]" },
      { name: "milestoneDescriptions", type: "string[]" },
      { name: "milestoneAmounts", type: "uint256[]" }
    ],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "placeBid",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "proposedAmount", type: "uint256" },
      { name: "coverLetterHash", type: "string" },
      { name: "deliveryDays", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "withdrawBid",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "bidIndex", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "acceptBid",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "bidIndex", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "deliverMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" },
      { name: "deliveryNote", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "approveMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "triggerAutoRelease",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "raiseDispute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "milestoneIndex", type: "uint256" },
      { name: "evidenceHash", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "submitEvidence",
    stateMutability: "nonpayable",
    inputs: [
      { name: "disputeId", type: "uint256" },
      { name: "evidenceHash", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "resolveDispute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "disputeId", type: "uint256" },
      { name: "outcome", type: "uint8" },
      { name: "clientAmount", type: "uint256" },
      { name: "freelancerAmount", type: "uint256" },
      { name: "adminNote", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "cancelJob",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "withdrawFees",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "setPlatformFee",
    stateMutability: "nonpayable",
    inputs: [{ name: "newFeeBps", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  }
] as const;

export const USDC_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }]
  }
] as const;

// Job status labels
export const JOB_STATUS = {
  0: "Open",
  1: "In Progress",
  2: "Delivered",
  3: "Completed",
  4: "Disputed",
  5: "Resolved",
  6: "Cancelled"
} as const;

// Milestone status labels
export const MILESTONE_STATUS = {
  0: "Pending",
  1: "In Progress",
  2: "Delivered",
  3: "Approved",
  4: "Disputed",
  5: "Resolved"
} as const;

// Dispute outcome labels
export const DISPUTE_OUTCOME = {
  0: "None",
  1: "Client Wins",
  2: "Freelancer Wins",
  3: "Split"
} as const;

export const JOB_CATEGORIES = [
  "Software Development",
  "Design & Creative",
  "Writing & Translation",
  "Marketing",
  "Video & Animation",
  "Music & Audio",
  "Data & Analytics",
  "Business Consulting",
  "Legal",
  "Other"
];
