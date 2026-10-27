import { useState, useCallback } from 'react';
import { ConnectKitButton } from 'connectkit';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from 'wagmi';
import { erc20Abi } from 'viem';
import { toast } from 'sonner';
import { Zap, Trophy, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts';
import { Amount, usdcDecimalsFor } from '@/onchain-money';
import {
  MICRO_PIXELS_CONTRACT,
  MICRO_PIXELS_ADDRESS,
  MICRO_PIXELS_CHAIN_ID,
  CANVAS_SIZE,
  PIXEL_PRICE_RAW,
} from './contracts/micropixels';
import PixelCanvas from './components/PixelCanvas';
import ColorPicker from './components/ColorPicker';
import Leaderboard from './components/Leaderboard';

const usdcFact = getUsdc(MICRO_PIXELS_CHAIN_ID)!;
const USDC_ADDRESS = usdcFact.address as `0x${string}`;

function hexColorToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export default function App() {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [selectedColor, setSelectedColor] = useState('#1a8047');
  const [activeTab, setActiveTab] = useState<'canvas' | 'leaderboard'>('canvas');
  const [pendingPixel, setPendingPixel] = useState<{ x: number; y: number } | null>(null);

  const isWrongChain = address !== undefined && chainId !== MICRO_PIXELS_CHAIN_ID;

  // ── Read canvas ──────────────────────────────────────────────────────────
  const { data: canvasData, refetch: refetchCanvas } = useReadContract({
    ...MICRO_PIXELS_CONTRACT,
    functionName: 'getCanvas',
  });

  const rawColors: readonly number[] = canvasData
    ? (canvasData as [readonly number[], readonly string[]])[0].map((c) => Number(c))
    : Array(CANVAS_SIZE).fill(0);

  const rawOwners: readonly string[] = canvasData
    ? (canvasData as [readonly number[], readonly string[]])[1]
    : Array(CANVAS_SIZE).fill('0x0000000000000000000000000000000000000000');

  // ── Read leaderboard ─────────────────────────────────────────────────────
  const { data: leaderboardData, refetch: refetchLeaderboard } = useReadContract({
    ...MICRO_PIXELS_CONTRACT,
    functionName: 'getLeaderboard',
  });

  const lbPlayers: string[] = leaderboardData
    ? (leaderboardData as [string[], bigint[]])[0]
    : [];
  const lbCounts: bigint[] = leaderboardData
    ? (leaderboardData as [string[], bigint[]])[1]
    : [];

  // ── Read USDC balance ─────────────────────────────────────────────────────
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: MICRO_PIXELS_CHAIN_ID,
    query: { enabled: !!address },
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, MICRO_PIXELS_ADDRESS] : undefined,
    chainId: MICRO_PIXELS_CHAIN_ID,
    query: { enabled: !!address },
  });

  // ── Read my pixel count ──────────────────────────────────────────────────
  const { data: myPixelCount } = useReadContract({
    ...MICRO_PIXELS_CONTRACT,
    functionName: 'pixelCounts',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // ── Approve USDC ──────────────────────────────────────────────────────────
  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // ── Place pixel ───────────────────────────────────────────────────────────
  const {
    writeContract: placePixel,
    data: placeHash,
    isPending: isPlacePending,
  } = useWriteContract();

  const { isLoading: isPlaceConfirming, isSuccess: isPlaceSuccess } =
    useWaitForTransactionReceipt({ hash: placeHash });

  const isPlacing = isApprovePending || isApproveConfirming || isPlacePending || isPlaceConfirming;

  // Refresh after place confirmed
  if (isPlaceSuccess && pendingPixel) {
    setPendingPixel(null);
    void refetchCanvas();
    void refetchLeaderboard();
    void refetchBalance();
  }

  if (isApproveSuccess && pendingPixel) {
    // After approval, place the pixel
    placePixel({
      ...MICRO_PIXELS_CONTRACT,
      functionName: 'placePixel',
      args: [pendingPixel.x, pendingPixel.y, hexColorToNumber(selectedColor)],
    });
  }

  const handlePixelClick = useCallback(
    (x: number, y: number) => {
      if (!address) {
        toast.info('Connect your wallet to paint pixels');
        return;
      }
      if (isWrongChain) {
        switchChain({ chainId: MICRO_PIXELS_CHAIN_ID });
        return;
      }
      if (isPlacing) return;

      // Check allowance
      const needsApproval = !usdcAllowance || (usdcAllowance) < PIXEL_PRICE_RAW;
      setPendingPixel({ x, y });

      if (needsApproval) {
        // Approve a large allowance so subsequent pixels don't re-approve
        approve({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [MICRO_PIXELS_ADDRESS, BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935')],
          chainId: MICRO_PIXELS_CHAIN_ID,
        });
      } else {
        placePixel({
          ...MICRO_PIXELS_CONTRACT,
          functionName: 'placePixel',
          args: [x, y, hexColorToNumber(selectedColor)],
        });
      }
    },
    [address, isWrongChain, isPlacing, usdcAllowance, switchChain, approve, placePixel, selectedColor]
  );

  const formattedBalance = usdcBalance
    ? Amount.fromRaw(usdcBalance, usdcDecimalsFor(MICRO_PIXELS_CHAIN_ID)).toFixed(2)
    : null;

  const myCount = myPixelCount ? Number(myPixelCount) : 0;

  function refetchAll() {
    void refetchCanvas();
    void refetchLeaderboard();
    void refetchBalance();
    void refetchAllowance();
  }

  return (
    <div
      className="relative min-h-dvh overflow-x-hidden"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: 'absolute', top: '6%', left: '3%', width: 320, height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(133,177,237,0.18) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '10%', right: '5%', width: 280, height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,205,131,0.16) 0%, transparent 70%)',
            filter: 'blur(65px)',
          }}
        />
        <div
          style={{
            position: 'absolute', top: '45%', right: '20%', width: 200, height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,181,253,0.14) 0%, transparent 70%)',
            filter: 'blur(55px)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-10 pt-5">
        {/* Header */}
        <header className="flex items-center justify-between mb-5">
          <div>
            <h1
              className="display text-xl font-bold"
              style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
            >
              MicroPixels
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Paint the canvas · 0.01 USDC per pixel
            </p>
          </div>
          <ConnectKitButton />
        </header>

        {/* Wrong chain banner */}
        <AnimatePresence>
          {isWrongChain && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(186,43,76,0.1)', border: '1px solid rgba(186,43,76,0.25)' }}
            >
              <Zap size={15} style={{ color: 'var(--danger)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                Switch to Arc Testnet to play
              </span>
              <button
                onClick={() => switchChain({ chainId: MICRO_PIXELS_CHAIN_ID })}
                className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                Switch
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stat cards */}
        {address && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.64)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.68)',
                boxShadow: '0 4px 16px rgba(18,45,69,0.07)',
              }}
            >
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                USDC Balance
              </p>
              <p className="display text-xl font-bold mt-0.5 tabular-nums" style={{ color: 'var(--ink)' }}>
                {formattedBalance ?? '—'}
              </p>
            </div>
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.64)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.68)',
                boxShadow: '0 4px 16px rgba(18,45,69,0.07)',
              }}
            >
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                My Pixels
              </p>
              <p className="display text-xl font-bold mt-0.5 tabular-nums" style={{ color: 'var(--ink)' }}>
                {myCount}
              </p>
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Canvas card */}
          <div
            className="flex-1 rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.64)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.68)',
              boxShadow: '0 8px 32px rgba(18,45,69,0.08)',
            }}
          >
            {/* Tab row */}
            <div className="flex items-center gap-1 mb-4">
              {(['canvas', 'leaderboard'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: activeTab === tab ? 'var(--accent)' : 'transparent',
                    color: activeTab === tab ? 'white' : 'var(--muted)',
                  }}
                >
                  {tab === 'canvas' ? (
                    <Zap size={12} />
                  ) : (
                    <Trophy size={12} />
                  )}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <button
                onClick={refetchAll}
                className="ml-auto p-1.5 rounded-full transition-colors hover:bg-white/60"
                style={{ color: 'var(--muted)' }}
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {activeTab === 'canvas' && (
              <div className="flex flex-col items-center gap-3">
                <PixelCanvas
                  colors={Array.from(rawColors)}
                  owners={Array.from(rawOwners)}
                  selectedColor={selectedColor}
                  onPixelClick={handlePixelClick}
                  isPlacing={isPlacing}
                  connectedAddress={address}
                  pendingPixel={pendingPixel}
                />

                {!address ? (
                  <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
                    Connect wallet to paint pixels
                  </p>
                ) : (
                  <div
                    className="w-full rounded-xl p-3"
                    style={{
                      background: 'rgba(255,255,255,0.46)',
                      border: '1px solid rgba(255,255,255,0.56)',
                    }}
                  >
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink-2)' }}>
                      Pick a color
                    </p>
                    <ColorPicker value={selectedColor} onChange={setSelectedColor} />
                  </div>
                )}

                {/* Transaction status */}
                <AnimatePresence>
                  {isPlacing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full rounded-xl px-4 py-3 flex items-center gap-2"
                      style={{
                        background: 'rgba(133,177,237,0.15)',
                        border: '1px solid rgba(133,177,237,0.35)',
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full animate-pulse flex-shrink-0"
                        style={{ background: 'var(--focus)' }}
                      />
                      <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                        {isApprovePending || isApproveConfirming
                          ? 'Approving USDC spend...'
                          : 'Placing pixel on-chain...'}
                      </span>
                    </motion.div>
                  )}
                  {placeHash && isPlaceSuccess && (
                    <motion.a
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      href={buildTxExplorerUrl(MICRO_PIXELS_CHAIN_ID, placeHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full rounded-xl px-4 py-3 flex items-center gap-2 transition-opacity hover:opacity-80"
                      style={{
                        background: 'rgba(26,128,71,0.12)',
                        border: '1px solid rgba(26,128,71,0.3)',
                        textDecoration: 'none',
                      }}
                    >
                      <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>
                        Pixel placed!
                      </span>
                      <ExternalLink size={12} style={{ color: 'var(--success)', marginLeft: 'auto' }} />
                    </motion.a>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>
                  Top painters by pixel count
                </p>
                <Leaderboard
                  players={lbPlayers}
                  counts={lbCounts}
                  connectedAddress={address}
                />
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <div className="lg:w-56 flex flex-col gap-3">
            {/* How to play */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.65)',
                boxShadow: '0 4px 16px rgba(18,45,69,0.06)',
              }}
            >
              {/* Spectral strip */}
              <div
                className="w-8 h-0.5 rounded-full mb-3"
                style={{ background: 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)' }}
              />
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--ink)' }}>
                How to play
              </p>
              <ol className="text-xs space-y-1.5 list-none" style={{ color: 'var(--ink-2)' }}>
                {[
                  'Connect your wallet',
                  'Get test USDC (sidebar button)',
                  'Pick a color',
                  'Click any pixel to paint it',
                  'Own more pixels, top the board',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full text-center text-[10px] font-bold leading-4"
                      style={{ background: 'var(--accent)', color: 'white' }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Cost breakdown */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.65)',
                boxShadow: '0 4px 16px rgba(18,45,69,0.06)',
              }}
            >
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--ink)' }}>Cost</p>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Per pixel</span>
                <span className="display font-bold tabular-nums text-sm" style={{ color: 'var(--ink)' }}>
                  0.01 USDC
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Gas</span>
                <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>
                  ~0.00 USDC
                </span>
              </div>
              <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--subtle)' }}>
                Arc's gas token IS USDC, so you only need one balance to play.
              </p>
            </div>

            {/* Contract link */}
            <a
              href={`https://explorer.testnet.arc.io/address/${MICRO_PIXELS_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl p-4 flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.6)',
                textDecoration: 'none',
              }}
            >
              <span className="text-xs font-medium flex-1" style={{ color: 'var(--muted)' }}>
                View contract
              </span>
              <ExternalLink size={12} style={{ color: 'var(--muted)' }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
