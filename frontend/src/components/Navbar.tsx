'use client';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useState } from 'react';
import { Menu, X, Wallet, LogOut, Copy, Check } from 'lucide-react';

export default function Navbar() {
  const { isConnected, address, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-ps-border bg-ps-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ps-accent to-ps-accent2 flex items-center justify-center text-white font-bold text-sm">
              PS
            </div>
            <span className="font-display font-bold text-lg gradient-text">PixelStacks</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/explore" className="text-ps-muted hover:text-ps-text transition-colors text-sm font-medium">
              Explore
            </Link>
            <Link href="/mint" className="text-ps-muted hover:text-ps-text transition-colors text-sm font-medium">
              Mint
            </Link>
            <Link href="/auto-mint" className="text-ps-muted hover:text-ps-text transition-colors text-sm font-medium">
              Auto Mint
            </Link>
            <Link
              href="/multi-mint"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-ps-accent text-white hover:opacity-90 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Multi Mint
            </Link>
            {isConnected && (
              <Link href="/my-nfts" className="text-ps-muted hover:text-ps-text transition-colors text-sm font-medium">
                My NFTs
              </Link>
            )}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ps-surface border border-ps-border text-sm text-ps-muted hover:text-ps-text transition-all"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {shortAddress}
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
                <button
                  onClick={disconnect}
                  className="p-2 rounded-lg hover:bg-ps-surface text-ps-muted hover:text-red-400 transition-all"
                  title="Disconnect"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              >
                <Wallet size={15} />
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-ps-muted hover:text-ps-text"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-ps-border bg-ps-surface px-4 py-4 space-y-3">
          <Link href="/explore" className="block text-ps-muted hover:text-ps-text py-2">Explore</Link>
          <Link href="/mint" className="block text-ps-muted hover:text-ps-text py-2">Mint</Link>
          <Link href="/auto-mint" className="block text-ps-muted hover:text-ps-text py-2">Auto Mint</Link>
          <Link href="/multi-mint" className="block py-2 font-semibold text-purple-400">⚡ Multi Mint</Link>
          {isConnected && (
            <Link href="/my-nfts" className="block text-ps-muted hover:text-ps-text py-2">My NFTs</Link>
          )}
          <div className="pt-2 border-t border-ps-border">
            {isConnected ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-ps-muted">{shortAddress}</span>
                <button onClick={disconnect} className="text-red-400 text-sm">Disconnect</button>
              </div>
            ) : (
              <button onClick={connect} className="btn-primary w-full py-2 rounded-xl text-sm font-semibold text-white">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
