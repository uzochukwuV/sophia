'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API = process.env.NEXT_PUBLIC_BROKER_API_URL as string;

export function useFeed() {
  const qc = useQueryClient();

  const feedQuery = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/feed?limit=20`);
      if (!res.ok) throw new Error('Failed to load feed');
      return res.json() as Promise<{ success: boolean; items: any[]; total: number }>;
    },
    refetchOnWindowFocus: false
  });

  const likeMutation = useMutation({
    mutationFn: async ({ user, rootHash }: { user: string; rootHash: string }) => {
      const res = await fetch(`${API}/api/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'like', user, targetId: rootHash })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to like');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async ({ user, rootHash, content }: { user: string; rootHash: string; content: string }) => {
      const res = await fetch(`${API}/api/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'comment', user, targetId: rootHash, content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to comment');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    }
  });

  return {
    feedQuery,
    like: likeMutation.mutateAsync,
    comment: commentMutation.mutateAsync,
  };
}