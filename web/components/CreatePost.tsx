'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePlatform } from '@/hooks/usePlatform';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ postId: string; rootHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { publishContent } = usePlatform();

  const submit = async () => {
    if (!isConnected || !address) {
      setError('Connect your wallet first.');
      return;
    }
    setCreating(true);
    setError(null);
    setResult(null);
    setTxHash(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BROKER_API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator: address,
          content,
          contentType: 'text',
          tags: [],
          aiEnhance: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create post');
      setResult({ postId: data.postId, rootHash: data.rootHash });

      // Call on-chain publishContent using the Storage root
      const title = content.slice(0, 42) || 'Post';
      const description = content.slice(0, 200);
      const aiMetadataHash = data.aiEnhancement && data.aiReceiptHash ? data.aiReceiptHash : '';
      const tx = await publishContent({
        title,
        description,
        contentHash: data.rootHash,
        thumbnailHash: '',
        aiMetadataHash,
        contentType: 0, // TEXT
        artCategory: 6, // OTHER
        price: 0n,
        tags: []
      });
      setTxHash(tx as string);
      setContent('');
    } catch (e:any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] rounded-xl p-4 mb-8">
      <h3 className="text-lg font-semibold mb-3">Create a post</h3>
      <textarea
        className="w-full bg-[#111111] border border-gray-700 rounded-md p-3 outline-none focus:border-blue-500"
        rows={3}
        placeholder={isConnected ? "Share something with your audience..." : "Connect your wallet to post"}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={creating || !content.trim() || !isConnected}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md"
        >
          {creating ? 'Posting…' : 'Post'}
        </button>
        {error && <span className="text-red-400 text-sm">{error}</span>}
        {result && (
          <span className="text-xs text-gray-400">
            0G Storage root: {result.rootHash.slice(0, 10)}…
          </span>
        )}
        {txHash && (
          <a
            className="text-xs text-blue-400 hover:underline"
            href={`https://chainscan-newton.0g.ai/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View publishContent tx
          </a>
        )}
      </div>
    </div>
  );
}