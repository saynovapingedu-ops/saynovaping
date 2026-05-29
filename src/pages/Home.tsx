import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { SCENARIO_META, isStageUnlocked, CERT_STAGE_COUNT } from '../scenarios';
import { SHOP_ITEMS } from '../lib/shopItems';
import XPBar from '../components/XPBar';
import Avatar from '../components/Avatar';
import BrandHeader from '../components/BrandHeader';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';

const INTRO_SEEN_KEY = 'hd_game_intro_seen_v1';

interface IntroSection {
  emoji: string;
  title: string;
  body: string;
}

const INTRO_SECTIONS: IntroSection[] = [
  { emoji: '🎯', title: 'เกี่ยวกับอะไร?', body: 'รู้ทันภัย "บุหรี่ไฟฟ้า" ฝึกทักษะปฏิเสธ จับเท็จโฆษณา' },
  { emoji: '🕹️', title: 'เล่นยังไง?',  body: 'อ่านเหตุการณ์ → เลือกคำตอบ → เล่นมินิเกมสนุกๆ' },
  { emoji: '🏆', title: 'ได้อะไร?',    body: 'เก็บคะแนน (XP) และเหรียญ ซื้อของแต่ง เปิดแฟ้มคดี รับเกียรติบัตร' },
  { emoji: '⏱️', title: 'นานแค่ไหน?',   body: 'ด่านละ 5-8 นาที เล่นทีละด่านสบายๆ ระบบบันทึกความคืบหน้าให้อัตโนมัติ' },
];

export default function Home() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const pingDailyPlay = usePlayerStore(s => s.pingDailyPlay);

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try { return localStorage.getItem(INTRO_SEEN_KEY) !== '1'; }
    catch { return true; }
  });

  // ย่อ/ขยายแต่ละบท — เปิดเฉพาะบทที่กำลังเล่นอยู่ ที่เหลือพับไว้ให้หน้าสั้น
  const [openArcs, setOpenArcs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    pingDailyPlay();
  }, [pingDailyPlay]);

  const closeIntro = () => {
    try { localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch { /* ignore */ }
    sfx.click();
    setShowIntro(false);
  };

  const equippedFrameClass = player.equippedFrame
    ? SHOP_ITEMS.find(i => i.id === player.equippedFrame)?.frameClass
    : undefined;
  const heroDone = player.stagesCompleted.filter(id => id <= CERT_STAGE_COUNT).length;
  const certEligible = heroDone >= CERT_STAGE_COUNT || player.totalXP >= 1500;

  // === quick actions flags ===
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const dailyDone = player.lastDailyDate === today;
  const examEligible = player.stagesCompleted.length >= SCENARIO_META.length || !!player.certificateNo;
  const showPreTest = player.preTestScore === undefined && player.stagesCompleted.length === 0;

  // ===== Intro / Tutorial =====
  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col max-w-md md:max-w-2xl mx-auto">
        <PageHeader title="ℹ️ วิธีเล่น" subtitle="ทำความรู้จักเกมก่อนเริ่ม" onBack={closeIntro} />
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col gap-3 p-4"
          >
            {/* Hero */}
            <div className="rainbow-header rounded-3xl p-4 text-white shadow-glow flex items-center gap-3">
              <div className="text-5xl drop-shadow-lg">🔍</div>
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-display font-extrabold leading-tight drop-shadow">
                  ก่อนเริ่มเล่น
                </h1>
                <p className="text-xs md:text-sm opacity-95">ทำความรู้จักเกมกันก่อน!</p>
              </div>
            </div>

            {/* 2×2 grid (md: 4-col single row) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {INTRO_SECTIONS.map((s, i) => (
                <div key={i} className="card p-3">
                  <div className="text-3xl mb-1">{s.emoji}</div>
                  <h3 className="font-display font-bold text-detective-700 text-sm leading-tight mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-700 leading-snug">{s.body}</p>
                </div>
              ))}
            </div>

            <div className="card py-2.5 border-2 border-warning-200 bg-gradient-to-br from-warning-50 to-white">
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                <b className="text-warning-600">💡 เคล็ดลับ:</b> ดู
                <button
                  onClick={() => { sfx.click(); nav('/knowledge'); }}
                  className="text-detective-500 font-bold underline mx-1"
                >หน้าความรู้</button>
                เพื่อรู้พิษภัยของบุหรี่ไฟฟ้าก่อน — มีคลิปวิดีโอด้วย!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto sticky bottom-0
                            pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => { sfx.click(); nav('/knowledge'); }}
                className="btn-secondary"
              >
                📖 อ่านก่อน
              </button>
              <button onClick={closeIntro} className="btn-primary">
                เริ่มเลย! 🎮
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ===== Main game home =====
  return (
    <div className="min-h-screen pb-24 relative bg-white">
      {/* ===== TMF blue header — extend to safe-area top (no white gap) ===== */}
      <section className="rainbow-header text-white relative overflow-hidden
                          pt-[max(2rem,calc(env(safe-area-inset-top)+1rem))]
                          px-5 pb-16">
        {/* ===== Top row: Profile (ซ้าย) + Pill (ขวา) บรรทัดเดียวกัน ===== */}
        <div className="max-w-md md:max-w-3xl mx-auto">
          <div className="flex items-center gap-2 relative">
            {/* Profile — ซ้าย, แตะ avatar/ชื่อ ไปหน้าโปรไฟล์ */}
            <button
              onClick={() => { sfx.click(); nav('/profile'); }}
              className="flex items-center gap-3 flex-1 min-w-0 text-left
                         rounded-2xl active:scale-[0.99] transition-transform"
              aria-label="โปรไฟล์"
            >
              <Avatar
                preset={player.avatar}
                customId={player.customAvatarId}
                size={56}
                ring={!equippedFrameClass}
                className={equippedFrameClass}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-xs">
                  {player.equippedTitle ? `⭐ ${player.equippedTitle}` : '🔍 นักสืบสุขภาพ'}
                </p>
                <h2 className="font-display font-extrabold text-xl truncate drop-shadow">
                  {player.nickname || 'ผู้เล่น'}
                </h2>
                {(player.streakDays || 0) > 0 && (
                  <p className="text-white/85 text-[11px] flex items-center gap-1">
                    🔥 เล่นต่อเนื่อง {player.streakDays} วัน
                  </p>
                )}
              </div>
            </button>

            {/* Sponsor badge — ขวา, ระนาบเดียวกับ profile */}
            <div className="flex-shrink-0">
              <BrandHeader variant="pill" />
            </div>
          </div>

          {/* ===== Glass cards: เหรียญ + ห้อง + ใบประกาศ ===== */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              onClick={() => { sfx.click(); nav('/shop'); }}
              className="flex flex-col items-center justify-center gap-0.5
                         bg-white/15 hover:bg-white/25 backdrop-blur-md
                         border border-white/25 rounded-2xl px-2 py-2.5
                         active:scale-[0.97] transition-all"
            >
              <span className="flex items-center gap-1">
                <span className="text-base">🪙</span>
                <span className="font-bold text-sm">{player.coins || 0}</span>
              </span>
              <span className="text-[10px] font-semibold opacity-90">🛍 ร้านค้า</span>
            </button>
            <button
              onClick={() => { sfx.click(); nav('/journal'); }}
              className="flex flex-col items-center justify-center gap-0.5
                         bg-white/15 hover:bg-white/25 backdrop-blur-md
                         border border-white/25 rounded-2xl px-2 py-2.5
                         active:scale-[0.97] transition-all"
            >
              <span className="text-lg">📓</span>
              <span className="text-[10px] font-semibold">สมุดบันทึก</span>
            </button>
            <button
              onClick={() => { sfx.click(); nav('/certificate'); }}
              className="flex flex-col items-center justify-center gap-0.5
                         bg-white/15 hover:bg-white/25 backdrop-blur-md
                         border border-white/25 rounded-2xl px-2 py-2.5
                         active:scale-[0.97] transition-all"
            >
              <span className="text-lg">🏆</span>
              <span className="text-[10px] font-semibold">ใบประกาศ</span>
            </button>
          </div>

          {/* ===== Glass: หลอด XP ===== */}
          <div className="mt-3 bg-white/10 backdrop-blur-md border border-white/30
                          rounded-2xl p-3 shadow-inner">
            <XPBar variant="dark" />
          </div>
        </div>
      </section>

      {/* ===== White sheet ขอบโค้งซ้อนทับสีฟ้า ===== */}
      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6 -mt-8 relative z-10
                       bg-white rounded-t-[28px]
                       shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.08)]">
        {certEligible && !player.certificateNo && (
          <div className="card relative overflow-hidden mb-4 border border-warning-300
                          bg-warning-50">
            <div className="absolute -top-3 -right-3 text-6xl opacity-15">🏆</div>
            <p className="text-warning-700 font-bold mb-2 relative">🏆 พร้อมรับเกียรติบัตรแล้ว!</p>
            <button onClick={() => nav('/certificate')} className="btn-sunny w-full">
              รับใบประกาศนียบัตร ✨
            </button>
          </div>
        )}

        {player.certificateNo && (
          <div className="card mb-4 border border-success-300 bg-success-50">
            <p className="text-success-700 font-bold mb-1">🏆 เกียรติบัตรของคุณ</p>
            <p className="text-sm text-slate-600 mb-2">เลขที่ {player.certificateNo}</p>
            <button onClick={() => nav('/certificate')} className="btn-secondary w-full">
              ดูเกียรติบัตร
            </button>
          </div>
        )}

        {/* === Quick actions: Daily / Exam / Pre-test === แถวเดียว 3 col */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {/* Daily Challenge — always */}
          <button
            onClick={() => { sfx.click(); nav('/daily'); }}
            className="card flex flex-col items-center text-center gap-1.5 p-3 relative
                       active:scale-[0.97] transition-all"
          >
            <div className={`icon-tile ${dailyDone ? 'bg-success-50 text-success-600' : 'bg-detective-50 text-detective-600'}`}>📅</div>
            <p className="font-bold text-detective-700 text-xs leading-tight">ภารกิจรายวัน</p>
            <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
              {dailyDone ? '✓ วันนี้ทำแล้ว' : 'ควิซ 5 ข้อ รับเหรียญ'}
            </p>
            {!dailyDone
              ? <span className="absolute top-1.5 right-1.5 pill bg-detective-100 text-detective-600">ใหม่</span>
              : <span className="absolute top-1.5 right-1.5 text-success-500 text-sm">✓</span>}
          </button>

          {/* Leaderboard — อันดับห้องเรียน */}
          <button
            onClick={() => { sfx.click(); nav('/leaderboard'); }}
            className="card flex flex-col items-center text-center gap-1.5 p-3
                       active:scale-[0.97] transition-all"
          >
            <div className="icon-tile bg-warning-50 text-warning-600">🏆</div>
            <p className="font-bold text-detective-700 text-xs leading-tight">กระดานอันดับ</p>
            <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
              เทียบคะแนนกับผู้เล่นทั้งหมด
            </p>
          </button>

          {/* Pre-test — เฉพาะผู้เล่นใหม่ที่ยังไม่ทำ */}
          {showPreTest && (
            <button
              onClick={() => { sfx.click(); nav('/assessment?kind=pre'); }}
              className="card flex flex-col items-center text-center gap-1.5 p-3
                         active:scale-[0.97] transition-all"
            >
              <div className="icon-tile bg-detective-50 text-detective-600">🅰️</div>
              <p className="font-bold text-detective-700 text-xs leading-tight">แบบประเมินก่อนเรียน</p>
              <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                ทำก่อนเล่น วัดความรู้
              </p>
            </button>
          )}

          {/* Final Exam — เมื่อจบครบ */}
          {examEligible && (
            <button
              onClick={() => { sfx.click(); nav('/exam'); }}
              className="card flex flex-col items-center text-center gap-1.5 p-3
                         active:scale-[0.97] transition-all"
            >
              <div className="icon-tile bg-warning-50 text-warning-600">🎓</div>
              <p className="font-bold text-detective-700 text-xs leading-tight">แบบทดสอบรวม</p>
              <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                ผ่าน 80% รับเหรียญตรา
                {player.examBestScore !== undefined && ` · สูงสุด ${player.examBestScore}%`}
              </p>
            </button>
          )}
        </div>

        {/* === Section header: แผนที่ภารกิจ + progress รวม === */}
        <div className="card-hero mb-4 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="section-label text-lg">
              <span className="text-2xl">📍</span> แผนที่ภารกิจ
            </h3>
            <button
              onClick={() => { sfx.click(); setShowIntro(true); }}
              className="text-xs text-detective-500 font-semibold hover:text-detective-700
                         active:opacity-70 flex items-center gap-1"
            >
              ℹ️ วิธีเล่น
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="progress-track flex-1">
              <div
                className="progress-fill"
                style={{ width: `${(player.stagesCompleted.length / SCENARIO_META.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-detective-700 flex-shrink-0">
              {player.stagesCompleted.length}/{SCENARIO_META.length} ด่าน
            </span>
          </div>
        </div>

        {(() => {
          // หาบทที่ "กำลังเล่นอยู่" = ด่านแรกที่เล่นได้แต่ยังไม่จบ → เปิดบทนั้นไว้
          const activeStage = SCENARIO_META.find(
            m => m.available && isStageUnlocked(m.id, player.stagesCompleted) && !player.stagesCompleted.includes(m.id)
          );
          const activeArc = activeStage?.arc || 'hero';
          return (['hero', 'master', 'pro', 'expert'] as const).map((arc) => {
          const stages = SCENARIO_META.filter(m => (m.arc || 'hero') === arc);
          if (stages.length === 0) return null;
          const arcLabel =
            arc === 'hero'   ? { name: 'บทที่ 1: เส้นทางนักสืบ', emoji: '🦸', desc: 'ด่าน 1-8 — จบรับเกียรติบัตร' }
          : arc === 'master' ? { name: 'บทที่ 2: ขั้นสูง',        emoji: '🎓', desc: 'ด่าน 9-12 — ขั้นสูง' }
          : arc === 'pro'    ? { name: 'บทที่ 3: เกมเพลย์ใหม่',   emoji: '🎯', desc: 'ด่าน 13-15 — มินิเกมใหม่' }
          :                    { name: 'บทที่ 4: เชี่ยวชาญ',      emoji: '🔬', desc: 'ด่าน 16-20 — เชี่ยวชาญบุหรี่ไฟฟ้า' };
          const arcCompleted = stages.filter(m => player.stagesCompleted.includes(m.id)).length;
          const isOpen = openArcs[arc] ?? (arc === activeArc);

          const arcPct = (arcCompleted / stages.length) * 100;
          const arcAllDone = arcCompleted === stages.length;

          return (
            <div key={arc} className="mb-3">
              <button
                onClick={() => { sfx.click(); setOpenArcs(o => ({ ...o, [arc]: !isOpen })); }}
                className={`w-full text-left rounded-2xl px-3 py-3 transition-all
                            active:scale-[0.99]
                            ${arcAllDone
                              ? 'bg-success-50 border border-success-200'
                              : arc === activeArc
                              ? 'bg-white border-2 border-detective-300 shadow-glow-sm'
                              : 'surface-soft hover:bg-detective-50/80'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`icon-tile shadow-sm flex-shrink-0
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
                      : 'bg-white text-detective-700 border border-detective-200'}`}>
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
                                    active:scale-[0.98] transition-all hover:shadow-glow-sm ${
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
                          className={`icon-tile font-bold shadow-glow-sm flex-shrink-0 ${
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
                          {meta.estMinutes && (
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <span>⏱</span> ~{meta.estMinutes} นาที
                            </p>
                          )}
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

        {/* footer ของ Home ตัดออก — แบรนด์ย้ายขึ้น header บนสุดแล้ว
            (อาจารย์ทักว่าไม่ควรไว้ล่างสุด) */}
      </main>

      {/* ===== Sticky bottom nav — โทนฟ้า TMF เด่นขึ้น 3 ปุ่ม ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-30
                      pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 px-3
                      bg-white/95 backdrop-blur-md border-t border-detective-100
                      shadow-[0_-4px_16px_-6px_rgba(0,143,255,0.12)]">
        <div className="max-w-md md:max-w-3xl mx-auto grid grid-cols-3 gap-2">
          {[
            { to: '/stats',     emoji: '📊', label: 'คะแนน',  iconBg: 'bg-detective-50 text-detective-600' },
            { to: '/knowledge', emoji: '📖', label: 'ความรู้', iconBg: 'bg-mint-50 text-mint-600' },
            { to: '/settings',  emoji: '⚙️', label: 'ตั้งค่า', iconBg: 'bg-warning-50 text-warning-600' },
          ].map(item => (
            <button
              key={item.to}
              onClick={() => { sfx.click(); nav(item.to); }}
              className="flex flex-col items-center gap-1 py-2 rounded-2xl
                         bg-white border border-detective-100
                         hover:border-detective-300 hover:shadow-glow-sm
                         active:scale-95 transition-all"
            >
              <span className={`icon-tile-sm ${item.iconBg}`}>{item.emoji}</span>
              <span className="text-xs font-bold text-detective-700">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
