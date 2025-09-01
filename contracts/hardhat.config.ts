import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const OG_RPC_URL = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    0gTestnet: {
      url: OG_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      0gTestnet: process.env.OG_EXPLORER_API_KEY || ""
    },
    customChains: [
      {
        network: "0gTestnet",
        chainId: 16600,
        urls: {
          apiURL: "https://api.chainscan-newton.0g.ai/api",
          browserURL: "https://chainscan-newton.0g.ai"
        }
      }
    ]
  }
};

export default config;