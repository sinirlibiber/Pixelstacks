import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useWallet } from '@/hooks/useWallet';
import { ArrowRight, Zap, Shield, TrendingUp, Grid, Star } from 'lucide-react';

const STATS = [
  { label: 'NFTs Minted', value: '2,847' },
  { label: 'Total Volume', value: '18,430 STX' },
  { label: 'Artists', value: '341' },
  { label: 'Transactions', value: '9,210' },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Built on Stacks — secured by Bitcoin, fast as lightning.',
    color: 'text-yellow-400',
  },
  {
    icon: Shield,
    title: 'Bitcoin-Secured',
    desc: 'Every transaction finalized on the Bitcoin blockchain.',
    color: 'text-green-400',
  },
  {
    icon: TrendingUp,
    title: 'Creator Royalties',
    desc: '5% royalties automatically paid to original creators.',
    color: 'text-ps-accent2',
  },
];

// Mock featured NFTs
const FEATURED = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: `PixelStack #${String(i + 1).padStart(4, '0')}`,
  image: `https://api.dicebear.com/8.x/pixel-art/svg?seed=pixelstacks${i + 1}`,
  price: (Math.random() * 50 + 1).toFixed(1),
}));

export default function Home() {
  const { isConnected, connect } = useWallet();

  return (
    <>
      <Head>
        <title>PixelStacks — NFT Marketplace on Stacks</title>
        <meta name="description" content="Mint, buy, and sell pixel NFTs on the Stacks blockchain, secured by Bitcoin." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-ps-bg grid-bg">
        <Navbar />

        {/* Hero */}
        <section className="relative pt-32 pb-24 px-4 overflow-hidden">
          {/* Glowing orbs */}
          <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-ps-accent/10 blur-3xl pointer-events-none" />
          <div className="absolute top-32 right-1/4 w-64 h-64 rounded-full bg-ps-accent2/10 blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 tag tag-purple mb-6">
              <Star size={10} className="text-ps-neon" />
              Built on Stacks · Secured by Bitcoin
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              The Pixel Art{' '}
              <span className="gradient-text text-glow">NFT Marketplace</span>
              <br />on Stacks
            </h1>

            <p className="text-ps-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Discover, mint, and trade unique pixel art NFTs. Every transaction
              is secured by Bitcoin through the Stacks blockchain.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/explore"
                className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-white"
              >
                Explore Collection
                <ArrowRight size={18} />
              </Link>
              {!isConnected ? (
                <button
                  onClick={connect}
                  className="btn-outline inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-ps-text"
                >
                  Connect Wallet
                </button>
              ) : (
                <Link
                  href="/mint"
                  className="btn-outline inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-ps-text"
                >
                  Mint Now
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-ps-border">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold gradient-text">{s.value}</p>
                  <p className="text-ps-muted text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured NFTs */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-ps-text">Featured NFTs</h2>
                <p className="text-ps-muted mt-1">Handpicked pixel art from our community</p>
              </div>
              <Link
                href="/explore"
                className="btn-outline px-4 py-2 rounded-xl text-sm text-ps-muted flex items-center gap-2"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {FEATURED.map((nft) => (
                <div key={nft.id} className="nft-card rounded-2xl overflow-hidden pixel-border group cursor-pointer">
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-ps-accent/20 to-ps-accent2/20">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ps-bg/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-ps-text truncate">{nft.name}</p>
                    <p className="text-xs text-ps-accent2 mt-0.5 font-mono">{nft.price} STX</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 border-t border-ps-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-ps-text">Why PixelStacks?</h2>
              <p className="text-ps-muted mt-2">The most secure NFT marketplace in the Bitcoin ecosystem</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-ps-surface border border-ps-border rounded-2xl p-6 hover:border-ps-accent transition-colors">
                  <div className={`w-10 h-10 rounded-xl bg-ps-bg flex items-center justify-center mb-4 ${f.color}`}>
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-semibold text-ps-text mb-2">{f.title}</h3>
                  <p className="text-ps-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-ps-surface border border-ps-border rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-ps-accent/5 to-ps-accent2/5 pointer-events-none" />
              <h2 className="text-3xl font-bold text-ps-text mb-4 relative">
                Ready to mint your first <span className="gradient-text">PixelStack</span>?
              </h2>
              <p className="text-ps-muted mb-8 relative">
                Connect your Stacks wallet and join thousands of pixel art creators.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
                {!isConnected ? (
                  <button
                    onClick={connect}
                    className="btn-primary px-8 py-3.5 rounded-2xl text-base font-semibold text-white"
                  >
                    Connect & Start Minting
                  </button>
                ) : (
                  <Link href="/mint" className="btn-primary px-8 py-3.5 rounded-2xl text-base font-semibold text-white">
                    Mint Now — 1 STX
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-ps-border py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-ps-accent to-ps-accent2 flex items-center justify-center text-white font-bold text-xs">PS</div>
              <span className="text-ps-muted text-sm">PixelStacks © 2025</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-ps-muted">
              <Link href="/explore" className="hover:text-ps-text transition-colors">Explore</Link>
              <Link href="/mint" className="hover:text-ps-text transition-colors">Mint</Link>
              <a href="https://stacks.co" target="_blank" rel="noopener noreferrer" className="hover:text-ps-text transition-colors">Stacks</a>
              <a href="https://hiro.so" target="_blank" rel="noopener noreferrer" className="hover:text-ps-text transition-colors">Hiro</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
