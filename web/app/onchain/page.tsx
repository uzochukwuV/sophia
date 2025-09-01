'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { NeuralCreatorPlatformABI } from '@/abis/NeuralCreatorPlatform';
import { ogTestnet } from '@/lib/wagmi';

type ContentItem = {
  id: bigint;
  creator: `0x${string}`;
  title: string;
  description: string;
  contentHash: string;
  thumbnailHash: string;
  aiMetadataHash: string;
  contentType: number;
  artCategory: number;
  price: bigint;
  tips: bigint;
  views: bigint;
  likes: bigint;
  isNFT: boolean;
  nftTokenId: bigint;
  isForSale: boolean;
  createdAt: bigint;
  isActive: boolean;
  tags?: string[];
};

const CONTENT_TYPES = ['TEXT','IMAGE','AUDIO','VIDEO','MIXED','COMIC','DIGITAL_ART'];
const ART_CATEGORIES = ['PAINTING','DRAWING','COMIC','DIGITAL_ART','PHOTOGRAPHY','SCULPTURE','OTHER'];

export default function OnchainContentPage() {
  const { address, isConnected } = useAccount();

  const contractAddress = process.env.NEXT_PUBLIC_PLATFORM_CONTRACT as `0x${string}`;

  // 1) Get content IDs for this creator
  const idsQuery = useReadContract({
    address: contractAddress,
    abi: NeuralCreatorPlatformABI,
    functionName: 'getCreatorContent',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address }
  });

  // 2) Fetch each content struct and tags in a batch
  const contentIds = (idsQuery.data as bigint[] | undefined) || [];

  const reads = contentIds.flatMap((id) => ([
    {
      address: contractAddress,
      abi: NeuralCreatorPlatformABI,
      functionName: 'contents',
      args: [id]
    } as const,
    {
      address: contractAddress,
      abi: NeuralCreatorPlatformABI,
      functionName: 'getContentTags',
      args: [id]
    } as const
  ]));

  const batch = useReadContracts({
    allowFailure: true,
    contracts: reads,
    query: { enabled: contentIds.length > 0 }
  });

  const items: ContentItem[] = [];
  if (batch.data && contentIds.length > 0) {
    for (let i = 0; i < contentIds.length; i++) {
      const contentRes = batch.data[i*2];
      const tagsRes = batch.data[i*2 + 1];
      if (contentRes?.result) {
        const c = contentRes.result as any;
        const tags = (tagsRes?.result as string[]) || [];
        items.push({
          id: c.id,
          creator: c.creator,
          title: c.title,
          description: c.description,
          contentHash: c.contentHash,
          thumbnailHash: c.thumbnailHash,
          aiMetadataHash: c.aiMetadataHash,
          contentType: Number(c.contentType),
          artCategory: Number(c.artCategory),
          price: c.price,
          tips: c.tips,
          views: c.views,
          likes: c.likes,
          isNFT: c.isNFT,
          nftTokenId: c.nftTokenId,
          isForSale: c.isForSale,
          createdAt: c.createdAt,
          isActive: c.isActive,
          tags
        });
      }
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1 ml-64 px-12 py-6">
        <Navbar />
        <h2 className="text-2xl font-semibold mb-6">Your On-chain Content</h2>

        {!isConnected && (
          <div className="text-gray-400">Connect your wallet to view your on-chain content.</div>
        )}

        {isConnected && idsQuery.isLoading && (
          <div className="text-gray-400">Loading content IDs…</div>
        )}

        {isConnected && !idsQuery.isLoading && contentIds.length === 0 && (
          <div className="text-gray-400">No on-chain content found for {address?.slice(0,6)}…{address?.slice(-4)}</div>
        )}

        {isConnected && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id.toString()} className="bg-[#1A1A1A] rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-semibold text-lg">{item.title || `Content #${item.id}`}</div>
                    <div className="text-xs text-gray-400">
                      Type: {CONTENT_TYPES[item.contentType] ?? item.contentType} · Category: {ART_CATEGORIES[item.artCategory] ?? item.artCategory}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(Number(item.createdAt) * 1000).toLocaleString()}
                  </div>
                </div>
                <div className="text-gray-300 text-sm mt-2 line-clamp-3">{item.description}</div>
                <div className="text-xs text-gray-400 mt-2">
                  Root: <span className="font-mono">{item.contentHash.slice(0, 10)}…</span>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="text-xs bg-gray-800 px-2 py-1 rounded-full">#{t}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4 text-gray-400 text-sm">
                  <span className="flex items-center"><span className="material-icons text-base mr-1">favorite_border</span>{item.likes.toString()}</span>
                  <span className="flex items-center"><span className="material-icons text-base mr-1">visibility</span>{item.views.toString()}</span>
                  <span className="flex items-center"><span className="material-icons text-base mr-1">paid</span>{item.tips.toString()}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <a
                    className="text-xs text-blue-400 hover:underline"
                    href={`https://chainscan-newton.0g.ai/address/${contractAddress}`}
                    target="_blank"
                    rel="noreferrer"
                  >View Contract</a>
                  <a
                    className="text-xs text-blue-400 hover:underline"
                    href={`#`}
                    onClick={(e) => e.preventDefault()}
                  >Open in Feed (coming soon)</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}