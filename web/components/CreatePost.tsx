'use client';

import { useState } from 'react';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ postId: string; rootHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setCreating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BROKER_API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator: '0xCreatorAddress', // replace with connected wallet address
          content,
          contentType: 'text',
          tags: [],
          aiEnhance: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create post');
      setResult({ postId: data.postId, rootHash: data.rootHash });
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
        placeholder="Share something with your audience..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={creating || !content.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md"
        >
          {creating ? 'Posting…' : 'Post'}
        </button>
        {error && <span className="text-red-400 text-sm">{error}</span>}
        {result && (
          <span className="text-xs text-gray-400">
            Stored on 0G: {result.rootHash.slice(0, 10)}… (postId {result.postId})
          </span>
        )}
      </div>
    </div>
  );
}