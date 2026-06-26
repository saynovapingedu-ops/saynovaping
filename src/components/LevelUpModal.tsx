import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';
import { getLevelByXP } from '../lib/levels';
import { sfx, vibrate } from '../lib/sound';

// ============================================================================
//  LevelUpModal — เด้งฉลองเมื่อผู้เล่นเลเวลอัป + โชว์โบนัสเหรียญที่ได้
//  ฟังการเปลี่ยนของ player.level (โบนัสเหรียญถูกบวกแล้วใน addXP)
// ============================================================================

interface Shown { level: number; name: string; emoji: string; bonus: number; }

export default function LevelUpModal() {
  const level = usePlayerStore(s => s.level);
  const totalXP = usePlayerStore(s => s.totalXP);
  const reducedMotion = useSettingsStore(s => s.reducedMotion);
  const prev = useRef(level);
  const [shown, setShown] = useState<Shown | null>(null);

  useEffect(() => {
    if (level > prev.current) {
      const info = getLevelByXP(totalXP);
      setShown({ level, name: info.name, emoji: info.emoji, bonus: level * 10 });
      sfx.victory();
      vibrate([30, 50, 30, 50, 60]);
    }
    prev.current = level;
  }, [level, totalXP]);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShown(null)}
          role="dialog" aria-label="เลเวลอัป"
        >
          <motion.div
            className="liquid-modal rounded-[28px] p-6 text-center max-w-xs w-full"
            initial={reducedMotion ? false : { scale: 0.7, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-5xl mb-2">{shown.emoji}</p>
            <p className="font-display font-bold text-detective-700 text-lg">🎉 เลเวลอัป!</p>
            <p className="text-slate-700 mt-1">
              ถึงระดับ <b>Lv.{shown.level} — {shown.name}</b>
            </p>
            <p className="text-warning-600 font-bold mt-2">🪙 โบนัส +{shown.bonus} เหรียญ</p>
            <button onClick={() => setShown(null)} className="btn-primary mt-4 px-6">เยี่ยม!</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
