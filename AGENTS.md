# MicroPixels

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

A micropayments pixel-canvas game on Arc Testnet. Players pay 0.01 USDC per pixel to paint a shared 32x32 canvas. The leaderboard ranks players by how many pixels they own. Pixels can be overwritten by anyone willing to pay.

## Deployed Contracts

- **MicroPixels** (Arc Testnet): `0x8c6d78db5926b2205f79a0e2a75d7c4bf51da1eb`
  - Explorer: https://explorer.testnet.arc.io/address/0x8c6d78db5926b2205f79a0e2a75d7c4bf51da1eb
  - USDC: `0x3600000000000000000000000000000000000000` (Arc Testnet)
  - Pixel price: 10000 raw units = 0.01 USDC
  - Canvas: 32x32 = 1024 pixels

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
