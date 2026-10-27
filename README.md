# MicroPixels

A micropayments pixel-canvas game on Arc Testnet. Players pay 0.01 USDC per pixel to paint a shared 32x32 grid. Own more pixels than anyone else to top the leaderboard. Any pixel can be overwritten by another player.

Built with [Arc Studio](https://studio.arc.io).

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- **Web3**: wagmi v2, viem v2, ConnectKit
- **Smart Contract**: Solidity 0.8.28, Foundry, OpenZeppelin 5.x
- **Chain**: Arc Testnet (Chain ID: 5042002) — USDC is the native gas token
- **Token**: USDC (6 decimals) at `0x3600000000000000000000000000000000000000`

## Deployed Contract

- **MicroPixels**: `0x8c6d78db5926b2205f79a0e2a75d7c4bf51da1eb` (Arc Testnet)

## Development

### Prerequisites

- [Bun](https://bun.sh) v1+
- [Foundry](https://getfoundry.sh) (for contract work)

### Install

```bash
bun install
```

### Environment Variables

None required for the frontend. The app reads Arc Testnet RPC from `@/onchain-facts`.

If Arc Studio provisioned an RPC proxy, it is available via:

| Variable | Purpose |
|---|---|
| `RPC_PROXY_BASE_URL` | Arc Studio RPC proxy base URL (optional outside Arc Studio) |
| `RPC_PROXY_TOKEN` | RPC proxy authentication token (optional outside Arc Studio) |
| `RPC_PROXY_CHAINS` | Comma-separated chain keys covered by the proxy (optional outside Arc Studio) |

### Run

```bash
bun run dev
```

### Build

```bash
bun run build
```

### Contract Build & Test

```bash
bun run contracts:build   # forge build
bun run contracts:test    # forge test
```

## How to Play

1. Connect a wallet on Arc Testnet.
2. Get test USDC from the "Get test USDC" button in Arc Studio's sidebar.
3. Pick a color from the palette.
4. Click any pixel on the 32x32 canvas to paint it (costs 0.01 USDC).
5. Your painted pixels are highlighted; their count appears in the leaderboard.
