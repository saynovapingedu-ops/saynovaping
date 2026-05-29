import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';

type Tone = 'neutral' | 'error' | 'info' | 'warning';

interface Props {
  icon: string;
  title: string;
  description?: string | React.ReactNode;
  action?: React.ReactNode;
  tone?: Tone;
  className?: string;
  /** ถ้า true จะ wrap ด้วย .card-hero (ใช้เป็น mid-page hero เช่นหน้า locked) */
  hero?: boolean;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'text-slate-700',
  error: 'text-danger-500',
  info: 'text-detective-700',
  warning: 'text-warning-600',
};

export default function EmptyState({
  icon, title, description, action, tone = 'neutral', className = '', hero = false,
}: Props) {
  const reduced = useSettingsStore(s => s.reducedMotion);
  const wrapper = hero ? 'card-hero' : 'card';

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${wrapper} text-center py-8 px-4 ${className}`}
    >
      <div className="text-5xl mb-3" aria-hidden>{icon}</div>
      <h3 className={`font-display font-bold text-base mb-1 ${toneClasses[tone]}`}>
        {title}
      </h3>
      {description && (
        <div className="text-sm text-slate-600 mb-4 leading-relaxed">
          {description}
        </div>
      )}
      {action && <div className="flex justify-center gap-2">{action}</div>}
    </motion.div>
  );
}
