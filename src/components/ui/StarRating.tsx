import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';

interface Props {
  score: number;
  total: number;
  /** percent thresholds สำหรับ 1, 2, 3 ดาว — default [0.5, 0.7, 0.9] */
  thresholds?: [number, number, number];
  size?: number;
  className?: string;
}

export default function StarRating({
  score, total, thresholds = [0.5, 0.7, 0.9], size = 40, className = '',
}: Props) {
  const reduced = useSettingsStore(s => s.reducedMotion);
  const ratio = total > 0 ? score / total : 0;
  const filled = ratio >= thresholds[2] ? 3 : ratio >= thresholds[1] ? 2 : ratio >= thresholds[0] ? 1 : 0;

  return (
    <div
      className={`inline-flex items-center justify-center gap-1.5 ${className}`}
      role="img"
      aria-label={`ได้ ${filled} จาก 3 ดาว`}
    >
      {[0, 1, 2].map(i => (
        <Star key={i} active={i < filled} delay={reduced ? 0 : 0.2 + i * 0.15} size={size} reduced={reduced} />
      ))}
    </div>
  );
}

function Star({ active, delay, size, reduced }: {
  active: boolean; delay: number; size: number; reduced: boolean;
}) {
  const color = active ? '#F59E0B' : '#E2E8F0';
  return (
    <motion.svg
      initial={reduced ? false : { scale: 0, rotate: -30, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 240, damping: 14 }}
      width={size} height={size} viewBox="0 0 24 24" fill={color}
      style={{ filter: active ? 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4))' : undefined }}
      aria-hidden
    >
      <path d="M12 2l2.94 6.46L22 9.55l-5 4.87 1.18 6.88L12 18.06l-6.18 3.24L7 14.42 2 9.55l7.06-1.09L12 2z" />
    </motion.svg>
  );
}
