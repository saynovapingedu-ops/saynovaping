import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '../lib/sound';

// ===== เนื้อหาความรู้เรื่องบุหรี่ไฟฟ้า — สำหรับ ม.ต้น =====

interface DangerCard {
  emoji: string;
  title: string;
  body: string;
  color: 'detective' | 'candy' | 'warning' | 'mint' | 'danger';
}

const DANGERS: DangerCard[] = [
  { emoji: '🫁', title: 'ทำลายปอด (EVALI)',
    body: '"โรคปอดอักเสบเฉียบพลันจากบุหรี่ไฟฟ้า" พบในเยาวชนเยอะ บางคนต้องเข้า ICU',
    color: 'danger' },
  { emoji: '🧠', title: 'ติดเร็วกว่าที่คิด',
    body: 'นิโคติน vape 1 ตัว ≈ บุหรี่ 20 มวน สมองวัยรุ่นติดเร็วกว่าผู้ใหญ่ 4 เท่า',
    color: 'detective' },
  { emoji: '💔', title: 'หัวใจเต้นผิดจังหวะ',
    body: 'หัวใจเต้นเร็ว ความดันสูง เสี่ยงโรคหัวใจตั้งแต่อายุน้อย กระทบกีฬา-เรียน',
    color: 'candy' },
  { emoji: '🎭', title: 'การตลาดหลอกล่อ',
    body: 'รสผลไม้-ลูกอม ดึงดูดเด็ก แต่ซ่อนสารพิษ โลหะหนัก สารก่อมะเร็ง',
    color: 'warning' },
  { emoji: '⚖️', title: 'ผิดกฎหมายในไทย',
    body: 'ห้ามตั้งแต่ปี 2557 — ครอบครอง/ขาย/นำเข้า มีโทษปรับและจำคุก',
    color: 'mint' },
  { emoji: '🎓', title: 'กระทบสมาธิ-ความจำ',
    body: 'นิโคตินทำลายสมองส่วนคิด-จดจำ สมาธิสั้น เกรดตก สอบตก',
    color: 'detective' },
];

const REJECT_TIPS = [
  { step: '1️⃣', title: 'พูด "ไม่" ชัด',  example: '"ไม่ครับ" / "ไม่ค่ะ"' },
  { step: '2️⃣', title: 'บอกเหตุผลสั้น',  example: '"ฉันไม่สูบ" / "พ่อแม่ห้าม"' },
  { step: '3️⃣', title: 'เสนอทางเลือก',    example: '"ไปเล่นบาสกัน!"' },
  { step: '4️⃣', title: 'ตื๊อ → เดินออก', example: 'ไม่ต้องเถียง ไม่ต้องอธิบาย' },
];

interface VideoEntry {
  id: string;
  title: string;
  desc: string;
}

const VIDEOS: VideoEntry[] = [
  {
    id: 'E57yixiwb7k',
    title: '"บุหรี่ไฟฟ้า รู้ไว้ ร้ายจัด"',
    desc: 'ผลกระทบ EVALI ในเยาวชน',
  },
  {
    id: 'mVJjCOdWRpQ',
    title: 'สสส. บุหรี่ไฟฟ้า — หนูทดลอง',
    desc: 'หนังสั้นจาก สสส.',
  },
];

const COLOR_MAP: Record<DangerCard['color'], { bg: string; border: string; text: string }> = {
  detective: { bg: 'from-detective-50 to-white', border: 'border-detective-200', text: 'text-detective-700' },
  candy:     { bg: 'from-candy-50 to-white',     border: 'border-candy-200',     text: 'text-candy-600'     },
  warning:   { bg: 'from-warning-50 to-white',   border: 'border-warning-200',   text: 'text-warning-600'   },
  mint:      { bg: 'from-mint-50 to-white',      border: 'border-mint-200',      text: 'text-mint-600'     },
  danger:    { bg: 'from-danger-50 to-white',    border: 'border-danger-100',    text: 'text-danger-500'   },
};

// ===== Video Card: คลิ๊กแล้วเปิด YouTube จริง — แก้ปัญหา iframe block ใน in-app browser =====
function VideoCard({ video }: { video: VideoEntry }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;
  // ใช้ youtube-nocookie.com — เล่นในเว็บส่วนใหญ่ได้ดี รวม LINE in-app browser
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`;

  return (
    <div className="card overflow-hidden p-0">
      <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => { sfx.click(); setPlaying(true); }}
            className="absolute inset-0 w-full h-full group"
            aria-label={`เล่นวิดีโอ ${video.title}`}
          >
            <img
              src={thumb}
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-glow
                              group-active:scale-90 transition-transform">
                <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-detective-600 ml-1.5" />
              </div>
            </div>
          </button>
        )}
      </div>
      <div className="p-3 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-detective-700 text-sm leading-snug">{video.title}</p>
          <p className="text-[11px] text-gray-500">{video.desc}</p>
        </div>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sfx.click()}
          className="flex-shrink-0 text-[11px] font-bold bg-candy-100 text-candy-600 px-2.5 py-1.5 rounded-xl hover:bg-candy-200 active:scale-95"
        >
          ▶ เปิด YouTube
        </a>
      </div>
    </div>
  );
}

type Tab = 'dangers' | 'videos' | 'tips' | 'help';

export default function Knowledge() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('dangers');

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'dangers', label: 'ภัยอันตราย', emoji: '⚠️' },
    { id: 'videos',  label: 'คลิป',       emoji: '🎬' },
    { id: 'tips',    label: 'วิธีปฏิเสธ', emoji: '✋' },
    { id: 'help',    label: 'ขอช่วย',    emoji: '📞' },
  ];

  return (
    <div className="min-h-full pb-10 relative">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md shadow-sm border-b border-detective-100/50
                         p-3 flex items-center gap-3">
        <button
          onClick={() => { sfx.click(); nav('/'); }}
          className="text-detective-500 px-3 py-1.5 rounded-xl hover:bg-detective-50 active:scale-95"
        >←</button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-detective-700 text-base">📖 ห้องสมุดความรู้</h2>
          <p className="text-[11px] text-gray-500">รู้ทันภัยจากบุหรี่ไฟฟ้า</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-3">
        {/* Hero — กระชับขึ้น */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hero mb-3 text-center py-3"
        >
          <div className="flex items-center gap-2 justify-center">
            <div className="text-4xl animate-float">🚭</div>
            <div className="text-left">
              <h1 className="font-display font-bold text-base text-detective-700 leading-tight">
                บุหรี่ไฟฟ้า รู้ไว้ ร้ายจัด
              </h1>
              <p className="text-[11px] text-gray-600">เลือกหัวข้อด้านล่างเพื่ออ่านต่อ</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs — 4 ช่อง สลับเนื้อหา ลด scroll */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { sfx.click(); setTab(t.id); }}
              className={`rounded-2xl py-2 px-1 text-center transition-all active:scale-95 ${
                tab === t.id
                  ? 'bg-gradient-to-br from-detective-500 to-candy-500 text-white shadow-glow-sm'
                  : 'bg-white/85 text-gray-600 border border-detective-100 hover:border-detective-300'
              }`}
            >
              <div className="text-lg leading-none">{t.emoji}</div>
              <p className="text-[10px] font-bold mt-1 leading-tight">{t.label}</p>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'dangers' && (
            <motion.div
              key="dangers"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              {DANGERS.map((d, i) => {
                const c = COLOR_MAP[d.color];
                return (
                  <div
                    key={i}
                    className={`rounded-2xl p-3 border-2 ${c.border} bg-gradient-to-br ${c.bg} shadow-glow-sm`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="text-3xl flex-shrink-0">{d.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-display font-bold ${c.text} text-sm leading-tight mb-0.5`}>
                          {d.title}
                        </h4>
                        <p className="text-xs text-gray-700 leading-relaxed">{d.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {tab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <p className="text-xs text-gray-600 text-center">
                💡 กดปุ่ม ▶ บนรูป — ถ้าเล่นไม่ได้ในแอป ให้กด "เปิด YouTube"
              </p>
              {VIDEOS.map(v => <VideoCard key={v.id} video={v} />)}
            </motion.div>
          )}

          {tab === 'tips' && (
            <motion.div
              key="tips"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="card-hero">
                <p className="text-xs text-gray-700 mb-2.5 text-center">
                  มีคนชวนสูบ vape? ทำตาม 4 ขั้น
                </p>
                <div className="space-y-2">
                  {REJECT_TIPS.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 bg-white/90 rounded-2xl p-2.5 border border-detective-100"
                    >
                      <div className="text-xl">{t.step}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-detective-700 text-sm leading-tight">{t.title}</p>
                        <p className="text-[11px] text-gray-600 italic mt-0.5">"{t.example}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'help' && (
            <motion.div
              key="help"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              <a
                href="tel:1600"
                className="flex items-center gap-3 rounded-2xl p-3 border-2 border-mint-200 bg-gradient-to-br from-mint-50 to-white shadow-glow-sm active:scale-95"
              >
                <div className="w-11 h-11 rounded-2xl bg-mint-100 flex items-center justify-center text-2xl">📱</div>
                <div className="flex-1">
                  <p className="font-bold text-mint-600 text-base">1600</p>
                  <p className="text-[11px] text-gray-600">สายเลิกบุหรี่ — โทรฟรี 24 ชั่วโมง</p>
                </div>
                <span className="text-mint-500">→</span>
              </a>
              <a
                href="tel:1422"
                className="flex items-center gap-3 rounded-2xl p-3 border-2 border-warning-200 bg-gradient-to-br from-warning-50 to-white shadow-glow-sm active:scale-95"
              >
                <div className="w-11 h-11 rounded-2xl bg-warning-100 flex items-center justify-center text-2xl">☎️</div>
                <div className="flex-1">
                  <p className="font-bold text-warning-600 text-base">1422</p>
                  <p className="text-[11px] text-gray-600">สายด่วน สสส. — แจ้งเบาะแสร้านขาย</p>
                </div>
                <span className="text-warning-500">→</span>
              </a>
              <div className="flex items-center gap-3 rounded-2xl p-3 border-2 border-candy-200 bg-gradient-to-br from-candy-50 to-white shadow-glow-sm">
                <div className="w-11 h-11 rounded-2xl bg-candy-100 flex items-center justify-center text-2xl">👨‍⚕️</div>
                <div className="flex-1">
                  <p className="font-bold text-candy-600 text-sm">บอกผู้ใหญ่ที่เชื่อใจ</p>
                  <p className="text-[11px] text-gray-600">พ่อแม่ ครู หมอ — ไม่ต้องอาย</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => { sfx.click(); nav('/'); }}
          className="btn-primary w-full text-base mt-5"
        >
          🎮 กลับไปเล่นเกม
        </button>

        <p className="text-[11px] text-center text-detective-400 font-semibold mt-4">
          🚭 SayNo:สู้บุหรี่ไฟฟ้า
        </p>
      </main>
    </div>
  );
}
