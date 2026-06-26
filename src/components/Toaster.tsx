import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../store/uiStore';

export default function Toaster() {
  const toasts = useUIStore(s => s.toasts);
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`px-5 py-3 rounded-full shadow-[0_6px_16px_-4px_rgba(0,0,0,0.22)] font-semibold text-white flex items-center gap-2 ${
              t.type === 'xp' ? 'bg-warning-500'
              : t.type === 'badge' ? 'bg-success-500'
              : 'bg-detective-500'
            }`}
          >
            <span className="text-xl">{t.emoji}</span>
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
