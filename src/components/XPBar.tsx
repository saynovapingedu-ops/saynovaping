import { usePlayerStore } from '../store/playerStore';
import { getLevelByXP, getNextLevel, getProgressToNextLevel } from '../lib/levels';

interface Props {
  /** 'dark' = อยู่บนพื้นมืด/ม่วง (เช่น Home header), 'light' = อยู่บนการ์ดขาว */
  variant?: 'dark' | 'light';
}

export default function XPBar({ variant = 'light' }: Props) {
  const xp = usePlayerStore(s => s.totalXP);
  const lv = getLevelByXP(xp);
  const next = getNextLevel(xp);
  const progress = getProgressToNextLevel(xp);

  const isDark = variant === 'dark';
  const labelText = isDark ? 'text-white drop-shadow-sm' : 'text-detective-700';
  const xpText    = isDark ? 'text-white/90'             : 'text-gray-500';
  const trackBg   = isDark ? 'bg-white/15 border border-white/10' : 'bg-detective-100';
  const captionText = isDark ? 'text-white/80'           : 'text-gray-500';

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{lv.emoji}</span>
          <span className={`font-semibold ${labelText}`}>
            Lv.{lv.level} <span className="opacity-90">{lv.name}</span>
          </span>
        </div>
        <span className={`text-sm font-semibold ${xpText}`}>{xp} XP</span>
      </div>
      <div className={`relative h-3 rounded-full overflow-hidden ${trackBg}`}>
        <div
          className="h-full bg-gradient-to-r from-warning-400 via-warning-500 to-detective-300
                     transition-all duration-700 relative"
          style={{ width: `${progress * 100}%` }}
        >
          <div className="absolute inset-0 shimmer rounded-full" />
        </div>
      </div>
      {next ? (
        <p className={`text-xs mt-1.5 ${captionText}`}>
          อีก <span className={`font-bold ${isDark ? 'text-warning-100' : 'text-warning-500'}`}>
            {next.minXP - xp} XP
          </span> จะถึง {next.name} {next.emoji}
        </p>
      ) : (
        <p className={`text-xs font-semibold mt-1.5 ${isDark ? 'text-warning-200' : 'text-success-600'}`}>
          🏆 ระดับสูงสุดแล้ว!
        </p>
      )}
    </div>
  );
}
