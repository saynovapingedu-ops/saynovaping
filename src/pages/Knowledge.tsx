import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KNOWLEDGE, type KnowledgeEntry } from '../lib/knowledge';
import { SCENARIO_META, isStageUnlocked } from '../scenarios';
import { usePlayerStore } from '../store/playerStore';
import { sfx } from '../lib/sound';

const DIFF_COLOR: Record<KnowledgeEntry['difficulty'], string> = {
  'ง่าย':  'bg-success-100 text-success-700',
  'กลาง': 'bg-warning-100 text-warning-600',
  'ยาก':  'bg-danger-100 text-danger-600',
};

export default function Knowledge() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="min-h-full pb-10 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-detective-300/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 -left-20 w-64 h-64 bg-warning-500/20 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-md shadow-sm border-b border-detective-100/50
                         p-3 flex items-center gap-3">
        <button
          onClick={() => { sfx.click(); nav('/'); }}
          className="text-detective-500 px-3 py-1.5 rounded-lg hover:bg-detective-50 active:scale-95"
        >←</button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-detective-700 text-base">📖 ห้องสมุดความรู้</h2>
          <p className="text-[11px] text-gray-500">อ่านปูพื้นก่อนลงสนามจริง</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4">
        <div className="card-hero mb-4">
          <p className="text-sm text-detective-700 leading-relaxed">
            <strong>📚 อ่านก่อนเล่น</strong> — แต่ละด่านมีเนื้อหาสอนสั้นๆ ให้เข้าใจสูตรหลักก่อน
            ลองเปิดอ่านก่อน แล้วค่อยเข้าเล่นจะแม่นกว่า
          </p>
        </div>

        <div className="space-y-2">
          {KNOWLEDGE.map((k, i) => {
            const meta = SCENARIO_META.find(m => m.id === k.stageId);
            const unlocked = meta ? isStageUnlocked(k.stageId, player.stagesCompleted) : true;
            const completed = player.stagesCompleted.includes(k.stageId);
            const isOpen = openId === k.stageId;

            return (
              <motion.div
                key={k.stageId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`card overflow-hidden ${
                  completed ? 'border border-success-300' : ''
                }`}
              >
                <button
                  onClick={() => { sfx.click(); setOpenId(isOpen ? null : k.stageId); }}
                  className="w-full text-left flex items-center gap-3 -m-1 p-1"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                    completed
                      ? 'bg-gradient-to-br from-success-500 to-emerald-600 text-white'
                      : 'bg-gradient-to-br from-detective-100 to-detective-200'
                  }`}>
                    {completed ? '✓' : k.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">ด่าน {k.stageId}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${DIFF_COLOR[k.difficulty]}`}>
                        {k.difficulty}
                      </span>
                      {!unlocked && <span className="text-[10px] text-gray-400">🔒</span>}
                    </div>
                    <p className="font-semibold text-detective-700 truncate">{k.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">{k.concept}</p>
                  </div>
                  <span className={`text-detective-400 text-lg transition-transform ${
                    isOpen ? 'rotate-90' : ''
                  }`}>▸</span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pl-1 pr-1">
                        <ul className="space-y-1.5">
                          {k.points.map((pt, idx) => (
                            <li key={idx} className="text-sm text-gray-700 leading-relaxed flex gap-2">
                              <span className="text-detective-500 font-bold flex-shrink-0">{idx + 1}.</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>

                        {k.example && (
                          <div className="mt-3 bg-detective-50/70 border-l-4 border-detective-400 rounded-r-xl p-3">
                            <p className="text-[10px] uppercase tracking-wider text-detective-500 font-bold mb-1">
                              ตัวอย่าง
                            </p>
                            <p className="text-xs text-gray-600 mb-1">
                              <strong>สถานการณ์:</strong> {k.example.situation}
                            </p>
                            <p className="text-xs text-detective-700">
                              <strong>ลองพูด:</strong> "{k.example.response}"
                            </p>
                          </div>
                        )}

                        {k.source && (
                          <p className="text-[10px] text-gray-400 mt-2 italic">
                            อ้างอิง: {k.source}
                          </p>
                        )}

                        <div className="mt-3 flex gap-2">
                          {unlocked ? (
                            <button
                              onClick={() => { sfx.click(); nav(`/scenario/${k.stageId}`); }}
                              className="btn-primary flex-1 text-sm py-2"
                            >
                              ▶ {completed ? 'เล่นซ้ำ' : 'เริ่มด่านนี้'}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex-1 text-sm py-2 rounded-xl bg-gray-200 text-gray-500 font-semibold"
                            >
                              🔒 ปลดล็อกหลังจบด่าน {meta?.unlockAfter}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <p className="text-[11px] text-center text-gray-400 mt-6">
          💡 อ่านความรู้ก่อนเล่น = ผ่านด่านได้ลื่นกว่า
        </p>
      </main>
    </div>
  );
}
