# PixelStacks 🎨

> NFT Marketplace on the Stacks blockchain, secured by Bitcoin.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/pixelstacks)

## Overview

PixelStacks is a fully on-chain NFT marketplace built on Stacks. Users can mint, list, and buy pixel art NFTs using STX. The smart contract enforces a 5% royalty to original creators on every secondary sale.

## Project Structure

```
pixelstacks/
├── contracts/                  # Clarity smart contracts
│   └── pixelstacks-nft.clar   # SIP-009 NFT + Marketplace
├── tests/                      # Clarinet tests (Deno)
│   └── pixelstacks-nft_test.ts
├── Clarinet.toml               # Clarinet project config
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── pages/             # Next.js pages
│   │   ├── components/        # React components
│   │   ├── hooks/             # Wallet & contract hooks
│   │   └── styles/            # Global CSS
│   ├── .env.local.example     # Environment variables template
│   └── package.json
└── vercel.json                 # Vercel deployment config
```

## Smart Contract Features

- ✅ **SIP-009 compliant** NFT standard
- ✅ **Mint** NFTs for 1 STX
- ✅ **List** NFTs for sale at custom price
- ✅ **Buy** listed NFTs
- ✅ **Unlist** your NFTs
- ✅ **5% Royalties** auto-paid to original creator on secondary sales
- ✅ **10,000 max supply**
- ✅ **Admin functions** for owner

## Frontend Features

- ✅ Stacks wallet connect (Hiro Wallet / Xverse)
- ✅ Mint page with live preview
- ✅ Explore marketplace with search & filters
- ✅ My NFTs dashboard with list/unlist actions
- ✅ Dark pixel art aesthetic UI

---

## Setup & Deployment

### 1. Deploy Smart Contract

Install [Clarinet](https://docs.hiro.so/clarinet/getting-started):

```bash
# Install Clarinet
brew install clarinet   # macOS
# or: https://docs.hiro.so/clarinet/getting-started

# Test contract
clarinet test

# Deploy to testnet
clarinet deployments apply --testnet
```

After deployment, copy your contract address and update `.env.local`.

### 2. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your contract address

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Deploy to Vercel

1. Push repo to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variables from `.env.local`
5. Deploy!

Or use the button at the top of this README.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_STACKS_NETWORK` | `testnet` or `mainnet` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Your deployed contract address |
| `NEXT_PUBLIC_STACKS_API` | Hiro API URL |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Project ID |

---

## Tech Stack

- **Smart Contract**: Clarity (Stacks)
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Wallet**: @stacks/connect (Hiro Wallet, Xverse)
- **Deployment**: Vercel

## License

MIT
