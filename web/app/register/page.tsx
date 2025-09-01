'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePlatform } from '@/hooks/usePlatform';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const { registerCreator } = usePlatform();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [creatorType, setCreatorType] = useState(2); // HYBRID
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isConnected) {
      setError('Connect wallet first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setTxHash(null);
    try {
      const tx = await registerCreator({
        username,
        bio,
        profileImageHash: '',
        creatorType
      });
      setTxHash(tx as string);
      setUsername('');
      setBio('');
    } catch (e:any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1 ml-64 px-12 py-6">
        <Navbar />
        <div className="max-w-2xl bg-[#1A1A1A] rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Register as Creator</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-gray-300">Wallet</label>
              <div className="text-xs text-gray-400">{isConnected ? address : 'Not connected'}</div>
            </div>
            <div>
              <label className="block text-sm mb-1">Username</label>
              <input
                className="w-full bg-[#111111] border border-gray-700 rounded-md p-2 outline-none focus:border-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. SophiaArt"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Bio</label>
              <textarea
                className="w-full bg-[#111111] border border-gray-700 rounded-md p-2 outline-none focus:border-blue-500"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your fans about your work…"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Creator Type</label>
              <select
                className="w-full bg-[#111111] border border-gray-700 rounded-md p-2 outline-none focus:border-blue-500"
                value={creatorType}
                onChange={(e) => setCreatorType(parseInt(e.target.value))}
              >
                <option value={0}>Traditional Artist</option>
                <option value={1}>AI Creator</option>
                <option value={2}>Hybrid</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={submit}
                disabled={submitting || !username.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md"
              >
                {submitting ? 'Submitting…' : 'Register'}
              </button>
              {error && <span className="text-red-400 text-sm">{error}</span>}
              {txHash && (
                <a
                  className="text-xs text-blue-400 hover:underline"
                  href={`https://chainscan-newton.0g.ai/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}