import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { SCENARIO_META, isStageUnlocked, CERT_STAGE_COUNT } from '../scenarios';
import { SHOP_ITEMS } from '../lib/shopItems';
import XPBar from '../components/XPBar';
import Avatar from '../components/Avatar';
import { sfx } from '../lib/sound';

const INTRO_SEEN_KEY = 'hd_game_intro_seen_v1';

interface IntroSection {
  emoji: string;
  title: string;
  body: string;
}

const INTRO_SECTIONS: IntroSection[] = [
  {
    emoji: '🎯',
    title: 'เกี่ยวกับอะไร?',
    body: 'รู้ทันภัย "บุหรี่ไฟฟ้า" ฝึกทักษะปฏิเสธ จับเท็จโฆษณา',
  },
  {
    emoji: '🕹️',
    title: 'เล่นยังไง?',
    body: 'อ่านเหตุการณ์ → เลือกคำตอบ → เล่นมินิเกมสนุกๆ',
  },
  {
    emoji: '🏆',
    title: 'ได้อะไร?',
    body: 'เก็บ XP & เหรียญ ซื้อของแต่งห้อง จบครบรับ Certificate',
  },
  {
    emoji: '⏱️',
    title: 'นานแค่ไหน?',
    body: 'ด่านละ 5-8 นาที เล่นทีละด่านสบายๆ มี save ค้างไว้',
  },
];

export default function Home() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const pingDailyPlay = usePlayerStore(s => s.pingDailyPlay);

  // แสดง intro ครั้งแรกที่เข้าเกม (หรือคนกดเปิดเอง)
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try { return localStorage.getItem(INTRO_SEEN_KEY) !== '1'; }
    catch { return true; }
  });

  // ping daily ครั้งเดียวต่อวัน
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

  // ===== Intro / Tutorial overlay =====
  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-candy-200/40 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/3 -right-20 w-64 h-64 bg-warning-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-mint-200/40 rounded-full blur-3xl animate-pulse-slow" />
        </div>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col gap-3"
          >
            {/* Hero — compact horizontal */}
            <div className="card-hero flex items-center gap-3 py-3">
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="text-5xl flex-shrink-0"
              >
                🔍
              </motion.div>
              <div className="flex-1">
                <h1 className="text-xl font-display font-bold bg-gradient-to-r from-detective-600 via-candy-500
                               to-warning-500 bg-clip-text text-transparent leading-tight">
                  ก่อนเริ่มเล่น
                </h1>
                <p className="text-xs text-gray-600">ทำความรู้จักเกมกันก่อน!</p>
              </div>
            </div>

            {/* Tutorial sections — 2x2 grid compact */}
            <div className="grid grid-cols-2 gap-2">
              {INTRO_SECTIONS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.06 * i }}
                  className="card p-3"
                >
                  <div className="text-3xl mb-1">{s.emoji}</div>
                  <h3 className="font-display font-bold text-detective-700 text-sm leading-tight mb-1">{s.title}</h3>
                  <p className="text-[11px] text-gray-700 leading-snug">{s.body}</p>
                </motion.div>
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
    <div className="min-h-full pb-10 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 bg-candy-200/50 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-40 -right-20 w-64 h-64 bg-warning-200/40 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-mint-200/40 rounded-full blur-3xl" />
      </div>

      {/* Header — gradient ม่วง→ชมพู สดใส */}
      <header className="relative bg-gradient-to-br from-detective-500 via-detective-600 to-candy-500
                         text-white px-5 pt-6 pb-8 rounded-b-[2.5rem] shadow-xl overflow-hidden">
        <div className="absolute top-4 right-6 text-white/40 text-base">✨</div>
        <div className="absolute bottom-3 left-8 text-white/30 text-base">⭐</div>
        <div className="absolute top-10 left-1/2 text-white/20 text-xs">✦</div>

        <div className="flex items-center gap-3 relative">
          <Avatar
            preset={player.avatar}
            customId={player.customAvatarId}
            size={56}
            ring={!equippedFrameClass}
            className={equippedFrameClass}
          />
          <div className="flex-1 min-w-0">
            <p className="text-detective-100 text-xs">
              {player.equippedTitle ? `⭐ ${player.equippedTitle}` : '🔍 นักสืบสุขภาพ'}
            </p>
            <h2 className="font-display font-bold text-xl truncate">
              {player.nickname || 'ผู้เล่น'}
            </h2>
            {(player.streakDays || 0) > 0 && (
              <p className="text-warning-100 text-[11px] flex items-center gap-1">
                🔥 streak {player.streakDays} วัน
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => { sfx.click(); nav('/profile'); }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl p-2
                         transition-all active:scale-95"
              aria-label="โปรไฟล์"
            >
              <span className="text-base">👤</span>
            </button>
            <button
              onClick={() => { sfx.click(); nav('/settings'); }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl p-2
                         transition-all active:scale-95"
              aria-label="ตั้งค่า"
            >
              <span className="text-base">⚙️</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => { sfx.click(); nav('/shop'); }}
            className="flex items-center justify-between bg-white/20 backdrop-blur-sm
                       border border-white/20 rounded-2xl px-3 py-2.5 active:scale-[0.99] transition-all"
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
            className="flex items-center justify-between bg-white/20 backdrop-blur-sm
                       border border-white/20 rounded-2xl px-3 py-2.5 active:scale-[0.99] transition-all"
          >
            <span className="text-[11px] font-semibold flex items-center gap-1">
              🏠 ห้องของฉัน
            </span>
            <span className="text-base">→</span>
          </button>
        </div>

        <div className="mt-5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3.5 shadow-inner">
          <XPBar variant="dark" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6">
        {certEligible && !player.certificateNo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card relative overflow-hidden mb-4 border-2 border-warning-400
                       bg-gradient-to-br from-warning-50 to-candy-50"
          >
            <div className="absolute -top-4 -right-4 text-7xl opacity-25">🏆</div>
            <p className="text-warning-600 font-bold mb-2 relative">🏆 พร้อมรับ Certificate แล้ว!</p>
            <button onClick={() => nav('/certificate')} className="btn-primary w-full">
              รับใบประกาศนียบัตร ✨
            </button>
          </motion.div>
        )}

        {player.certificateNo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card mb-4 border-2 border-success-400
                       bg-gradient-to-br from-success-50 to-mint-50"
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
          <button
            onClick={() => { sfx.click(); setShowIntro(true); }}
            className="text-[11px] text-detective-500 font-semibold hover:text-detective-700"
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
            <div key={arc} className="mb-6">
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

              <div className="space-y-3">
                {stages.map((meta, i) => {
                  const unlocked = isStageUnlocked(meta.id, player.stagesCompleted);
                  const completed = player.stagesCompleted.includes(meta.id);
                  const playable = meta.available && unlocked;
                  const isMaster = meta.arc === 'master';
                  const isPro = meta.arc === 'pro';

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
                          ? 'border-2 border-success-400 bg-gradient-to-r from-success-50 to-white'
                          : playable
                          ? isMaster
                            ? 'border-2 border-warning-200 bg-gradient-to-r from-warning-50/60 to-white'
                            : isPro
                            ? 'border-2 border-mint-200 bg-gradient-to-r from-mint-50/60 to-white'
                            : 'border-2 border-candy-100 bg-gradient-to-r from-candy-50/30 to-white'
                          : 'bg-white/70'
                      }`}
                    >
                      {playable && (
                        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          completed
                            ? 'text-success-600 bg-success-50 border border-success-400/30'
                            : isMaster
                              ? 'text-warning-600 bg-warning-100'
                              : isPro
                              ? 'text-mint-600 bg-mint-100'
                              : 'text-candy-600 bg-candy-100'
                        }`}>
                          {completed ? '🔄 REPLAY' : isMaster ? 'MASTER' : isPro ? 'PRO' : 'NEW'}
                        </span>
                      )}

                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0
                                    shadow-sm ${
                          completed
                            ? 'bg-gradient-to-br from-success-400 to-success-500 text-white'
                            : playable
                            ? isMaster
                              ? 'bg-gradient-to-br from-warning-400 to-warning-500 text-white'
                              : isPro
                              ? 'bg-gradient-to-br from-mint-400 to-mint-500 text-white'
                              : 'bg-gradient-to-br from-detective-500 to-candy-500 text-white'
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
            </div>
          );
        })}

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => { sfx.click(); nav('/stats'); }}
            className="card p-3 text-center active:scale-95 transition-all hover:shadow-md"
          >
            <div className="text-2xl">📊</div>
            <p className="text-xs font-semibold text-detective-700 mt-1">คะแนน</p>
          </button>
          <button
            onClick={() => { sfx.click(); nav('/knowledge'); }}
            className="card p-3 text-center active:scale-95 transition-all hover:shadow-md
                       bg-gradient-to-br from-mint-50 to-white border-mint-200"
          >
            <div className="text-2xl">📖</div>
            <p className="text-xs font-semibold text-mint-600 mt-1">ความรู้</p>
          </button>
          <button
            onClick={() => { sfx.click(); nav('/certificate'); }}
            className="card p-3 text-center active:scale-95 transition-all hover:shadow-md"
          >
            <div className="text-2xl">🏆</div>
            <p className="text-xs font-semibold text-warning-600 mt-1">ใบประกาศ</p>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-detective-400 font-semibold">
            🚭 SayNo:สู้บุหรี่ไฟฟ้า
          </p>
        </div>
      </main>
    </div>
  );
}
