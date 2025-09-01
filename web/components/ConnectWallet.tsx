'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const connectMM = () => {
    const mm = connectors.find((c) => c.id === metaMask().id) || connectors[0];
    connect({ connector: mm });
  };

  return (
    <div className="flex items-center">
      {!isConnected ? (
        <button
          onClick={connectMM}
          disabled={isPending}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-md text-sm"
        >
          {isPending ? 'Connecting…' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </span>
          <button
            onClick={() => disconnect()}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-3 py-1.5 rounded-md text-sm"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}