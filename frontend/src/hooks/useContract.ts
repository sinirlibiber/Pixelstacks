'use client';
import { openContractCall } from '@stacks/connect';
import {
  uintCV,
  principalCV,
  standardPrincipalCV,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  makeContractSTXPostCondition,
  AnchorMode,
} from '@stacks/transactions';
import { userSession, network, CONTRACT_ADDRESS, CONTRACT_NAME } from './useWallet';

export function useContractActions() {
  const mintNFT = async (recipientAddress: string, onSuccess?: () => void) => {
    await openContractCall({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'mint',
      functionArgs: [standardPrincipalCV(recipientAddress)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [
        makeStandardSTXPostCondition(
          recipientAddress,
          FungibleConditionCode.Equal,
          BigInt(1000000)
        ),
      ],
      anchorMode: AnchorMode.Any,
      appDetails: { name: 'PixelStacks', icon: '/logo.png' },
      userSession,
      onFinish: (data) => {
        console.log('Mint TX:', data.txId);
        onSuccess?.();
      },
    });
  };

  const listNFT = async (tokenId: number, price: number, onSuccess?: () => void) => {
    await openContractCall({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'list-nft',
      functionArgs: [uintCV(tokenId), uintCV(price)],
      postConditionMode: PostConditionMode.Allow,
      anchorMode: AnchorMode.Any,
      appDetails: { name: 'PixelStacks', icon: '/logo.png' },
      userSession,
      onFinish: (data) => {
        console.log('List TX:', data.txId);
        onSuccess?.();
      },
    });
  };

  const unlistNFT = async (tokenId: number, onSuccess?: () => void) => {
    await openContractCall({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'unlist-nft',
      functionArgs: [uintCV(tokenId)],
      postConditionMode: PostConditionMode.Allow,
      anchorMode: AnchorMode.Any,
      appDetails: { name: 'PixelStacks', icon: '/logo.png' },
      userSession,
      onFinish: (data) => {
        console.log('Unlist TX:', data.txId);
        onSuccess?.();
      },
    });
  };

  const buyNFT = async (tokenId: number, price: number, buyerAddress: string, onSuccess?: () => void) => {
    await openContractCall({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'buy-nft',
      functionArgs: [uintCV(tokenId)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [
        makeStandardSTXPostCondition(
          buyerAddress,
          FungibleConditionCode.LessEqual,
          BigInt(price)
        ),
      ],
      anchorMode: AnchorMode.Any,
      appDetails: { name: 'PixelStacks', icon: '/logo.png' },
      userSession,
      onFinish: (data) => {
        console.log('Buy TX:', data.txId);
        onSuccess?.();
      },
    });
  };

  return { mintNFT, listNFT, unlistNFT, buyNFT };
}

// Read contract data via API
export async function getListedNFTs() {
  const apiBase = process.env.NEXT_PUBLIC_STACKS_API || 'https://api.testnet.hiro.so';
  try {
    const res = await fetch(
      `${apiBase}/extended/v1/tokens/nft/holdings?asset_identifiers=${CONTRACT_ADDRESS}.${CONTRACT_NAME}::pixelstacks-nft&limit=50`
    );
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Error fetching NFTs:', e);
    return [];
  }
}

export async function getNFTMetadata(tokenId: number) {
  const apiBase = process.env.NEXT_PUBLIC_STACKS_API || 'https://api.testnet.hiro.so';
  try {
    const res = await fetch(
      `${apiBase}/extended/v1/tokens/nft/metadata?asset_identifier=${CONTRACT_ADDRESS}.${CONTRACT_NAME}::pixelstacks-nft&token_id=${tokenId}`
    );
    return await res.json();
  } catch (e) {
    return null;
  }
}
