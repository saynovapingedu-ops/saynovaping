import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';

type Tone = 'success' | 'warning' | 'info' | 'neutral';

interface Props {
  tone?: Tone;
  emoji: string;
  title: string;
  subtitle?: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * ResultHero — กล่องผลลัพธ์หลักของ Daily/Exam/Assessment
 * children = ProgressCircle, StarRating, CountUp ฯลฯ
 */
export default function ResultHero({
  tone = 'info', emoji, title, subtitle, children, className = '',
}: Props) {
  const reduced = useSettingsStore(s => s.reducedMotion);

  const toneAccent: Record<Tone, string> = {
    success: 'text-success-600',
    warning: 'text-warning-600',
    info: 'text-detective-700',
    neutral: 'text-slate-700',
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 180, damping: 18 }}
      className={`card-hero text-center py-6 px-4 ${className}`}
    >
      <motion.div
        initial={reduced ? false : { scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 12 }}
        className="text-5xl mb-1"
        aria-hidden
      >
        {emoji}
      </motion.div>
      <h2 className={`font-display font-bold text-lg mb-2 ${toneAccent[tone]}`}>
        {title}
      </h2>
      {children && <div className="my-3 flex flex-col items-center gap-3">{children}</div>}
      {subtitle && (
        <div className="text-sm text-slate-600 mt-2">{subtitle}</div>
      )}
    </motion.div>
  );
}
