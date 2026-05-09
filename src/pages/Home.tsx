import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { SCENARIO_META, isStageUnlocked } from '../scenarios';
import XPBar from '../components/XPBar';
import Avatar from '../components/Avatar';

export default function Home() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const certEligible = player.stagesCompleted.length >= 8 || player.totalXP >= 1500;

  return (
    <div className="min-h-full pb-10 relative overflow-hidden">
      {/* พื้นหลัง gradient + blob blur สำหรับความสวย */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 bg-detective-300/40 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-40 -right-20 w-64 h-64 bg-warning-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-success-500/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-br from-detective-600 via-detective-500 to-detective-700
                         text-white px-5 pt-6 pb-8 rounded-b-[2rem] shadow-xl overflow-hidden">
        {/* sparkle dots */}
        <div className="absolute top-4 right-6 text-white/30 text-xs">✦</div>
        <div className="absolute bottom-3 left-8 text-white/20 text-xs">✦</div>

        <div className="flex items-center gap-3 relative">
          <Avatar preset={player.avatar} customId={player.customAvatarId} size={56} ring />
          <div className="flex-1 min-w-0">
            <p className="text-detective-100 text-xs">🔍 นักสืบสุขภาพ</p>
            <h2 className="font-display font-bold text-xl truncate">
              {player.nickname || 'ผู้เล่น'}
            </h2>
          </div>
          <button
            onClick={() => nav('/profile')}
            className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full p-2.5
                       transition-all active:scale-95"
          >
            <span className="text-xl">⚙️</span>
          </button>
        </div>

        <div className="mt-5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3.5 shadow-inner">
          <XPBar variant="dark" />
        </div>
      </header>

      {/* Body */}
      <main className="max-w-md mx-auto px-4 mt-6">
        {certEligible && !player.certificateNo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card relative overflow-hidden mb-4 border-2 border-warning-500
                       bg-gradient-to-br from-warning-50 to-amber-100"
          >
            <div className="absolute -top-4 -right-4 text-7xl opacity-20">🏆</div>
            <p className="text-warning-600 font-bold mb-2 relative">🏆 พร้อมรับ Certificate แล้ว!</p>
            <button onClick={() => nav('/certificate')} className="btn-primary w-full">
              รับใบประกาศนียบัตร
            </button>
          </motion.div>
        )}

        {player.certificateNo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card mb-4 border-2 border-success-500
                       bg-gradient-to-br from-success-50 to-emerald-50"
          >
            <p className="text-success-600 font-bold mb-1">🏆 Certificate ของคุณ</p>
            <p className="text-sm text-gray-600 mb-2">เลขที่ {player.certificateNo}</p>
            <button onClick={() => nav('/certificate')} className="btn-secondary w-full">
              ดู Certificate
            </button>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-detective-700 text-lg flex items-center gap-2">
            <span className="text-2xl">📍</span> แผนที่ภารกิจ
          </h3>
          <span className="text-xs text-gray-500">
            {player.stagesCompleted.length}/{SCENARIO_META.length} ด่าน
          </span>
        </div>

        <div className="space-y-3">
          {SCENARIO_META.map((meta, i) => {
            const unlocked = isStageUnlocked(meta.id, player.stagesCompleted);
            const completed = player.stagesCompleted.includes(meta.id);
            const playable = meta.available && unlocked;

            return (
              <motion.button
                key={meta.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                disabled={!playable}
                onClick={() => playable && nav(`/scenario/${meta.id}`)}
                className={`w-full text-left card flex items-center gap-3 relative overflow-hidden
                            transition-all ${
                  !playable
                    ? 'opacity-60 grayscale'
                    : 'active:scale-[0.98] hover:shadow-md hover:-translate-y-0.5'
                } ${
                  completed
                    ? 'border-2 border-success-500 bg-gradient-to-r from-success-50 to-white'
                    : playable
                    ? 'border border-detective-100 bg-white'
                    : 'bg-white/70'
                }`}
              >
                {/* badge ด่านที่ปลดล็อกใหม่ */}
                {playable && !completed && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold text-detective-600
                                   bg-detective-100 px-2 py-0.5 rounded-full">
                    NEW
                  </span>
                )}

                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0
                              shadow-sm ${
                    completed
                      ? 'bg-gradient-to-br from-success-500 to-emerald-600 text-white'
                      : playable
                      ? 'bg-gradient-to-br from-detective-500 to-detective-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {completed ? '✓' : meta.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{meta.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {!meta.available
                      ? '🚧 เร็วๆ นี้'
                      : !unlocked
                      ? `🔒 ปลดล็อกหลังจบด่าน ${meta.unlockAfter}`
                      : meta.subtitle}
                  </p>
                  {meta.estMinutes && playable && (
                    <p className="text-[11px] text-gray-400 mt-0.5">⏱ ~{meta.estMinutes} นาที</p>
                  )}
                </div>
                {playable && (
                  <span className="text-detective-500 text-2xl flex-shrink-0">→</span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          v0.2.0 — เกมเพิ่มด่านครบ 6 + ระบบโฟลเดอร์อวตาร
        </div>
      </main>
    </div>
  );
}
