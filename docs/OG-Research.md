# 0G (Zero Gravity) — Research Brief

Overview
- 0G is an AI‑first modular L1 with four services: Chain (EVM), Storage (Merkle‑rooted blobs), Compute (brokered provider marketplace), and Data Availability (DA).
- Current on‑chain AI is text‑centric. Heavy multimodal inference (image/audio/video) is executed off‑chain via the Compute marketplace with verifiable receipts.

Key capabilities
- Storage: low‑cost decentralized storage, returns Merkle roots for provenance; suitable for media, receipts, encrypted packages.
- Compute: broker routes paid inference tasks to providers; supports model/provider discovery, credits, and signed receipts for verifiability.
- Chain: EVM compatible; deploy standard Solidity contracts.
- DA: high‑throughput feeds and batch commitments for timelines, comments, and reactions.
- INFT (ERC‑7857): Intelligent NFTs with encrypted, transferable metadata (e.g., creator styles/agents).

Integration patterns
- Off‑chain inference + on‑chain anchors: Upload original to Storage → run Compute job → upload outputs → anchor roots and receipt hash in a registry contract.
- INFT licensing: package model/style metadata encrypted in Storage; mint ERC‑7857 token referencing encrypted blob; re‑encrypt on transfer.
- DA feeds: post high‑frequency social events to DA; periodically anchor batch roots on chain.

Suggested SDKs (TypeScript)
- @0glabs/0g-ts-sdk — Storage client (upload/download, Merkle roots).
- @0glabs/0g-serving-broker — Compute broker (credits, createJob, getResult).
- ethers/wagmi — Contract interactions from web.

Testnet endpoints (examples)
- EVM RPC: https://evmrpc-testnet.0g.ai
- Storage: https://storage-testnet.0g.ai
- Compute: https://compute-testnet.0g.ai
- Explorer: https://chainscan-newton.0g.ai

Security & ops
- Keep heavy JSON/media in Storage; store small hashes on chain.
- Require signed provider receipts; prefer providers that offer TEE attestations.
- Never expose private keys in the browser; wallets sign user actions; broker holds its own key for compute/storage operations.

Use in this repo
- services/broker/ integrates Storage/Compute for social data (profiles, posts, interactions).
- contracts/ contains the platform and NFT/INFT contracts.
- web/ renders a Next.js feed with a UI matching the provided HTML, ready to wire to the broker and contracts.