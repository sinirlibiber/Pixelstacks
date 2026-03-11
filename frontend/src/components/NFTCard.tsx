'use client';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useContractActions } from '@/hooks/useContract';
import { Tag, ShoppingCart, Loader2, ExternalLink } from 'lucide-react';

interface NFTCardProps {
  tokenId: number;
  name: string;
  image: string;
  owner: string;
  price?: number;
  isListed?: boolean;
  isOwner?: boolean;
  onRefresh?: () => void;
}

export default function NFTCard({
  tokenId,
  name,
  image,
  owner,
  price,
  isListed = false,
  isOwner = false,
  onRefresh,
}: NFTCardProps) {
  const { isConnected, address } = useWallet();
  const { buyNFT, listNFT, unlistNFT } = useContractActions();
  const [loading, setLoading] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const [showListForm, setShowListForm] = useState(false);

  const priceInSTX = price ? (price / 1_000_000).toFixed(2) : null;

  const handleBuy = async () => {
    if (!address || !price) return;
    setLoading(true);
    try {
      await buyNFT(tokenId, price, address, () => {
        onRefresh?.();
      });
    } finally {
      setLoading(false);
    }
  };

  const handleList = async () => {
    const priceInMicro = Math.floor(parseFloat(listPrice) * 1_000_000);
    if (!priceInMicro || priceInMicro <= 0) return;
    setLoading(true);
    try {
      await listNFT(tokenId, priceInMicro, () => {
        setShowListForm(false);
        onRefresh?.();
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlist = async () => {
    setLoading(true);
    try {
      await unlistNFT(tokenId, () => { onRefresh?.(); });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nft-card rounded-2xl overflow-hidden pixel-border group">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-ps-accent/20 to-ps-accent2/20">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${tokenId}`;
          }}
        />
        {isListed && (
          <div className="absolute top-3 right-3">
            <span className="tag tag-green">Listed</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="tag tag-purple font-mono">#{tokenId}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-ps-text truncate">{name}</h3>
          <p className="text-xs text-ps-muted mt-0.5 font-mono">
            {owner.slice(0, 8)}...{owner.slice(-4)}
          </p>
        </div>

        {/* Price */}
        {isListed && price && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ps-muted">Price</p>
              <p className="font-bold text-ps-accent2">{priceInSTX} STX</p>
            </div>
            <a
              href={`https://explorer.hiro.so/txid/${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ps-muted hover:text-ps-text transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Actions */}
        {isConnected && (
          <div className="space-y-2">
            {/* Buy button for listed NFTs not owned by user */}
            {isListed && !isOwner && (
              <button
                onClick={handleBuy}
                disabled={loading}
                className="btn-primary w-full py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                Buy Now
              </button>
            )}

            {/* Owner actions */}
            {isOwner && !isListed && !showListForm && (
              <button
                onClick={() => setShowListForm(true)}
                className="btn-outline w-full py-2 rounded-xl text-sm font-semibold text-ps-text flex items-center justify-center gap-2"
              >
                <Tag size={14} />
                List for Sale
              </button>
            )}

            {isOwner && isListed && (
              <button
                onClick={handleUnlist}
                disabled={loading}
                className="btn-outline w-full py-2 rounded-xl text-sm font-semibold text-red-400 border-red-400/30 hover:bg-red-400/10"
              >
                {loading ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                Unlist
              </button>
            )}

            {/* List form */}
            {showListForm && (
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Price in STX"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  className="w-full bg-ps-bg border border-ps-border rounded-xl px-3 py-2 text-sm text-ps-text placeholder-ps-muted focus:outline-none focus:border-ps-accent"
                  min="0"
                  step="0.1"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleList}
                    disabled={loading || !listPrice}
                    className="btn-primary flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                  >
                    {loading ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowListForm(false)}
                    className="btn-outline flex-1 py-2 rounded-xl text-sm font-semibold text-ps-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
