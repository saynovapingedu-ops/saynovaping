import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

type Tone = 'detective' | 'warning' | 'success' | 'danger';

interface Props {
  /** 0-100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  tone?: Tone;
  /** เนื้อหาตรงกลาง — ถ้าไม่ใส่ใช้ "{percent}%" */
  children?: React.ReactNode;
  className?: string;
  /** label สำหรับ screen reader */
  label?: string;
}

const toneColors: Record<Tone, { from: string; to: string; track: string }> = {
  detective: { from: '#4DAEFF', to: '#008FFF', track: '#D6EDFF' },
  warning:   { from: '#FBBF24', to: '#F59E0B', track: '#FEF3C7' },
  success:   { from: '#34D399', to: '#10B981', track: '#D1FAE5' },
  danger:    { from: '#FB7185', to: '#EF4444', track: '#FEE2E2' },
};

export default function ProgressCircle({
  percent, size = 140, strokeWidth = 12, tone = 'detective',
  children, className = '', label,
}: Props) {
  const reduced = useSettingsStore(s => s.reducedMotion);
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const colors = toneColors[tone];
  const gradId = `pc-grad-${tone}`;

  // animate stroke-dashoffset from 0% (full circle) → target
  const [displayPercent, setDisplayPercent] = useState(reduced ? clamped : 0);
  useEffect(() => {
    if (reduced) { setDisplayPercent(clamped); return; }
    const t = requestAnimationFrame(() => setDisplayPercent(clamped));
    return () => cancelAnimationFrame(t);
  }, [clamped, reduced]);

  const offset = circumference - (displayPercent / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `ความคืบหน้า ${Math.round(clamped)}%`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: reduced ? 'none' : 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <span className="font-display font-extrabold text-2xl text-slate-800">
            {Math.round(clamped)}%
          </span>
        )}
      </div>
    </div>
  );
}
