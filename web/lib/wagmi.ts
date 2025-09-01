import { createConfig, http } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';

export const ogTestnet = {
  id: 16600,
  name: '0G Newton Testnet',
  network: '0g-testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai'] },
    public: { http: [process.env.NEXT_PUBLIC_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Explorer', url: 'https://chainscan-newton.0g.ai' },
  },
} as const;

export const wagmiConfig = createConfig({
  chains: [ogTestnet],
  connectors: [metaMask(), injected()],
  transports: {
    [ogTestnet.id]: http(process.env.NEXT_PUBLIC_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai'),
  },
});