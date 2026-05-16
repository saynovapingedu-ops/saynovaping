import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { SCENARIO_META, isStageUnlocked, CERT_STAGE_COUNT } from '../scenarios';
import { SHOP_ITEMS } from '../lib/shopItems';
import XPBar from '../components/XPBar';
import Avatar from '../components/Avatar';
import BrandHeader from '../components/BrandHeader';
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
  { emoji: '🏆', title: 'ได้อะไร?',    body: 'เก็บ XP & เหรียญ ซื้อของแต่งห้อง รับ Certificate' },
  { emoji: '⏱️', title: 'นานแค่ไหน?',   body: 'ด่านละ 5-8 นาที เล่นทีละด่านสบายๆ มี save' },
];

export default function Home() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const pingDailyPlay = usePlayerStore(s => s.pingDailyPlay);

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try { return localStorage.getItem(INTRO_SEEN_KEY) !== '1'; }
    catch { return true; }
  });

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

  // ===== Intro / Tutorial =====
  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col max-w-md mx-auto">
        <BrandHeader />
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col gap-3 p-4"
          >
            {/* Hero — TMF blue */}
            <div className="rainbow-header rounded-3xl p-4 text-white shadow-glow flex items-center gap-3">
              <div className="text-5xl drop-shadow-lg">🔍</div>
              <div className="flex-1">
                <h1 className="text-xl font-display font-extrabold leading-tight drop-shadow">
                  ก่อนเริ่มเล่น
                </h1>
                <p className="text-xs opacity-95">ทำความรู้จักเกมกันก่อน!</p>
              </div>
            </div>

            {/* 2×2 grid */}
            <div className="grid grid-cols-2 gap-2">
              {INTRO_SECTIONS.map((s, i) => (
                <div key={i} className="card p-3">
                  <div className="text-3xl mb-1">{s.emoji}</div>
                  <h3 className="font-display font-bold text-detective-700 text-sm leading-tight mb-1">{s.title}</h3>
                  <p className="text-[11px] text-gray-700 leading-snug">{s.body}</p>
                </div>
              ))}
            </div>

            <div className="card py-2.5 border-2 border-warning-200 bg-gradient-to-br from-warning-50 to-white">
              <p className="text-xs text-gray-700 leading-relaxed">
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
      {/* ===== Blue zone — ขยายขึ้นสุด ไม่มี white bar กั้นอีกแล้ว ===== */}
      <section className="rainbow-header text-white relative overflow-hidden
                          pt-[max(1.25rem,env(safe-area-inset-top))]
                          px-5 pb-14">
        {/* subtle sparkle */}
        <div className="absolute top-20 right-6 text-white/40 text-base pointer-events-none">✨</div>
        <div className="absolute bottom-16 left-6 text-white/30 text-sm pointer-events-none">⭐</div>

        {/* ===== Floating Pill (รวมโลโก้สองตัว) — ชิดขวา ===== */}
        <div className="flex justify-end mb-6">
          <BrandHeader variant="pill" />
        </div>

        {/* ===== โซนโปรไฟล์ ===== */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 relative">
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
                  🔥 streak {player.streakDays} วัน
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => { sfx.click(); nav('/profile'); }}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-md
                           border border-white/25 rounded-2xl p-2
                           transition-all active:scale-95"
                aria-label="โปรไฟล์"
              >
                <span className="text-base">👤</span>
              </button>
              <button
                onClick={() => { sfx.click(); nav('/settings'); }}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-md
                           border border-white/25 rounded-2xl p-2
                           transition-all active:scale-95"
                aria-label="ตั้งค่า"
              >
                <span className="text-base">⚙️</span>
              </button>
            </div>
          </div>

          {/* ===== Glass cards: เหรียญ + ห้อง ===== */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => { sfx.click(); nav('/shop'); }}
              className="flex items-center justify-between
                         bg-white/15 hover:bg-white/20 backdrop-blur-md
                         border border-white/25 rounded-2xl px-3 py-2.5
                         active:scale-[0.99] transition-all"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-lg">🪙</span>
                <span className="font-bold text-sm">{player.coins || 0}</span>
              </span>
              <span className="text-[11px] font-semibold flex items-center gap-1">
                🛍 ร้านค้า →
              </span>
            </button>
            <button
              onClick={() => { sfx.click(); nav('/room'); }}
              className="flex items-center justify-between
                         bg-white/15 hover:bg-white/20 backdrop-blur-md
                         border border-white/25 rounded-2xl px-3 py-2.5
                         active:scale-[0.99] transition-all"
            >
              <span className="text-[11px] font-semibold flex items-center gap-1">
                🏠 ห้องของฉัน
              </span>
              <span className="text-base">→</span>
            </button>
          </div>

          {/* ===== Glass: หลอด XP ===== */}
          <div className="mt-3 bg-white/15 backdrop-blur-md border border-white/25
                          rounded-2xl p-3 shadow-inner">
            <XPBar variant="dark" />
          </div>
        </div>
      </section>

      {/* ===== White sheet ขอบโค้งซ้อนทับสีฟ้า ===== */}
      <main className="max-w-md mx-auto px-4 pt-6 -mt-8 relative z-10
                       bg-white rounded-t-[28px]
                       shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.08)]">
        {certEligible && !player.certificateNo && (
          <div className="card relative overflow-hidden mb-4 border border-warning-300
                          bg-warning-50">
            <div className="absolute -top-3 -right-3 text-6xl opacity-15">🏆</div>
            <p className="text-warning-700 font-bold mb-2 relative">🏆 พร้อมรับ Certificate แล้ว!</p>
            <button onClick={() => nav('/certificate')} className="btn-sunny w-full">
              รับใบประกาศนียบัตร ✨
            </button>
          </div>
        )}

        {player.certificateNo && (
          <div className="card mb-4 border border-success-300 bg-success-50">
            <p className="text-success-700 font-bold mb-1">🏆 Certificate ของคุณ</p>
            <p className="text-sm text-slate-600 mb-2">เลขที่ {player.certificateNo}</p>
            <button onClick={() => nav('/certificate')} className="btn-secondary w-full">
              ดู Certificate
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-extrabold text-detective-700 text-lg flex items-center gap-2">
            <span className="text-2xl">📍</span> แผนที่ภารกิจ
          </h3>
          <button
            onClick={() => { sfx.click(); setShowIntro(true); }}
            className="text-[11px] text-detective-500 font-semibold hover:text-detective-700 active:opacity-70"
          >
            ℹ️ วิธีเล่น
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {player.stagesCompleted.length}/{SCENARIO_META.length} ด่าน
        </p>

        {(['hero', 'master', 'pro'] as const).map((arc) => {
          const stages = SCENARIO_META.filter(m => (m.arc || 'hero') === arc);
          if (stages.length === 0) return null;
          const arcLabel =
            arc === 'hero'   ? { name: 'บทที่ 1: เส้นทางนักสืบ', emoji: '🦸', desc: 'ด่าน 1-8 — จบรับ Certificate' }
          : arc === 'master' ? { name: 'บทที่ 2: Master Class',   emoji: '🎓', desc: 'ด่าน 9-12 — ขั้นสูง' }
          :                    { name: 'บทที่ 3: Pro Arc',         emoji: '🎯', desc: 'ด่าน 13-15 — มินิเกมใหม่' };
          const arcCompleted = stages.filter(m => player.stagesCompleted.includes(m.id)).length;

          return (
            <div key={arc} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{arcLabel.emoji}</span>
                <div className="flex-1">
                  <h4 className="font-display font-bold text-detective-700 text-base leading-tight">
                    {arcLabel.name}
                  </h4>
                  <p className="text-[11px] text-gray-500">{arcLabel.desc}</p>
                </div>
                <span className="pill bg-detective-100 text-detective-700">
                  {arcCompleted}/{stages.length}
                </span>
              </div>

              <div className="space-y-2">
                {stages.map((meta) => {
                  const unlocked = isStageUnlocked(meta.id, player.stagesCompleted);
                  const completed = player.stagesCompleted.includes(meta.id);
                  const playable = meta.available && unlocked;

                  return (
                    <button
                      key={meta.id}
                      disabled={!playable}
                      onClick={() => playable && nav(`/scenario/${meta.id}`)}
                      className={`w-full text-left card flex items-center gap-3 relative
                                  transition-all ${
                        !playable
                          ? 'opacity-60 grayscale'
                          : 'active:scale-[0.98]'
                      } ${
                        completed
                          ? 'border-2 border-success-300 bg-gradient-to-r from-success-50 to-white'
                          : playable
                          ? 'border-2 border-candy-100'
                          : 'bg-white/70'
                      }`}
                    >
                      {playable && (
                        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          completed
                            ? 'text-success-600 bg-success-50'
                            : 'text-candy-600 bg-candy-100'
                        }`}>
                          {completed ? '🔄 REPLAY' : 'NEW'}
                        </span>
                      )}

                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0
                                    shadow-sm ${
                          completed
                            ? 'bg-success-500 text-white'
                            : playable
                            ? 'bg-detective-600 text-white'
                            : 'bg-slate-200 text-slate-500'
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
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* footer ของ Home ตัดออก — แบรนด์ย้ายขึ้น header บนสุดแล้ว
            (อาจารย์ทักว่าไม่ควรไว้ล่างสุด) */}
      </main>

      {/* ===== Sticky bottom nav — เห็นตลอดแม้ scroll ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-30
                      pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 px-3
                      bg-gradient-to-t from-white via-white/95 to-transparent">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2 bg-white/95 backdrop-blur-md
                        rounded-2xl shadow-glow border border-detective-100 p-1.5">
          <button
            onClick={() => { sfx.click(); nav('/stats'); }}
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl
                       active:scale-95 active:bg-detective-50 transition-all"
          >
            <span className="text-xl">📊</span>
            <span className="text-[11px] font-bold text-detective-700">คะแนน</span>
          </button>
          <button
            onClick={() => { sfx.click(); nav('/knowledge'); }}
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl
                       active:scale-95 active:bg-mint-50 transition-all"
          >
            <span className="text-xl">📖</span>
            <span className="text-[11px] font-bold text-mint-600">ความรู้</span>
          </button>
          <button
            onClick={() => { sfx.click(); nav('/certificate'); }}
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl
                       active:scale-95 active:bg-warning-50 transition-all"
          >
            <span className="text-xl">🏆</span>
            <span className="text-[11px] font-bold text-warning-600">ใบประกาศ</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
