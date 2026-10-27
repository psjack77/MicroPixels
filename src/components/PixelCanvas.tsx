import { useRef, useEffect, useCallback, useState } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../contracts/micropixels';

interface PixelCanvasProps {
  colors: number[];
  owners: string[];
  selectedColor: string;
  onPixelClick: (x: number, y: number) => void;
  isPlacing: boolean;
  connectedAddress?: string;
  pendingPixel?: { x: number; y: number } | null;
}

const PIXEL_SIZE = 14;

function colorNumToHex(c: number): string {
  if (c === 0) return '#f0f0f4';
  return `#${c.toString(16).padStart(6, '0')}`;
}

export default function PixelCanvas({
  colors,
  owners,
  selectedColor,
  onPixelClick,
  isPlacing,
  connectedAddress,
  pendingPixel,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let x = 0; x < CANVAS_WIDTH; x++) {
      for (let y = 0; y < CANVAS_HEIGHT; y++) {
        const idx = x * CANVAS_WIDTH + y;
        const color = colors[idx] ?? 0;
        const owner = owners[idx];

        let fillColor = colorNumToHex(color);

        // Highlight own pixels
        if (connectedAddress && owner?.toLowerCase() === connectedAddress.toLowerCase() && color !== 0) {
          ctx.fillStyle = fillColor;
          ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          // subtle white outline on own pixels
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x * PIXEL_SIZE + 0.5, y * PIXEL_SIZE + 0.5, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
          continue;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);

        // Grid line
        ctx.strokeStyle = 'rgba(18,45,69,0.06)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * PIXEL_SIZE + 0.25, y * PIXEL_SIZE + 0.25, PIXEL_SIZE - 0.5, PIXEL_SIZE - 0.5);
      }
    }

    // Hover highlight
    if (hovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(hovered.x * PIXEL_SIZE, hovered.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hovered.x * PIXEL_SIZE + 0.75, hovered.y * PIXEL_SIZE + 0.75, PIXEL_SIZE - 1.5, PIXEL_SIZE - 1.5);
    }

    // Pending pixel flash
    if (pendingPixel) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(pendingPixel.x * PIXEL_SIZE, pendingPixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }
  }, [colors, owners, hovered, selectedColor, connectedAddress, pendingPixel]);

  useEffect(() => {
    draw();
  }, [draw]);

  function getXY(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = (CANVAS_WIDTH * PIXEL_SIZE) / rect.width;
    const scaleY = (CANVAS_HEIGHT * PIXEL_SIZE) / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) * scaleY / PIXEL_SIZE);
    return { x: Math.min(x, CANVAS_WIDTH - 1), y: Math.min(y, CANVAS_HEIGHT - 1) };
  }

  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH * PIXEL_SIZE}
        height={CANVAS_HEIGHT * PIXEL_SIZE}
        style={{
          display: 'block',
          cursor: isPlacing ? 'wait' : 'crosshair',
          borderRadius: 8,
          boxShadow: '0 4px 24px rgba(18,45,69,0.12)',
          maxWidth: '100%',
          imageRendering: 'pixelated',
        }}
        onMouseMove={(e) => {
          if (isPlacing) return;
          setHovered(getXY(e));
        }}
        onMouseLeave={() => setHovered(null)}
        onClick={(e) => {
          if (isPlacing) return;
          const { x, y } = getXY(e);
          onPixelClick(x, y);
        }}
      />
      {isPlacing && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg"
          style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(2px)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Confirm in wallet...
          </span>
        </div>
      )}
    </div>
  );
}
