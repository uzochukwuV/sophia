'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NeuralCreatorPlatformABI } from '@/abis/NeuralCreatorPlatform';

export function usePlatform() {
  const { data: hash, writeContractAsync, isPending } = useWriteContract();

  const registerCreator = async (args: {
    username: string;
    bio: string;
    profileImageHash?: string;
    creatorType: number; // 0=TRADITIONAL_ARTIST,1=AI_CREATOR,2=HYBRID
  }) => {
    const txHash = await writeContractAsync({
      address: process.env.NEXT_PUBLIC_PLATFORM_CONTRACT as `0x${string}`,
      abi: NeuralCreatorPlatformABI,
      functionName: 'registerCreator',
      args: [args.username, args.bio, args.profileImageHash || '', args.creatorType]
    });
    return txHash;
  };

  const publishContent = async (args: {
    title: string;
    description: string;
    contentHash: string;
    thumbnailHash?: string;
    aiMetadataHash?: string;
    contentType: number; // enum index
    artCategory: number; // enum index
    price?: bigint; // in wei
    tags: string[];
  }) => {
    const txHash = await writeContractAsync({
      address: process.env.NEXT_PUBLIC_PLATFORM_CONTRACT as `0x${string}`,
      abi: NeuralCreatorPlatformABI,
      functionName: 'publishContent',
      args: [
        args.title,
        args.description,
        args.contentHash,
        args.thumbnailHash || '',
        args.aiMetadataHash || '',
        args.contentType,
        args.artCategory,
        args.price ?? 0n,
        args.tags
      ]
    });
    return txHash;
  };

  const waitForTx = (hash?: `0x${string}`) => {
    return useWaitForTransactionReceipt({ hash });
  };

  return {
    registerCreator,
    publishContent,
    isPending,
    txHash: hash,
    waitForTx
  };
}