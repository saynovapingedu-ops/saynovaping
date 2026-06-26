import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { SCENARIO_META, isStageUnlocked, getStageDifficulty, CERT_STAGE_COUNT } from '../scenarios';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';

// ป้ายระดับความยาก — โชว์บนการ์ดด่าน
const DIFFICULTY_INFO: Record<string, { label: string; cls: string }> = {
  easy:    { label: '🟢 ง่าย',     cls: 'bg-success-100 text-success-700' },
  medium:  { label: '🟡 ปานกลาง', cls: 'bg-detective-100 text-detective-700' },
  hard:    { label: '🟠 ยาก',      cls: 'bg-warning-100 text-warning-700' },
  advance: { label: '🔴 ขั้นกว่า', cls: 'bg-danger-100 text-danger-700' },
};

// ============================================================================
//  MissionMap — แผนที่ภารกิจ (แยกออกจากหน้าหลักเพื่อไม่ให้ Home รก)
//  รายชื่อด่านทั้งหมด จัดเป็น 3 อาร์ค ย่อ/ขยายได้ + ปุ่มเข้าเล่นแต่ละด่าน
// ============================================================================

export default function MissionMap() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const [openArcs, setOpenArcs] = useState<Record<string, boolean>>({});

  // ด่านที่ "ควรเล่นต่อ" = ด่านแรกที่เล่นได้แต่ยังไม่จบ — ใช้เปิดบทที่กำลังเล่นไว้
  const activeStage = SCENARIO_META.find(
    m => m.available && isStageUnlocked(m.id, player.stagesCompleted) && !player.stagesCompleted.includes(m.id)
  );

  return (
    <div className="min-h-screen pb-10 bg-[#FBF3EA]">
      <PageHeader title="🗺️ แผนที่ภารกิจ" subtitle="เลือกด่านที่จะเล่น" backTo="/" />

      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-4">
        {/* === ความคืบหน้ารวม === */}
        <div className="card-hero mb-4 px-4 py-3">
          {(() => {
            const mainDone = player.stagesCompleted.filter(id => id <= CERT_STAGE_COUNT).length;
            return (
              <div className="flex items-center gap-2">
                <div className="progress-track flex-1">
                  <div className="progress-fill" style={{ width: `${(mainDone / CERT_STAGE_COUNT) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-detective-700 flex-shrink-0">
                  บทหลัก {mainDone}/{CERT_STAGE_COUNT}
                </span>
              </div>
            );
          })()}
        </div>

        {(() => {
          // จัดกลุ่มตาม "บทเรื่อง" (arc) ให้ตรงกับแฟ้มคดีและข้อมูลจริง:
          //   hero 1-8 (บทหลัก จบ = รับเกียรติบัตร) · master 9-12 · pro 13-15 · expert 16-20
          const SECTIONS = [
            { key: 'hero',   name: 'บทที่ 1: เปิดสำนวนแรก',    emoji: '🔍', desc: 'ก้าวแรกของนักสืบมือใหม่ · ด่าน 1-8 · จบรับเกียรติบัตร 🎓', min: 1,  max: 8 },
            { key: 'master', name: 'บทที่ 2: ตามรอยเบาะแส',    emoji: '🧩', desc: 'คดีซับซ้อนขึ้น ต้องสืบให้ลึก · ด่าน 9-12', min: 9,  max: 12 },
            { key: 'pro',    name: 'บทที่ 3: ลงพื้นที่จริง',     emoji: '📍', desc: 'ภาคสนาม เจอกลลวงรูปแบบใหม่ · ด่าน 13-15', min: 13, max: 15 },
            { key: 'expert', name: 'บทที่ 4: ปิดคดีบุหรี่ไฟฟ้า', emoji: '🔬', desc: 'เจาะลึกถึงต้นตอ คดีใหญ่สุดท้าย · ด่าน 16-20', min: 16, max: 20 },
          ] as const;
          // เปิดบทที่ "กำลังเล่นอยู่" ไว้
          const activeArc = activeStage
            ? (activeStage.id <= 8 ? 'hero' : activeStage.id <= 12 ? 'master' : activeStage.id <= 15 ? 'pro' : 'expert')
            : 'hero';
          return SECTIONS.map((sec) => {
          const arc = sec.key;
          const stages = SCENARIO_META.filter(m => m.id >= sec.min && m.id <= sec.max);
          if (stages.length === 0) return null;
          const arcLabel = { name: sec.name, emoji: sec.emoji, desc: sec.desc };
          const arcCompleted = stages.filter(m => player.stagesCompleted.includes(m.id)).length;
          const isOpen = openArcs[arc] ?? (arc === activeArc);

          const arcPct = (arcCompleted / stages.length) * 100;
          const arcAllDone = arcCompleted === stages.length;

          return (
            <div key={arc} className="mb-3">
              <button
                onClick={() => { sfx.click(); setOpenArcs(o => ({ ...o, [arc]: !isOpen })); }}
                className={`w-full text-left rounded-[20px] px-3 py-3 transition-all
                            active:scale-[0.99] outline-none
                            focus-visible:ring-2 focus-visible:ring-detective-300 focus-visible:ring-offset-2
                            ${arcAllDone
                              ? 'bg-success-50 shadow-clay-sm'
                              : arc === activeArc
                              ? 'bg-[#FFFCF7] shadow-clay'
                              : 'bg-[#FFFCF7] shadow-clay-sm hover:shadow-clay'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`icon-tile flex-shrink-0
                                   ${arcAllDone
                                     ? 'bg-success-500 text-white'
                                     : 'bg-white text-detective-600'}`}>
                    {arcAllDone ? '✓' : arcLabel.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-detective-700 text-base leading-tight">
                      {arcLabel.name}
                    </h4>
                    <p className="text-xs text-slate-500 leading-snug mt-0.5">{arcLabel.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`pill ${arcAllDone
                      ? 'bg-success-500 text-white'
                      : 'bg-[#FFFCF7] text-detective-700'}`}>
                      {arcCompleted}/{stages.length}
                    </span>
                    <span className="text-detective-400 text-xs">
                      {isOpen ? '▴ ย่อ' : '▾ ขยาย'}
                    </span>
                  </div>
                </div>
                {/* Progress bar ใต้ header — แสดงเฉพาะตอน collapsed เพื่อไม่รก */}
                {!isOpen && arcCompleted > 0 && (
                  <div className="progress-track mt-2.5 h-1.5">
                    <div
                      className={arcAllDone
                        ? 'h-full rounded-full bg-gradient-to-r from-success-400 to-success-500'
                        : 'progress-fill'}
                      style={{ width: `${arcPct}%` }}
                    />
                  </div>
                )}
              </button>

              {/* Stages — connector line ซ้าย เชื่อมกับบท */}
              <AnimatePresence initial={false}>
              {isOpen && (
              <motion.div
                key={`${arc}-stages`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="relative pl-6 mt-2 ml-4 md:ml-6 md:grid md:grid-cols-2 md:gap-2
                                md:pl-0 md:ml-0 space-y-1.5 md:space-y-0
                                before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5
                                before:bg-gradient-to-b before:from-detective-200 before:to-detective-100
                                md:before:hidden">
                  {stages.map((meta) => {
                    const unlocked = isStageUnlocked(meta.id, player.stagesCompleted);
                    const completed = player.stagesCompleted.includes(meta.id);
                    const playable = meta.available && unlocked;

                    // ====== Locked stage — compact, ไม่กดได้ ======
                    if (!playable) {
                      return (
                        <div
                          key={meta.id}
                          className="relative flex items-center gap-3 px-3 py-2 rounded-xl
                                     bg-slate-50/70 border border-slate-200/70 opacity-75"
                        >
                          {/* dot บนเส้น connector */}
                          <span className="absolute -left-[26px] top-1/2 -translate-y-1/2 w-3 h-3
                                           rounded-full bg-slate-300 border-2 border-white md:hidden"
                                aria-hidden />
                          <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-500 font-bold
                                          flex items-center justify-center text-sm flex-shrink-0">
                            {meta.id}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-500 text-sm truncate">{meta.title}</p>
                            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                              <span>🔒</span>
                              {!meta.available
                                ? 'เร็วๆ นี้'
                                : `ปลดล็อกหลังจบด่าน ${meta.unlockAfter}`}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // ====== Playable / Completed stage — เด่น ======
                    return (
                      <button
                        key={meta.id}
                        onClick={() => nav(`/scenario/${meta.id}`)}
                        className={`relative w-full text-left card flex items-center gap-3 py-3
                                    active:scale-[0.98] transition-all hover:shadow-clay ${
                          completed
                            ? 'border-l-4 border-l-success-400 bg-success-50/30'
                            : 'border-l-4 border-l-detective-400'
                        }`}
                      >
                        {/* dot บนเส้น connector */}
                        <span className={`absolute -left-[26px] top-1/2 -translate-y-1/2 w-3.5 h-3.5
                                         rounded-full border-2 border-white md:hidden shadow-sm
                                         ${completed ? 'bg-success-500' : 'bg-detective-500'}`}
                              aria-hidden />

                        <span className={`absolute top-1.5 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          completed
                            ? 'text-success-600 bg-success-100'
                            : 'text-detective-600 bg-detective-100'
                        }`}>
                          {completed ? '🔄 REPLAY' : 'NEW'}
                        </span>

                        <div
                          className={`icon-tile font-bold flex-shrink-0 ${
                            completed
                              ? 'bg-gradient-to-br from-success-400 to-success-600 text-white'
                              : 'bg-gradient-to-br from-detective-500 to-detective-700 text-white'
                          }`}
                        >
                          {completed ? '✓' : meta.id}
                        </div>
                        <div className="flex-1 min-w-0 pr-12">
                          <p className="font-bold text-slate-800 truncate">{meta.title}</p>
                          <p className="text-xs text-slate-500 truncate">{meta.subtitle}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${DIFFICULTY_INFO[getStageDifficulty(meta.id)].cls}`}>
                              {DIFFICULTY_INFO[getStageDifficulty(meta.id)].label}
                            </span>
                            {meta.estMinutes && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <span>⏱</span> ~{meta.estMinutes} นาที
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-2xl flex-shrink-0 ${
                          completed ? 'text-success-500' : 'text-detective-500'
                        }`}>
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
              )}
              </AnimatePresence>
            </div>
          );
          });
        })()}
      </main>
    </div>
  );
}
