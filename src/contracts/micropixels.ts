import artifact from '../../contracts/out/MicroPixels.sol/MicroPixels.json';

export const MICRO_PIXELS_ADDRESS = '0x8c6d78db5926b2205f79a0e2a75d7c4bf51da1eb' as const;
export const MICRO_PIXELS_CHAIN_ID = 5042002; // Arc Testnet

export const MICRO_PIXELS_CONTRACT = {
  address: MICRO_PIXELS_ADDRESS,
  abi: artifact.abi,
  chainId: MICRO_PIXELS_CHAIN_ID,
} as const;

export const CANVAS_WIDTH = 32;
export const CANVAS_HEIGHT = 32;
export const CANVAS_SIZE = CANVAS_WIDTH * CANVAS_HEIGHT;
export const PIXEL_PRICE_RAW = 10000n; // 0.01 USDC
