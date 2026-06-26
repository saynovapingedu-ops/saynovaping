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
import { CHANGELOG, hasUnseenChangelog, markChangelogSeen } from '../lib/changelog';

const INTRO_SEEN_KEY = 'hd_game_intro_seen_v1';

interface IntroSection {
  emoji: string;
  title: string;
  body: string;
}

const INTRO_SECTIONS: IntroSection[] = [
  { emoji: '🎯', title: 'เกี่ยวกับอะไร?', body: 'รู้ทันภัย "บุหรี่ไฟฟ้า" ฝึกทักษะปฏิเสธ จับเท็จโฆษณา' },
  { emoji: '🕹️', title: 'เล่นยังไง?',  body: 'อ่านเหตุการณ์ → เลือกคำตอบ → เล่นมินิเกมสนุกๆ' },
  { emoji: '🏆', title: 'ได้อะไร?',    body: 'แต้ม → เลื่อนระดับนักสืบ · เหรียญ 🪙 → ซื้อของแต่ง · จบบทแรกรับเกียรติบัตร' },
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

  // ป๊อปอัป "มีอะไรใหม่" — โชว์ครั้งเดียวต่อเวอร์ชัน (ไม่ชนกับ intro ผู้เล่นใหม่)
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    pingDailyPlay();
  }, [pingDailyPlay]);

  useEffect(() => {
    if (!showIntro && hasUnseenChangelog()) setShowChangelog(true);
  }, [showIntro]);

  const closeChangelog = () => {
    markChangelogSeen();
    sfx.click();
    setShowChangelog(false);
  };

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

  // ===== ด่านที่ "ควรเล่นต่อ" = ด่านแรกที่เล่นได้แต่ยังไม่จบ — ใช้ทำปุ่มเริ่ม/เล่นต่อ + เปิดบทบนแผนที่ =====
  const activeStage = SCENARIO_META.find(
    m => m.available && isStageUnlocked(m.id, player.stagesCompleted) && !player.stagesCompleted.includes(m.id)
  );
  const isNewPlayer = player.stagesCompleted.length === 0;

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
            <div className="rainbow-header rounded-3xl p-4 text-white shadow-clay flex items-center gap-3">
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

            <div className="card py-2.5 border-2 border-warning-200 bg-gradient-to-br from-warning-50 to-[#FFFCF7]">
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
    <div className="min-h-screen pb-28 relative bg-[#FBF3EA]">
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

          {/* ===== Glass cards: เหรียญ + แฟ้มคดี + เกียรติบัตร ===== */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              onClick={() => { sfx.click(); nav('/shop'); }}
              className="clay-glass flex flex-col items-center justify-center gap-0.5
                         rounded-[18px] px-2 py-2.5
                         active:scale-[0.97] transition-all"
            >
              <span className="flex items-center gap-1">
                <span className="text-base">🪙</span>
                <span className="font-bold text-sm">{player.coins || 0}</span>
              </span>
              <span className="text-[10px] font-semibold opacity-90">🛍 ร้านคุณลุง</span>
            </button>
            <button
              onClick={() => { sfx.click(); nav('/journal'); }}
              className="clay-glass flex flex-col items-center justify-center gap-0.5
                         rounded-[18px] px-2 py-2.5
                         active:scale-[0.97] transition-all"
            >
              <span className="text-lg">🗂️</span>
              <span className="text-[10px] font-semibold">แฟ้มคดี</span>
            </button>
            <button
              onClick={() => { sfx.click(); nav('/certificate'); }}
              className="clay-glass flex flex-col items-center justify-center gap-0.5
                         rounded-[18px] px-2 py-2.5
                         active:scale-[0.97] transition-all"
            >
              <span className="text-lg">🏆</span>
              <span className="text-[10px] font-semibold">เกียรติบัตร</span>
            </button>
          </div>

          {/* ===== Glass: หลอด XP ===== */}
          <div className="clay-glass mt-3 rounded-[20px] p-3">
            <XPBar variant="dark" />
          </div>
        </div>
      </section>

      {/* ===== Cream sheet ขอบโค้งซ้อนทับสีฟ้า ===== */}
      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-6 -mt-8 relative z-10
                       bg-[#FBF3EA] rounded-t-[32px]
                       shadow-[0_-6px_20px_-4px_rgba(176,138,104,0.14)]">
        {/* ลิงก์ช่วยเหลือ — บนสุด เห็นชัดสำหรับคนใหม่/งง */}
        <div className="flex items-center justify-center gap-2 mb-3 -mt-1">
          <button
            onClick={() => { sfx.click(); setShowChangelog(true); }}
            className="text-xs text-detective-600 font-semibold bg-[#FFFCF7] shadow-clay-sm rounded-full px-3.5 py-1.5 active:scale-95 flex items-center gap-1"
          >
            🆕 มีอะไรใหม่
          </button>
          <button
            onClick={() => { sfx.click(); setShowIntro(true); }}
            className="text-xs text-detective-600 font-semibold bg-[#FFFCF7] shadow-clay-sm rounded-full px-3.5 py-1.5 active:scale-95 flex items-center gap-1"
          >
            ℹ️ วิธีเล่น
          </button>
        </div>

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

        {/* === ปุ่มหลัก: เริ่ม / เล่นต่อ — เด่นบนสุด ตัดปัญหา "งงไม่รู้เริ่มตรงไหน" === */}
        {activeStage ? (
          <button
            onClick={() => { sfx.click(); nav(`/scenario/${activeStage.id}`); }}
            className="w-full text-left mb-4 flex items-center gap-3 px-4 py-4 rounded-[28px]
                       bg-gradient-to-br from-detective-100 to-[#FFFCF7] shadow-clay
                       active:translate-y-px transition-all"
          >
            <div className="icon-tile bg-gradient-to-br from-detective-500 to-detective-700
                            text-white font-extrabold text-lg shadow-clay-blue flex-shrink-0">
              {activeStage.id}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-detective-500">
                {isNewPlayer ? '🎮 เริ่มเล่นเลย' : '▶ เล่นต่อ'}
              </p>
              <p className="font-display font-extrabold text-detective-800 text-base leading-tight truncate">
                ด่าน {activeStage.id}: {activeStage.title}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {activeStage.subtitle}
                {activeStage.estMinutes ? ` · ⏱ ~${activeStage.estMinutes} นาที` : ''}
              </p>
            </div>
            <span className="text-3xl text-detective-500 flex-shrink-0">→</span>
          </button>
        ) : examEligible ? (
          <button
            onClick={() => { sfx.click(); nav('/exam'); }}
            className="w-full text-left mb-4 flex items-center gap-3 px-4 py-4 rounded-[28px]
                       bg-gradient-to-br from-warning-100 to-[#FFFCF7] shadow-clay
                       active:translate-y-px transition-all"
          >
            <div className="icon-tile bg-gradient-to-br from-warning-400 to-warning-500
                            text-white text-lg shadow-clay-gold flex-shrink-0">🎓</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-warning-600">
                ✓ จบครบทุกด่านแล้ว
              </p>
              <p className="font-display font-extrabold text-detective-800 text-base leading-tight">
                ลองแบบทดสอบรวม
              </p>
              <p className="text-xs text-slate-500 mt-0.5">ผ่าน 80% รับเหรียญตรา</p>
            </div>
            <span className="text-3xl text-warning-500 flex-shrink-0">→</span>
          </button>
        ) : null}

        {/* === แผนที่ภารกิจ + แถบความคืบหน้า — อยู่คู่กับปุ่มเล่นต่อ === */}
        <button
          onClick={() => { sfx.click(); nav('/map'); }}
          className="w-full text-left card-hero mb-4 px-4 py-3.5 flex items-center gap-3 active:scale-[0.99] transition-all"
        >
          <div className="icon-tile bg-detective-50 text-detective-600 text-2xl flex-shrink-0">🗺️</div>
          <div className="flex-1 min-w-0">
            <p className="section-label text-base">แผนที่ภารกิจ</p>
            {(() => {
              const mainDone = player.stagesCompleted.filter(id => id <= CERT_STAGE_COUNT).length;
              return (
                <>
                  <div className="progress-track mt-1.5">
                    <div className="progress-fill" style={{ width: `${(mainDone / CERT_STAGE_COUNT) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">บทหลัก {mainDone}/{CERT_STAGE_COUNT} · แตะดูด่านทั้งหมด</p>
                </>
              );
            })()}
          </div>
          <span className="text-2xl text-detective-400 flex-shrink-0">→</span>
        </button>

        {/* === Quick actions: Daily / Leaderboard / [สลับ] / เกมสนุก === แถวเดียว 4 col */}
        <div className="mb-4 grid grid-cols-4 gap-1.5">
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
              ? <span className="absolute top-1.5 right-1.5 pill bg-coral-500 text-white">ใหม่</span>
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

          {/* เหรียญตรา/ความสำเร็จ — เติมช่องที่ 3 ตอนผู้เล่นกลางเกม (ไม่โชว์ pre-test/exam) */}
          {!showPreTest && !examEligible && (
            <button
              onClick={() => { sfx.click(); nav('/achievements'); }}
              className="card flex flex-col items-center text-center gap-1.5 p-3 relative
                         active:scale-[0.97] transition-all"
            >
              <div className="icon-tile bg-mint-50 text-mint-600">🎖️</div>
              <p className="font-bold text-detective-700 text-xs leading-tight">เหรียญตรา</p>
              <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                {player.badges.length > 0
                  ? `สะสมแล้ว ${player.badges.length} ตรา`
                  : 'สะสมตราจากการเล่น'}
              </p>
            </button>
          )}

          {/* โซนเกมสนุก (อาร์เคด) — ช่องที่ 4 ในแถว เขียวมิ้นต์ TMF */}
          <button
            onClick={() => { sfx.click(); nav('/arcade'); }}
            className="card flex flex-col items-center text-center gap-1.5 p-3
                       active:scale-[0.97] transition-all"
          >
            <div className="icon-tile bg-mint-50 text-mint-600">🎮</div>
            <p className="font-bold text-detective-700 text-xs leading-tight">เกมสนุก</p>
            <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">มินิเกมพักสมอง</p>
          </button>
        </div>

        {/* footer ของ Home ตัดออก — แบรนด์ย้ายขึ้น header บนสุดแล้ว
            (อาจารย์ทักว่าไม่ควรไว้ล่างสุด) */}
      </main>

      {/* ===== Sticky bottom nav — โทนฟ้า TMF เด่นขึ้น 3 ปุ่ม ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-30
                      pb-[max(0.9rem,calc(env(safe-area-inset-bottom)+0.5rem))] pt-3 px-4
                      liquid-header rounded-t-[28px]
                      shadow-[0_-6px_18px_-10px_rgba(176,138,104,0.5)]">
        <div className="max-w-md md:max-w-3xl mx-auto grid grid-cols-3 gap-2.5">
          {[
            { to: '/stats',     emoji: '📊', label: 'คะแนน',  iconBg: 'bg-detective-50 text-detective-600' },
            { to: '/knowledge', emoji: '📖', label: 'ความรู้', iconBg: 'bg-mint-50 text-mint-600' },
            { to: '/settings',  emoji: '⚙️', label: 'ตั้งค่า', iconBg: 'bg-warning-50 text-warning-600' },
          ].map(item => (
            <button
              key={item.to}
              onClick={() => { sfx.click(); nav(item.to); }}
              className="flex flex-col items-center gap-1 py-2 rounded-[18px]
                         bg-[#FFFCF7] shadow-clay-sm hover:shadow-clay
                         active:scale-95 transition-all"
            >
              <span className={`icon-tile-sm ${item.iconBg}`}>{item.emoji}</span>
              <span className="text-xs font-bold text-detective-700">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ===== ป๊อปอัป "มีอะไรใหม่" ===== */}
      {showChangelog && CHANGELOG[0] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
             onClick={closeChangelog}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm liquid-modal rounded-[28px] p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🆕</span>
              <h3 className="font-display font-extrabold text-detective-800 text-lg leading-tight">
                มีอะไรใหม่
              </h3>
              <span className="ml-auto pill bg-detective-100 text-detective-600">
                v{CHANGELOG[0].version}
              </span>
            </div>
            <p className="text-sm font-semibold text-detective-600 mb-3">{CHANGELOG[0].title}</p>
            <ul className="space-y-2 mb-4">
              {CHANGELOG[0].items.map((it, i) => (
                <li key={i} className="text-sm text-slate-700 leading-snug flex gap-2">
                  <span className="text-detective-400 flex-shrink-0">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
            <button onClick={closeChangelog} className="btn-primary w-full">
              เริ่มเล่นเลย! ✨
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
