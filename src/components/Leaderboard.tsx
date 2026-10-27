interface LeaderboardProps {
  players: string[];
  counts: bigint[];
  connectedAddress?: string;
}

function shortAddr(addr: string) {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return null;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const RANK_COLORS = ['#ffb800', '#b0b8c1', '#c07a40'];

export default function Leaderboard({ players, counts, connectedAddress }: LeaderboardProps) {
  const entries = players
    .map((p, i) => ({ address: p, count: counts[i] }))
    .filter((e) => e.address !== '0x0000000000000000000000000000000000000000' && e.count > 0n);

  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No pixels placed yet. Be the first!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry, i) => {
        const isMe = connectedAddress && entry.address.toLowerCase() === connectedAddress.toLowerCase();
        const short = shortAddr(entry.address);
        return (
          <div
            key={entry.address}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: isMe ? 'rgba(133,177,237,0.15)' : 'rgba(255,255,255,0.42)',
              border: isMe ? '1px solid rgba(133,177,237,0.4)' : '1px solid rgba(18,45,69,0.07)',
            }}
          >
            <span
              className="font-bold text-xs w-5 text-center flex-shrink-0"
              style={{ color: RANK_COLORS[i] ?? 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {i + 1}
            </span>
            <span
              className="mono text-xs flex-1 truncate"
              style={{ color: isMe ? 'var(--accent)' : 'var(--ink-2)' }}
            >
              {short ?? '—'}
              {isMe && (
                <span className="ml-1 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                  (you)
                </span>
              )}
            </span>
            <span
              className="font-semibold text-sm tabular-nums"
              style={{ color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {entry.count.toString()}
              <span className="ml-0.5 text-xs font-normal" style={{ color: 'var(--muted)' }}>px</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
