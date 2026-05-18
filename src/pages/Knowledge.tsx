import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '../lib/sound';
import BrandHeader from '../components/BrandHeader';

// ===== เนื้อหาความรู้เรื่องบุหรี่ไฟฟ้า — สำหรับ ม.ต้น =====

interface DangerCard {
  emoji: string;
  title: string;
  body: string;
  source: string;
  color: 'detective' | 'warning' | 'mint' | 'danger';
}

const DANGERS: DangerCard[] = [
  {
    emoji: '🫁',
    title: 'ทำลายปอด (EVALI)',
    body: '"โรคปอดอักเสบเฉียบพลันจากบุหรี่ไฟฟ้า (EVALI)" พบในเยาวชนเยอะ บางคนต้องเข้า ICU เพราะปอดเสียหายรุนแรง',
    source: 'CDC: E-cigarette, or Vaping, Product Use-Associated Lung Injury (2023)',
    color: 'danger',
  },
  {
    emoji: '🧠',
    title: 'ติดเร็วกว่าที่คิด',
    body: 'นิโคติน vape 1 ตัว ≈ บุหรี่ 20 มวน สมองวัยรุ่นยังพัฒนาไม่เต็มที่ ติดเร็วกว่าผู้ใหญ่ 4 เท่า',
    source: 'U.S. Surgeon General Report: E-Cigarette Use Among Youth (2016, updated 2023)',
    color: 'detective',
  },
  {
    emoji: '💔',
    title: 'หัวใจเต้นผิดจังหวะ',
    body: 'นิโคตินทำให้หัวใจเต้นเร็ว ความดันสูง เสี่ยงโรคหัวใจตั้งแต่อายุน้อย กระทบกีฬาและการเรียน',
    source: 'American Heart Association — Vaping & Cardiovascular Health',
    color: 'warning',
  },
  {
    emoji: '🎭',
    title: 'การตลาดหลอกล่อ',
    body: 'ออกแบบให้น่ารัก รสผลไม้-ลูกอม ดึงดูดเด็ก แต่ซ่อนสารพิษ โลหะหนัก สารก่อมะเร็ง',
    source: 'WHO Report on Tobacco Epidemic 2023 — Marketing to Youth',
    color: 'detective',
  },
  {
    emoji: '⚖️',
    title: 'ผิดกฎหมายในไทย',
    body: 'ห้ามนำเข้า/ครอบครอง/ขาย ตั้งแต่ปี พ.ศ. 2557 มีโทษปรับและจำคุก',
    source: 'ประกาศกระทรวงพาณิชย์ พ.ศ. 2557 + พ.ร.บ.ศุลกากร พ.ศ. 2560',
    color: 'mint',
  },
  {
    emoji: '🎓',
    title: 'กระทบสมาธิ-ความจำ',
    body: 'นิโคตินทำลายสมองส่วนคิด-จดจำ สมาธิสั้น เกรดตก สอบตกได้',
    source: 'National Institute on Drug Abuse (NIDA) — Vaping & Brain Development',
    color: 'detective',
  },
];

const REJECT_TIPS = [
  { step: '1', title: 'พูด "ไม่" ชัด',  example: '"ไม่ครับ" / "ไม่ค่ะ"' },
  { step: '2', title: 'บอกเหตุผลสั้น',  example: '"ฉันไม่สูบ" / "พ่อแม่ห้าม"' },
  { step: '3', title: 'เสนอทางเลือก',    example: '"ไปเล่นบาสกัน!"' },
  { step: '4', title: 'ตื๊อ → เดินออก', example: 'ไม่ต้องเถียง ไม่ต้องอธิบาย' },
];

interface VideoEntry {
  id: string;
  title: string;
  channel: string;
  desc: string;
}

const VIDEOS: VideoEntry[] = [
  {
    id: 'E57yixiwb7k',
    title: 'บุหรี่ไฟฟ้า รู้ไว้ ร้ายจัด',
    channel: 'กรมการแพทย์ กระทรวงสาธารณสุข',
    desc: 'ภัยจาก EVALI ที่ซ่อนใต้การออกแบบและการตลาด — ตัวเลขผู้ป่วยเยาวชนในไทย',
  },
  {
    id: 'mVJjCOdWRpQ',
    title: 'บุหรี่ไฟฟ้า — หนูทดลอง',
    channel: 'สำนักงานกองทุนสนับสนุนการสร้างเสริมสุขภาพ (สสส.)',
    desc: 'หนังสั้นแคมเปญ "Director\'s Cut" พร้อม English Subtitle',
  },
];

// ===== สายด่วน — เบอร์ที่ใช้ได้จริงในประเทศไทย =====
interface HotlineEntry {
  number: string;
  name: string;
  agency: string;
  desc: string;
  help: string;
  href: string;
  color: 'mint' | 'warning' | 'detective';
}

const HOTLINES: HotlineEntry[] = [
  {
    number: '1600',
    name: 'สายเลิกบุหรี่แห่งชาติ (Quit Line)',
    agency: 'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ',
    desc: 'โทรฟรี ตลอด 24 ชั่วโมง',
    help: 'ปรึกษาเลิกบุหรี่/บุหรี่ไฟฟ้ากับนักจิตวิทยา + ติดตามผลฟรี เก็บข้อมูลเป็นความลับ',
    href: 'tel:1600',
    color: 'mint',
  },
  {
    number: '1422',
    name: 'สายด่วนกรมควบคุมโรค',
    agency: 'กรมควบคุมโรค กระทรวงสาธารณสุข',
    desc: 'โทรฟรี ในเวลาราชการ',
    help: 'สอบถามข้อมูลสุขภาพ พิษภัยจากบุหรี่ไฟฟ้า และโรคจากการสูบ',
    href: 'tel:1422',
    color: 'warning',
  },
  {
    number: '1166',
    name: 'สายด่วน สคบ.',
    agency: 'สำนักงานคณะกรรมการคุ้มครองผู้บริโภค',
    desc: 'โทรฟรี ในเวลาราชการ',
    help: 'แจ้งเบาะแสร้านขายบุหรี่ไฟฟ้า (สินค้าผิดกฎหมายในไทย)',
    href: 'tel:1166',
    color: 'detective',
  },
];

const COLOR_MAP: Record<DangerCard['color'], { bg: string; border: string; text: string }> = {
  detective: { bg: 'from-detective-50 to-white', border: 'border-detective-200', text: 'text-detective-700' },
  warning:   { bg: 'from-warning-50 to-white',   border: 'border-warning-200',   text: 'text-warning-600'   },
  mint:      { bg: 'from-mint-50 to-white',      border: 'border-mint-200',      text: 'text-mint-600'     },
  danger:    { bg: 'from-danger-50 to-white',    border: 'border-danger-100',    text: 'text-danger-500'   },
};

const HOTLINE_COLOR: Record<HotlineEntry['color'], { border: string; bg: string; chip: string; text: string }> = {
  mint:      { border: 'border-mint-200',      bg: 'from-mint-50 to-white',      chip: 'bg-mint-100',      text: 'text-mint-600' },
  warning:   { border: 'border-warning-200',   bg: 'from-warning-50 to-white',   chip: 'bg-warning-100',   text: 'text-warning-600' },
  detective: { border: 'border-detective-200', bg: 'from-detective-50 to-white', chip: 'bg-detective-100', text: 'text-detective-700' },
};

// ===== Video Card: คลิ๊กแล้วเปิด YouTube จริง =====
function VideoCard({ video }: { video: VideoEntry }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;
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
      <div className="p-3">
        <p className="font-semibold text-detective-700 text-sm leading-snug">{video.title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">📺 {video.channel}</p>
        <p className="text-[11px] text-slate-600 mt-1">{video.desc}</p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sfx.click()}
          className="mt-2 inline-block text-[11px] font-bold bg-detective-100 text-detective-700 px-2.5 py-1.5 rounded-xl hover:bg-detective-200 active:scale-95"
        >
          ▶ เปิดใน YouTube
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
      <BrandHeader />

      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200
                      p-3 flex items-center gap-3">
        <button
          onClick={() => { sfx.click(); nav('/'); }}
          className="text-detective-500 px-3 py-1.5 rounded-xl hover:bg-detective-50 active:scale-95"
        >←</button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-detective-700 text-base">📖 ห้องสมุดความรู้</h2>
          <p className="text-[11px] text-slate-500">รู้ทันภัยจากบุหรี่ไฟฟ้า</p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-3">
        {/* Hero */}
        <div className="card-hero mb-3 text-center py-3">
          <div className="flex items-center gap-2 justify-center">
            <div className="text-4xl">🚭</div>
            <div className="text-left">
              <h1 className="font-display font-bold text-base text-detective-700 leading-tight">
                บุหรี่ไฟฟ้า รู้ไว้ ร้ายจัด
              </h1>
              <p className="text-[11px] text-slate-600">เลือกหัวข้อด้านล่างเพื่ออ่านต่อ</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { sfx.click(); setTab(t.id); }}
              className={`rounded-2xl py-2 px-1 text-center transition-all active:scale-95 ${
                tab === t.id
                  ? 'bg-detective-600 text-white shadow-glow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-detective-300'
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
                        <p className="text-xs text-slate-700 leading-relaxed">{d.body}</p>
                        <p className="text-[10px] text-slate-500 italic mt-1.5 leading-snug">
                          📚 ที่มา: {d.source}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="card text-center text-[10px] text-slate-500 leading-relaxed">
                ข้อมูลรวบรวมจาก WHO, CDC, U.S. Surgeon General, NIDA, American Heart Association
                และเอกสารกระทรวงสาธารณสุขของไทย
              </div>
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
              <p className="text-xs text-slate-600 text-center">
                💡 กดปุ่ม ▶ บนรูป — ถ้าเล่นไม่ได้ในแอป ให้กด "เปิดใน YouTube"
              </p>
              {VIDEOS.map(v => <VideoCard key={v.id} video={v} />)}
              <div className="card text-center text-[10px] text-slate-500 leading-relaxed">
                เครดิตวิดีโอ: เป็นลิขสิทธิ์ของเจ้าของช่องตามที่ระบุ — ใช้เพื่อการศึกษา ไม่หากำไร
              </div>
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
                <p className="text-xs text-slate-700 mb-2.5 text-center">
                  มีคนชวนสูบ vape? ทำตาม 4 ขั้น
                </p>
                <div className="space-y-2">
                  {REJECT_TIPS.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 bg-white rounded-2xl p-2.5 border border-slate-200"
                    >
                      <div className="w-7 h-7 rounded-full bg-detective-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        {t.step}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-detective-700 text-sm leading-tight">{t.title}</p>
                        <p className="text-[11px] text-slate-600 italic mt-0.5">"{t.example}"</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic mt-3 text-center">
                  📚 ปรับจาก: WHO Tobacco Cessation Guidelines + American Lung Association
                </p>
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
              {HOTLINES.map(h => {
                const c = HOTLINE_COLOR[h.color];
                return (
                  <a
                    key={h.number}
                    href={h.href}
                    className={`block rounded-2xl p-3 border-2 ${c.border} bg-gradient-to-br ${c.bg} shadow-glow-sm active:scale-[0.98] transition-transform`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-14 h-14 rounded-2xl ${c.chip} flex items-center justify-center flex-shrink-0`}>
                        <span className={`font-display font-extrabold ${c.text} text-lg leading-none`}>
                          {h.number}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold ${c.text} text-sm leading-tight`}>{h.name}</p>
                        <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{h.agency}</p>
                        <p className="text-[11px] text-slate-700 mt-1.5 leading-relaxed">
                          <b>ช่วยอะไรได้:</b> {h.help}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">⏰ {h.desc}</p>
                      </div>
                    </div>
                  </a>
                );
              })}

              <div className="card border border-candy-200 bg-candy-50">
                <div className="flex items-start gap-2.5">
                  <div className="text-2xl">👨‍⚕️</div>
                  <div className="flex-1">
                    <p className="font-bold text-candy-600 text-sm">บอกผู้ใหญ่ที่เชื่อใจ</p>
                    <p className="text-[11px] text-slate-700 mt-1">
                      พ่อแม่ ครู หมอ พยาบาลที่ ร.ร. — ไม่ต้องอายที่จะขอความช่วยเหลือ
                      บุคคลเหล่านี้พร้อมรับฟังและช่วยน้องโดยไม่ตัดสิน
                    </p>
                  </div>
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

        <p className="text-[11px] text-center text-slate-400 font-semibold mt-4">
          🚭 SayNo:สู้บุหรี่ไฟฟ้า
        </p>
      </main>
    </div>
  );
}
