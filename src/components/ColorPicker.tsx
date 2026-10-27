import { useState } from 'react';

const PALETTE = [
  '#122d45', '#1a8047', '#ba2b4c', '#e07b00',
  '#7c3aed', '#0369a1', '#be123c', '#15803d',
  '#c2410c', '#1d4ed8', '#7e22ce', '#0f766e',
  '#ffffff', '#e5e7eb', '#fde68a', '#fed7aa',
  '#86efac', '#93c5fd', '#c4b5fd', '#fca5a5',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [customOpen, setCustomOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className="rounded transition-transform hover:scale-110 active:scale-95"
            style={{
              width: 26,
              height: 26,
              background: c,
              border: value === c ? '2.5px solid var(--ink)' : '1.5px solid rgba(18,45,69,0.18)',
              boxShadow: value === c ? '0 0 0 1.5px white inset' : undefined,
            }}
            aria-label={`Color ${c}`}
          />
        ))}
        {/* Custom color */}
        <button
          onClick={() => setCustomOpen((o) => !o)}
          className="rounded text-xs font-semibold transition-transform hover:scale-110"
          style={{
            width: 26,
            height: 26,
            background: 'var(--surface)',
            border: '1.5px dashed rgba(18,45,69,0.3)',
            color: 'var(--muted)',
            fontSize: 14,
          }}
          aria-label="Custom color"
        >
          +
        </button>
      </div>
      {customOpen && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="rounded cursor-pointer"
            style={{ width: 36, height: 28, border: 'none', padding: 1 }}
          />
          <span className="text-xs font-medium mono" style={{ color: 'var(--muted)' }}>
            {value.toUpperCase()}
          </span>
        </div>
      )}
      {/* Preview swatch */}
      <div className="flex items-center gap-2">
        <div
          className="rounded"
          style={{
            width: 18,
            height: 18,
            background: value,
            border: '1px solid rgba(18,45,69,0.18)',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          Selected
        </span>
      </div>
    </div>
  );
}
