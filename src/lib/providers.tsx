"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { OnchainKitProvider } from "@coinbase/onchainkit";

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    coinbaseWallet({
      appName: "SkillSwap",
      appLogoUrl: (process.env.NEXT_PUBLIC_URL || "") + "/logo.png",
      preference: "smartWalletOnly",
    }),
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const paymasterUrl = process.env.NEXT_PUBLIC_CDP_PAYMASTER_URL;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ""}
          chain={baseSepolia}
          config={{
            appearance: {
              mode: "dark",
              name: "SkillSwap",
              logo: (process.env.NEXT_PUBLIC_URL || "") + "/logo.png",
            },
            paymaster: paymasterUrl || undefined,
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
