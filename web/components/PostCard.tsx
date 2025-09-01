'use client';

import { useState } from 'react';

type PostCardProps = {
  reversed?: boolean;
  image: string;
  badgeIcon: string;
  badgeText: string;
  badgeColorClass: string; // e.g., text-purple-400
  title: string;
  description: string;
  price?: string;
  creatorAvatar: string;
  creatorHandle: string;
  metrics?: {
    likes: number | string;
    comments: number | string;
  };
  extraRightTop?: React.ReactNode;
  extraMiddle?: React.ReactNode;
  // Social actions
  rootHash?: string;
  onLike?: () => Promise<void> | void;
  onComment?: (text: string) => Promise<void> | void;
  showActions?: boolean;
};

export default function PostCard(props: PostCardProps) {
  const {
    reversed,
    image,
    badgeIcon,
    badgeText,
    badgeColorClass,
    title,
    description,
    price,
    creatorAvatar,
    creatorHandle,
    metrics,
    extraRightTop,
    extraMiddle,
    onLike,
    onComment,
    showActions
  } = props;

  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitComment = async () => {
    if (!onComment || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await onComment(commentText.trim());
      setCommentText('');
      setCommentOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`post-card bg-[#1A1A1A] rounded-2xl mb-8 overflow-hidden flex gap-6 p-6 ${reversed ? 'flex-row-reverse' : ''}`}>
      <div className="w-1/2 relative">
        <img alt={title} className="rounded-lg object-cover w-full h-full" src={image} />
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center text-xs">
          <span className={`material-icons text-sm mr-1 ${badgeColorClass}`}>{badgeIcon}</span>
          {badgeText}
        </div>
        {extraRightTop}
      </div>

      <div className="w-1/2 flex flex-col">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 mb-4 flex-grow">{description}</p>

        {price && (
          <div className="flex items-center space-x-2 text-sm mb-4">
            <span className="material-icons text-sm text-green-400">paid</span>
            <span className="text-green-400 font-semibold">{price}</span>
            <span className="text-gray-500">·</span>
            <button className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-semibold hover:bg-green-500/30">
              Tip Creator
            </button>
          </div>
        )}

        {extraMiddle}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center">
            <img alt={`${creatorHandle} avatar`} className="w-10 h-10 rounded-full mr-3" src={creatorAvatar} />
            <div>
              <p className="text-white font-semibold">By @{creatorHandle}</p>
            </div>
          </div>
          {metrics && (
            <div className="flex items-center space-x-4 text-gray-400">
              <button
                onClick={() => onLike && onLike()}
                className="flex items-center hover:text-white transition"
                title="Like"
              >
                <span className="material-icons mr-1">favorite_border</span> {metrics.likes}
              </button>
              <button
                onClick={() => setCommentOpen((v) => !v)}
                className="flex items-center hover:text-white transition"
                title="Comment"
              >
                <span className="material-icons mr-1">chat_bubble_outline</span> {metrics.comments}
              </button>
            </div>
          )}
        </div>

        {showActions && commentOpen && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-[#111111] border border-gray-700 rounded-md p-2 outline-none focus:border-blue-500"
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                onClick={submitComment}
                disabled={submitting || !commentText.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold px-3 py-2 rounded-md"
              >
                {submitting ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}