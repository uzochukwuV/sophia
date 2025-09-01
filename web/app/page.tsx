'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { useFeed } from '@/hooks/useFeed';
import { useAccount } from 'wagmi';

export default function Home() {
  const { feedQuery, like, comment } = useFeed();
  const { address, isConnected } = useAccount();

  const items = feedQuery.data?.items || [];

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1 ml-64 px-12 py-6">
        <Navbar />

        <div className="feed-header flex items-center border-b border-gray-700 mb-8 space-x-6">
          <button className="active text-white border-b-2 border-[#0096FF] pb-2">Home</button>
          <button className="text-gray-400 hover:text-white pb-2">Following</button>
          <button className="text-gray-400 hover:text-white pb-2">Trending</button>
        </div>

        <CreatePost />

        {items.length === 0 && (
          <>
            <div className="text-gray-400 text-sm mb-4">No posts yet. Be the first to create one.</div>
          </>
        )}

        {items.map((item, idx) => {
          const content = item.content || {};
          const title = content.title || 'Post';
          const description = content.content || item.excerpt || '';
          const handle = (item.creator || '0x').slice(0, 6);
          const likes = item.metrics?.likes || 0;
          const comments = item.metrics?.comments || 0;
          const rootHash = item.rootHash as string;

          return (
            <PostCard
              key={rootHash}
              reversed={idx % 2 === 1}
              image="https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?q=80&w=1080&auto=format&fit=crop"
              badgeIcon={content.aiMetadata ? 'auto_awesome' : 'article'}
              badgeText={content.aiMetadata ? 'AI Enhanced' : 'Post'}
              badgeColorClass={content.aiMetadata ? 'text-purple-400' : 'text-gray-300'}
              title={title}
              description={description}
              creatorAvatar="https://api.dicebear.com/7.x/identicon/svg?seed=creator"
              creatorHandle={handle}
              metrics={{ likes, comments }}
              showActions
              rootHash={rootHash}
              onLike={async () => {
                if (!isConnected || !address) return;
                await like({ user: address, rootHash });
              }}
              onComment={async (text) => {
                if (!isConnected || !address) return;
                await comment({ user: address, rootHash, content: text });
              }}
            />
          );
        })}
      </main>
    </div>
  );
}