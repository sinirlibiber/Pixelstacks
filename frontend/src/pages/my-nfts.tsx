import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import NFTCard from '@/components/NFTCard';
import { useWallet } from '@/hooks/useWallet';
import { Wallet } from 'lucide-react';

// Mock — replace with real contract reads
const MOCK_MY_NFTS = Array.from({ length: 6 }, (_, i) => ({
  tokenId: i + 101,
  name: `PixelStack #${String(i + 101).padStart(4, '0')}`,
  image: `https://api.dicebear.com/8.x/pixel-art/svg?seed=myps${i + 1}&backgroundColor=0a0a0f`,
  price: i % 3 === 0 ? Math.floor((Math.random() * 50 + 1) * 1_000_000) : undefined,
  isListed: i % 3 === 0,
}));

export default function MyNFTs() {
  const { isConnected, address, connect } = useWallet();

  if (!isConnected) {
    return (
      <>
        <Head><title>My NFTs — PixelStacks</title></Head>
        <div className="min-h-screen bg-ps-bg">
          <Navbar />
          <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-ps-surface border border-ps-border flex items-center justify-center">
              <Wallet size={28} className="text-ps-muted" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ps-text">Connect your wallet</h2>
              <p className="text-ps-muted mt-2">Connect your Stacks wallet to see your NFTs</p>
            </div>
            <button
              onClick={connect}
              className="btn-primary px-8 py-3 rounded-2xl text-base font-semibold text-white"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My NFTs — PixelStacks</title>
      </Head>

      <div className="min-h-screen bg-ps-bg">
        <Navbar />

        <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-ps-text">My NFTs</h1>
            <p className="text-ps-muted mt-2 font-mono text-sm">
              {address?.slice(0, 10)}...{address?.slice(-6)}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-ps-surface border border-ps-border rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold gradient-text">{MOCK_MY_NFTS.length}</p>
              <p className="text-ps-muted text-sm mt-1">Total NFTs</p>
            </div>
            <div className="bg-ps-surface border border-ps-border rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold gradient-text">{MOCK_MY_NFTS.filter((n) => n.isListed).length}</p>
              <p className="text-ps-muted text-sm mt-1">Listed</p>
            </div>
            <div className="bg-ps-surface border border-ps-border rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold gradient-text">
                {(MOCK_MY_NFTS.filter((n) => n.isListed && n.price).reduce((a, n) => a + (n.price || 0), 0) / 1_000_000).toFixed(1)}
              </p>
              <p className="text-ps-muted text-sm mt-1">Listed Value (STX)</p>
            </div>
          </div>

          {MOCK_MY_NFTS.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-ps-muted text-lg">You don't own any PixelStacks yet</p>
              <Link
                href="/mint"
                className="btn-primary inline-flex mt-6 px-6 py-3 rounded-2xl text-sm font-semibold text-white"
              >
                Mint your first NFT
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {MOCK_MY_NFTS.map((nft) => (
                <NFTCard
                  key={nft.tokenId}
                  tokenId={nft.tokenId}
                  name={nft.name}
                  image={nft.image}
                  owner={address || ''}
                  price={nft.price}
                  isListed={nft.isListed}
                  isOwner={true}
                  onRefresh={() => {}}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
