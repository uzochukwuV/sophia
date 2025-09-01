'use client';

import dynamic from 'next/dynamic';

const ConnectWallet = dynamic(() => import('./ConnectWallet'), { ssr: false });

export default function Navbar() {
  return (
    <header className="flex justify-between items-center mb-8">
      <h2 className="text-4xl font-bold text-white">Feed</h2>
      <div className="flex items-center space-x-4">
        <button className="hover:text-white text-gray-300">
          <span className="material-icons">notifications_none</span>
        </button>
        <button className="hover:text-white text-gray-300">
          <span className="material-icons">apps</span>
        </button>
        <ConnectWallet />
      </div>
    </header>
  );
}