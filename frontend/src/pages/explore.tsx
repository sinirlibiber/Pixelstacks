import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import NFTCard from '@/components/NFTCard';
import { useWallet } from '@/hooks/useWallet';
import { Search, Filter, Grid, List, SlidersHorizontal } from 'lucide-react';

// Mock data — replace with real API calls once contract is deployed
const MOCK_NFTS = Array.from({ length: 24 }, (_, i) => ({
  tokenId: i + 1,
  name: `PixelStack #${String(i + 1).padStart(4, '0')}`,
  image: `https://api.dicebear.com/8.x/pixel-art/svg?seed=ps${i + 1}&backgroundColor=0a0a0f`,
  owner: `ST${Math.random().toString(36).slice(2, 10).toUpperCase()}ABCDEF`,
  price: Math.random() > 0.4 ? Math.floor((Math.random() * 100 + 1) * 1_000_000) : undefined,
  isListed: Math.random() > 0.4,
}));

const SORT_OPTIONS = ['Recently Listed', 'Price: Low to High', 'Price: High to Low', 'Token ID'];

export default function Explore() {
  const { address } = useWallet();
  const [nfts, setNfts] = useState(MOCK_NFTS);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Recently Listed');
  const [filterListed, setFilterListed] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = nfts
    .filter((n) => {
      if (filterListed && !n.isListed) return false;
      if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'Price: Low to High') return (a.price || 0) - (b.price || 0);
      if (sort === 'Price: High to Low') return (b.price || 0) - (a.price || 0);
      if (sort === 'Token ID') return a.tokenId - b.tokenId;
      return b.tokenId - a.tokenId;
    });

  return (
    <>
      <Head>
        <title>Explore — PixelStacks</title>
        <meta name="description" content="Browse and buy pixel art NFTs on PixelStacks marketplace." />
      </Head>

      <div className="min-h-screen bg-ps-bg">
        <Navbar />

        <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-ps-text">Explore</h1>
            <p className="text-ps-muted mt-2">
              {filtered.length} NFTs · {MOCK_NFTS.filter((n) => n.isListed).length} listed
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ps-muted" />
              <input
                type="text"
                placeholder="Search by name or token ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-ps-surface border border-ps-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-ps-text placeholder-ps-muted focus:outline-none focus:border-ps-accent transition-colors"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-ps-surface border border-ps-border rounded-xl px-4 py-2.5 text-sm text-ps-text focus:outline-none focus:border-ps-accent"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>

            {/* Listed filter */}
            <button
              onClick={() => setFilterListed(!filterListed)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                filterListed
                  ? 'bg-ps-accent text-white border-ps-accent'
                  : 'bg-ps-surface text-ps-muted border-ps-border hover:border-ps-accent'
              }`}
            >
              <SlidersHorizontal size={14} />
              Listed Only
            </button>
          </div>

          {/* NFT Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="aspect-square shimmer" />
                  <div className="p-4 space-y-2 bg-ps-surface">
                    <div className="h-4 rounded shimmer" />
                    <div className="h-3 w-2/3 rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-ps-muted text-lg">No NFTs found</p>
              <p className="text-ps-muted/60 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filtered.map((nft) => (
                <NFTCard
                  key={nft.tokenId}
                  tokenId={nft.tokenId}
                  name={nft.name}
                  image={nft.image}
                  owner={nft.owner}
                  price={nft.price}
                  isListed={nft.isListed}
                  isOwner={address === nft.owner}
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
