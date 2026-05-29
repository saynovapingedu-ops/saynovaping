import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface Props {
  from?: number;
  to: number;
  /** ms */
  duration?: number;
  /** format ตัวเลขก่อนแสดง — เช่น n => `${n}%`, n => n.toLocaleString() */
  formatter?: (n: number) => string;
  className?: string;
}

export default function CountUp({
  from = 0, to, duration = 900, formatter, className = '',
}: Props) {
  const reduced = useSettingsStore(s => s.reducedMotion);
  const [value, setValue] = useState(reduced ? to : from);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) { setValue(to); return; }
    const start = performance.now();
    const delta = to - from;
    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + delta * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(to);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [from, to, duration, reduced]);

  const display = formatter
    ? formatter(Math.round(value))
    : Math.round(value).toLocaleString();

  return <span className={className}>{display}</span>;
}
