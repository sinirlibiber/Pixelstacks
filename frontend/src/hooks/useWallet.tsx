'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
  ? new StacksMainnet()
  : new StacksTestnet();

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
export const CONTRACT_NAME = 'pixelstacks-nft';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
  userData: any;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  connect: () => {},
  disconnect: () => {},
  userData: null,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setIsConnected(true);
      setUserData(data);
      setAddress(data.profile.stxAddress.testnet);
    }
  }, []);

  const connect = useCallback(() => {
    showConnect({
      appDetails: {
        name: 'PixelStacks',
        icon: '/logo.png',
      },
      redirectTo: '/',
      onFinish: () => {
        const data = userSession.loadUserData();
        setIsConnected(true);
        setUserData(data);
        setAddress(data.profile.stxAddress.testnet);
      },
      userSession,
    });
  }, []);

  const disconnect = useCallback(() => {
    userSession.signUserOut('/');
    setIsConnected(false);
    setAddress(null);
    setUserData(null);
  }, []);

  return (
    <WalletContext.Provider value={{ isConnected, address, connect, disconnect, userData }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
