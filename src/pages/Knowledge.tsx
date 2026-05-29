import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sfx } from '../lib/sound';
import { GLOSSARY, CATEGORY_INFO, type GlossaryCategory } from '../lib/glossary';
import PageHeader from '../components/PageHeader';

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
    body: 'บุหรี่ไฟฟ้า 1 พอต = บุหรี่ 1 ซอง วัยรุ่นติดง่ายกว่าผู้ใหญ่ 4 เท่า เพราะสมองกำลังโต ยิ่งสูบไว สมองยิ่งพังง่าย',
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
  {
    id: 'uyRnV6BLZNA',
    title: 'HEALTH A RIETY EP.2 : เรื่องจริง! ที่บุหรี่ไฟฟ้าซ่อนไว้',
    channel: 'สสส. (สำนักงานกองทุนสนับสนุนการสร้างเสริมสุขภาพ)',
    desc: 'เปิดเบื้องหลังบุหรี่ไฟฟ้า — สารพิษ การตลาด และผลกระทบที่ผู้ผลิตไม่อยากให้รู้',
  },
  {
    id: 'c0Yh0qMjw0Y',
    title: 'คลิปรณรงค์ให้ความรู้เรื่องบุหรี่ไฟฟ้า',
    channel: 'ASHThailand (มูลนิธิรณรงค์เพื่อการไม่สูบบุหรี่)',
    desc: 'รณรงค์สำหรับเยาวชน — บุหรี่ไฟฟ้าไม่ใช่ทางออกของวัยรุ่น',
  },
  {
    id: 'YiT1359eC10',
    title: 'บุหรี่ไฟฟ้าดีกว่าบุหรี่ธรรมดา จริงเหรอ?',
    channel: 'Zerosick (Doctor\'s Talk EP.19)',
    desc: 'สารเคมีที่แฝงอยู่ในบุหรี่ไฟฟ้า — ทำไมทำให้ปอดอักเสบและเสียชีวิตได้',
  },
  {
    id: 'FTgHpE_uJH4',
    title: 'บุหรี่ไฟฟ้าไม่มีควัน = ไม่อันตรายจริงเหรอ?',
    channel: 'เรื่องไม่รู้รอบตัว',
    desc: 'อธิบายสั้น เข้าใจง่าย — เปรียบเทียบ "ไอ" กับ "ควัน" และผลกระทบจริง',
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

// accent = สีเส้นซ้าย + ไอคอน (ไม่ทาทั้งใบ) ตามระบบ refined
const COLOR_MAP: Record<DangerCard['color'], { accent: string; tile: string; text: string }> = {
  detective: { accent: 'border-l-detective-400', tile: 'bg-detective-50', text: 'text-detective-700' },
  warning:   { accent: 'border-l-warning-400',   tile: 'bg-warning-50',   text: 'text-warning-600'   },
  mint:      { accent: 'border-l-mint-400',      tile: 'bg-mint-50',      text: 'text-mint-600'     },
  danger:    { accent: 'border-l-danger-400',    tile: 'bg-danger-50',    text: 'text-danger-500'   },
};

const HOTLINE_COLOR: Record<HotlineEntry['color'], { accent: string; chip: string; text: string }> = {
  mint:      { accent: 'border-l-mint-400',      chip: 'bg-mint-100',      text: 'text-mint-600' },
  warning:   { accent: 'border-l-warning-400',   chip: 'bg-warning-100',   text: 'text-warning-600' },
  detective: { accent: 'border-l-detective-400', chip: 'bg-detective-100', text: 'text-detective-700' },
};

// ===== Video Card — compact: thumbnail + title, กดเล่น → เปิด modal =====
function VideoCard({ video, onPlay }: { video: VideoEntry; onPlay: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const thumb = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <div className="card overflow-hidden p-0 flex flex-col">
      <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
        <button
          onClick={() => { sfx.click(); onPlay(); }}
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
            <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-glow
                            group-active:scale-90 transition-transform">
              <div className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[12px] border-l-detective-600 ml-1" />
            </div>
          </div>
        </button>
      </div>
      <div className="p-2.5 flex-1 flex flex-col">
        <p className="font-semibold text-detective-700 text-xs leading-snug line-clamp-2">
          {video.title}
        </p>
        <p className="text-[10px] text-slate-500 mt-1 truncate">📺 {video.channel}</p>

        {expanded && (
          <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{video.desc}</p>
        )}

        <div className="mt-auto pt-2 flex items-center gap-1.5">
          <button
            onClick={() => { sfx.click(); setExpanded(v => !v); }}
            className="flex-1 text-[10px] font-semibold text-slate-500 hover:text-detective-600
                       border border-slate-200 hover:border-detective-300 rounded-lg px-2 py-1
                       active:scale-95 transition-all"
          >
            {expanded ? 'ย่อ ▴' : 'รายละเอียด ▾'}
          </button>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sfx.click()}
            className="flex-1 text-center text-[10px] font-bold bg-detective-100 text-detective-700
                       px-2 py-1 rounded-lg hover:bg-detective-200 active:scale-95 transition-all"
          >
            ▶ YouTube
          </a>
        </div>
      </div>
    </div>
  );
}

// ===== Video Modal — fullscreen player overlay =====
function VideoModal({ video, onClose }: { video: VideoEntry; onClose: () => void }) {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`;

  // ปิด modal เมื่อกด Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col
                 p-3 sm:p-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`เล่นวิดีโอ ${video.title}`}
    >
      {/* Header bar: title + close */}
      <div className="flex items-start gap-2 mb-3 max-w-4xl mx-auto w-full">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-white text-sm sm:text-base leading-tight">
            {video.title}
          </p>
          <p className="text-[11px] sm:text-xs text-white/70 mt-0.5 truncate">📺 {video.channel}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); sfx.click(); onClose(); }}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25
                     text-white font-bold flex items-center justify-center
                     active:scale-90 transition-all"
          aria-label="ปิด"
        >
          ✕
        </button>
      </div>

      {/* Video frame — fixed 16:9, click ภายในไม่ปิด modal */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.22, type: 'spring', stiffness: 220, damping: 22 }}
        className="flex-1 flex items-center justify-center min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
             style={{ aspectRatio: '16 / 9' }}>
          <iframe
            className="w-full h-full"
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </motion.div>

      <p className="text-center text-[11px] text-white/60 mt-3">
        แตะนอกวิดีโอเพื่อปิด · หรือกด ✕
      </p>
    </motion.div>
  );
}

type Tab = 'dangers' | 'videos' | 'tips' | 'glossary' | 'help';

// ===== Category filter chip =====
function CategoryChip({
  active, onClick, label, emoji, count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  emoji: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                  transition-all active:scale-95 ${
        active
          ? 'bg-detective-600 text-white shadow-glow-sm'
          : 'bg-white border border-detective-100 text-slate-600 hover:border-detective-300 hover:text-detective-600'
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
        active ? 'bg-white/20' : 'bg-detective-50 text-detective-600'
      }`}>
        {count}
      </span>
    </button>
  );
}

export default function Knowledge() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('dangers');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [glossaryCat, setGlossaryCat] = useState<GlossaryCategory | 'all'>('all');
  const [playingVideo, setPlayingVideo] = useState<VideoEntry | null>(null);

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'dangers',  label: 'ภัยอันตราย', emoji: '⚠️' },
    { id: 'videos',   label: 'คลิป',       emoji: '🎬' },
    { id: 'tips',     label: 'วิธีปฏิเสธ', emoji: '✋' },
    { id: 'glossary', label: 'ศัพท์',      emoji: '📖' },
    { id: 'help',     label: 'ขอช่วย',    emoji: '📞' },
  ];

  const filteredGlossary = useMemo(() => {
    const q = glossarySearch.trim().toLowerCase();
    return GLOSSARY.filter(g => {
      if (glossaryCat !== 'all' && g.category !== glossaryCat) return false;
      if (!q) return true;
      return g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q);
    });
  }, [glossarySearch, glossaryCat]);

  return (
    <div className="min-h-full pb-10 relative">
      <PageHeader title="📖 ห้องสมุดความรู้" subtitle="รู้ทันภัยจากบุหรี่ไฟฟ้า" backTo="/" />

      <main className="max-w-md md:max-w-2xl mx-auto px-4 pt-3">
        {/* Hero — compact */}
        <div className="card-hero mb-3 flex items-center gap-3 py-3 px-4">
          <div className="text-3xl flex-shrink-0">🚭</div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-sm text-detective-700 leading-tight">
              บุหรี่ไฟฟ้า รู้ไว้ ร้ายจัด
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 leading-snug">
              เลือกหัวข้อด้านล่างเพื่ออ่านต่อ
            </p>
          </div>
        </div>

        {/* Tabs — pill grid: active สีฟ้าเด่น, inactive ขาวขอบจาง */}
        <div className="sticky top-0 z-10 -mx-4 px-4 py-2 mb-2 bg-white/95 backdrop-blur-sm">
          <div className="grid grid-cols-5 gap-1.5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { sfx.click(); setTab(t.id); }}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-2xl
                            transition-all active:scale-95 ${
                  tab === t.id
                    ? 'bg-gradient-to-br from-detective-500 to-detective-700 text-white shadow-glow-sm'
                    : 'bg-white border border-detective-100 text-slate-500 hover:border-detective-300 hover:text-detective-600'
                }`}
              >
                <span className="text-lg leading-none">{t.emoji}</span>
                <span className={`text-[10px] font-bold leading-tight ${
                  tab === t.id ? 'text-white' : ''
                }`}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'dangers' && (
            <motion.div
              key="dangers"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0"
            >
              {DANGERS.map((d, i) => {
                const c = COLOR_MAP[d.color];
                return (
                  <div
                    key={i}
                    className={`card border-l-4 ${c.accent} space-y-2`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`icon-tile ${c.tile} text-2xl`}>{d.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-display font-bold ${c.text} text-sm leading-tight mb-1`}>
                          {d.title}
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{d.body}</p>
                      </div>
                    </div>
                    {/* source — แยกใต้ใน chip เล็ก */}
                    <div className="ml-12 text-[10px] text-slate-500 leading-snug
                                    bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                      📚 {d.source}
                    </div>
                  </div>
                );
              })}
              <div className="card text-center text-xs text-slate-500 leading-relaxed md:col-span-2">
                <p className="font-semibold text-detective-700 mb-1">📚 แหล่งข้อมูล</p>
                WHO · CDC · U.S. Surgeon General · NIDA · American Heart Association
                · กระทรวงสาธารณสุขของไทย
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
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs text-slate-500">
                  พบ <b className="text-detective-700">{VIDEOS.length}</b> คลิป
                </p>
                <p className="text-[10px] text-slate-400">💡 กด ▶ บนรูปเพื่อเล่น</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {VIDEOS.map(v => (
                  <VideoCard key={v.id} video={v} onPlay={() => setPlayingVideo(v)} />
                ))}
              </div>
              <div className="card text-center text-[10px] text-slate-500 leading-relaxed mt-3 md:col-span-3">
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
                <p className="text-sm text-slate-700 mb-3 text-center font-semibold">
                  ✋ มีคนชวนสูบบุหรี่ไฟฟ้า? ทำตาม 4 ขั้น
                </p>
                <div className="space-y-2">
                  {REJECT_TIPS.map((t, i) => (
                    <div
                      key={i}
                      className="relative flex items-start gap-3 bg-white rounded-2xl p-3
                                 border border-detective-100 shadow-sm"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-detective-500 to-detective-700
                                      text-white font-display font-extrabold flex items-center justify-center
                                      flex-shrink-0 text-base shadow-glow-sm">
                        {t.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-detective-700 text-sm leading-tight">{t.title}</p>
                        <p className="text-xs text-slate-600 italic mt-1 leading-snug">"{t.example}"</p>
                      </div>
                      {i < REJECT_TIPS.length - 1 && (
                        <span className="absolute -bottom-1.5 left-7 text-detective-300 text-xs" aria-hidden>
                          ↓
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic mt-4 text-center
                              bg-white/60 rounded-lg px-2 py-1.5 border border-slate-100">
                  📚 ปรับจาก: WHO Tobacco Cessation Guidelines + American Lung Association
                </p>
              </div>
            </motion.div>
          )}

          {tab === 'glossary' && (
            <motion.div
              key="glossary"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
            >
              {/* search */}
              <div className="relative mb-2">
                <input
                  value={glossarySearch}
                  onChange={e => setGlossarySearch(e.target.value)}
                  placeholder="🔍 ค้นหาคำศัพท์ เช่น EVALI, นิโคติน"
                  className="w-full p-3 rounded-2xl border-2 border-detective-100 bg-white/90
                             focus:border-detective-500 focus:shadow-glow-sm outline-none transition-all text-sm"
                />
                {glossarySearch && (
                  <button
                    onClick={() => setGlossarySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 active:scale-90"
                    aria-label="ล้างคำค้น"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category filter chips */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
                <CategoryChip
                  active={glossaryCat === 'all'}
                  onClick={() => setGlossaryCat('all')}
                  label="ทั้งหมด"
                  emoji="📚"
                  count={GLOSSARY.length}
                />
                {(Object.keys(CATEGORY_INFO) as GlossaryCategory[]).map(cat => {
                  const info = CATEGORY_INFO[cat];
                  const count = GLOSSARY.filter(g => g.category === cat).length;
                  return (
                    <CategoryChip
                      key={cat}
                      active={glossaryCat === cat}
                      onClick={() => setGlossaryCat(cat)}
                      label={info.label}
                      emoji={info.emoji}
                      count={count}
                    />
                  );
                })}
              </div>

              {filteredGlossary.length === 0 ? (
                <div className="card text-center py-10">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm text-slate-600 font-semibold">ไม่พบคำที่ค้นหา</p>
                  <p className="text-xs text-slate-500 mt-1">ลองค้นด้วยคำอื่น หรือเลือกหมวดอื่น</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mb-2 px-1">
                    พบ <b className="text-detective-700">{filteredGlossary.length}</b> คำ ·
                    <span className="text-slate-400"> กดที่คำเพื่อดูรายละเอียด</span>
                  </p>
                  <div className="space-y-1.5">
                    {filteredGlossary.map(g => {
                      const cat = CATEGORY_INFO[g.category];
                      return (
                        <details
                          key={g.term}
                          className="group card p-0 overflow-hidden hover:border-detective-300 transition-colors"
                        >
                          <summary
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer
                                       list-none active:scale-[0.99] transition-transform select-none"
                          >
                            <span className="text-xl flex-shrink-0 leading-none">{g.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-display font-bold text-detective-700 text-sm leading-tight truncate">
                                {g.term}
                              </h4>
                              <span className="text-[10px] text-slate-400 leading-snug">
                                {cat.emoji} {cat.label}
                              </span>
                            </div>
                            <span className="text-detective-400 text-sm flex-shrink-0
                                             group-open:rotate-180 transition-transform"
                                  aria-hidden>
                              ▾
                            </span>
                          </summary>
                          <div className="px-3 pb-3 pt-1 border-t border-detective-100/50
                                          animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="text-sm text-slate-700 leading-relaxed mb-2">{g.def}</p>
                            <div className="text-[10px] text-slate-500 leading-snug
                                            bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                              📚 {g.source}
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </>
              )}
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
                    className={`card block border-l-4 ${c.accent} active:scale-[0.98] transition-transform`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-16 h-16 rounded-2xl ${c.chip} flex flex-col items-center justify-center flex-shrink-0 shadow-sm`}>
                        <span className="text-[9px] font-bold text-slate-500 leading-none mb-0.5">โทร</span>
                        <span className={`font-display font-extrabold ${c.text} text-xl leading-none`}>
                          {h.number}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold ${c.text} text-sm leading-tight`}>{h.name}</p>
                        <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{h.agency}</p>
                        <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                          <b className="text-slate-800">ช่วยอะไร:</b> {h.help}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                          <span>⏰</span> {h.desc}
                        </p>
                      </div>
                      <span className="text-detective-400 text-lg flex-shrink-0 self-center" aria-hidden>→</span>
                    </div>
                  </a>
                );
              })}

              <div className="card border border-mint-200 bg-mint-50">
                <div className="flex items-start gap-3">
                  <div className="icon-tile bg-white text-mint-600">👨‍⚕️</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-mint-600 text-sm">บอกผู้ใหญ่ที่เชื่อใจ</p>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
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
      </main>

      {/* ===== Video player modal — full-width overlay ===== */}
      <AnimatePresence>
        {playingVideo && (
          <VideoModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
