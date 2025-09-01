# Sophia — Creators on 0G (Zero Gravity) Blockchain

Monorepo scaffold for a creator social dApp on 0G with:
- Next.js frontend (Tailwind) replicating the provided Feed UI
- Hardhat contracts workspace
- Node broker (Express) integrating 0G Storage/Compute for social data

Documentation:
- docs/OG-Creator-Platform.md — full technical guide covering features, feasibility, and design patterns

## Structure

- web/ — Next.js app (Tailwind, app router)
- contracts/ — Hardhat project with NeuralCreatorPlatform, TraditionalArtNFT, NeuralCreatorINFT
- services/broker/ — Node broker service with 0G Storage/Compute SDK patterns

## Quick start

Prereqs: Node 18+, pnpm or npm, a 0G testnet wallet with test A0GI

1) Broker (0G integrations)
- cd services/broker
- cp .env.example .env  (set PRIVATE_KEY, OG_* URLs)
- npm i
- npm run dev

2) Frontend
- cd web
- cp .env.example .env.local  (set NEXT_PUBLIC_* URLs and broker API)
- npm i
- npm run dev
- Open http://localhost:3000

3) Contracts (0G testnet)
- cd contracts
- cp .env.example .env  (set OG_RPC_URL, PRIVATE_KEY, TREASURY_ADDRESS, ORACLE_ADDRESS)
- npm i
- npm run build
- npm run deploy

Notes:
- The Feed page is implemented in web/app/page.tsx using components in web/components.
- The broker exposes REST endpoints for profiles, posts, interactions, and AI utilities; data is stored in 0G Storage.
