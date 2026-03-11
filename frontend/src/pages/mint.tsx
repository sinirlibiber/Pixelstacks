import Head from 'next/head';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useWallet } from '@/hooks/useWallet';
import { useContractActions } from '@/hooks/useContract';
import { Zap, Info, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

const EXPLORER_BASE = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
  ? 'https://explorer.hiro.so'
  : 'https://explorer.hiro.so';

export default function Mint() {
  const { isConnected, address, connect } = useWallet();
  const { mintNFT } = useContractActions();
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [previewSeed] = useState(() => Math.floor(Math.random() * 10000));

  const handleMint = async () => {
    if (!address) return;
    setLoading(true);
    try {
      await mintNFT(address, () => {
        setLoading(false);
      });
    } catch (e) {
      setLoading(false);
    }
  };

  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'mainnet';

  return (
    <>
      <Head>
        <title>Mint — PixelStacks</title>
        <meta name="description" content="Mint your unique PixelStacks NFT on the Stacks blockchain." />
      </Head>

      <div className="min-h-screen bg-ps-bg grid-bg">
        <Navbar />

        <main className="pt-28 pb-16 px-4 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* NFT Preview */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-ps-accent/20 to-ps-accent2/20 border border-ps-border">
                <img
                  src={`https://api.dicebear.com/8.x/pixel-art/svg?seed=${previewSeed}&backgroundColor=0a0a0f`}
                  alt="NFT Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ps-bg/40 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="tag tag-purple">Preview · Random on Mint</span>
                </div>
              </div>

              <div className="bg-ps-surface border border-ps-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-ps-text mb-3">Collection Info</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-ps-bg rounded-xl p-3">
                    <p className="text-ps-muted text-xs">Contract</p>
                    <p className="text-ps-text font-mono text-xs mt-1">pixelstacks-nft</p>
                  </div>
                  <div className="bg-ps-bg rounded-xl p-3">
                    <p className="text-ps-muted text-xs">Standard</p>
                    <p className="text-ps-text font-mono text-xs mt-1">SIP-009</p>
                  </div>
                  <div className="bg-ps-bg rounded-xl p-3">
                    <p className="text-ps-muted text-xs">Max Supply</p>
                    <p className="text-ps-text font-mono text-xs mt-1">10,000</p>
                  </div>
                  <div className="bg-ps-bg rounded-xl p-3">
                    <p className="text-ps-muted text-xs">Royalties</p>
                    <p className="text-ps-text font-mono text-xs mt-1">5%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mint Panel */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-ps-text">Mint Your <span className="gradient-text">PixelStack</span></h1>
                <p className="text-ps-muted mt-3 leading-relaxed">
                  Each PixelStack is a unique, algorithmically generated pixel art NFT stored on the
                  Stacks blockchain and secured by Bitcoin.
                </p>
              </div>

              {/* Price Card */}
              <div className="bg-ps-surface border border-ps-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-ps-muted text-sm">Mint Price</span>
                  <div className="flex items-center gap-2">
                    <span className="tag tag-green text-sm">FREE MINT</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ps-muted">Network</span>
                  <span className="text-ps-accent2">Stacks Mainnet</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-ps-muted">Blockchain</span>
                  <span className="text-ps-text">Bitcoin (via Stacks)</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-ps-muted">Gas fee only</span>
                  <span className="text-ps-muted">~0.001 STX</span>
                </div>
              </div>

              {/* Info box */}
              <div className="flex gap-3 p-4 bg-ps-accent/10 border border-ps-accent/20 rounded-xl">
                <Info size={16} className="text-ps-accent shrink-0 mt-0.5" />
                <p className="text-sm text-ps-muted leading-relaxed">
                  Minting requires a Stacks wallet (Hiro Wallet or Xverse). Your NFT will appear
                  in your wallet within a few blocks.
                </p>
              </div>

              {/* Success message */}
              {txId && (
                <div className="flex gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-400 font-medium">Mint submitted!</p>
                    <a
                      href={`${EXPLORER_BASE}/txid/${txId}?chain=${network}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ps-muted hover:text-ps-text flex items-center gap-1 mt-1"
                    >
                      View transaction <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              )}

              {/* Mint Button */}
              {!isConnected ? (
                <button
                  onClick={connect}
                  className="btn-primary w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  Connect Wallet to Mint
                </button>
              ) : (
                <button
                  onClick={handleMint}
                  disabled={loading}
                  className="btn-primary w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Mint for FREE
                    </>
                  )}
                </button>
              )}

              <p className="text-xs text-center text-ps-muted">
                By minting, you agree to our Terms of Service. Only gas fee (~0.001 STX) required.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
