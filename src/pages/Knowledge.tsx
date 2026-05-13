import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sfx } from '../lib/sound';

// ===== เนื้อหาความรู้เรื่องบุหรี่ไฟฟ้า — สำหรับ ม.ต้น =====
// ไม่ผูกกับด่านเกม ใช้เป็นห้องสมุดความรู้แยก

interface DangerCard {
  emoji: string;
  title: string;
  body: string;
  color: 'detective' | 'candy' | 'warning' | 'mint' | 'danger';
}

const DANGERS: DangerCard[] = [
  {
    emoji: '🫁',
    title: 'ทำลายปอด — EVALI',
    body: 'บุหรี่ไฟฟ้าทำให้เกิด "โรคปอดอักเสบเฉียบพลันจากบุหรี่ไฟฟ้า (EVALI)" พบในเยาวชนคนรุ่นใหม่จำนวนมาก บางคนต้องเข้า ICU',
    color: 'danger',
  },
  {
    emoji: '🧠',
    title: 'ติดเร็วกว่าที่คิด',
    body: 'นิโคตินใน vape 1 ตัวเทียบเท่าบุหรี่ 20 มวน สมองวัยรุ่นยังพัฒนาไม่เต็มที่ ติดเร็วกว่าผู้ใหญ่ 4 เท่า',
    color: 'detective',
  },
  {
    emoji: '💔',
    title: 'หัวใจเต้นผิดจังหวะ',
    body: 'นิโคตินทำให้หัวใจเต้นเร็วผิดปกติ ความดันสูง เสี่ยงโรคหัวใจตั้งแต่อายุยังน้อย — กระทบการเล่นกีฬาและการเรียน',
    color: 'candy',
  },
  {
    emoji: '🎭',
    title: 'การตลาดหลอกล่อ',
    body: 'ออกแบบให้น่ารัก รสผลไม้-ลูกอม ดึงดูดเด็ก แต่ซ่อนสารพิษอันตราย เช่น โลหะหนัก สารก่อมะเร็ง',
    color: 'warning',
  },
  {
    emoji: '⚖️',
    title: 'ผิดกฎหมายในไทย',
    body: 'บุหรี่ไฟฟ้า "ผิดกฎหมาย" ตั้งแต่ปี พ.ศ. 2557 — ครอบครอง / ขาย / นำเข้า มีโทษปรับและจำคุก',
    color: 'mint',
  },
  {
    emoji: '🎓',
    title: 'กระทบสมาธิ-ความจำ',
    body: 'นิโคตินทำลายเซลล์สมองส่วนที่ใช้คิด-จดจำ ทำให้สมาธิสั้น เกรดตก หลายคนสอบตกหลังเริ่มสูบ',
    color: 'detective',
  },
];

interface RejectTip {
  step: string;
  title: string;
  example: string;
}

const REJECT_TIPS: RejectTip[] = [
  { step: '1️⃣', title: 'พูด "ไม่" ชัดเจน', example: '"ไม่ครับ" / "ไม่ค่ะ" — ไม่ต้องอธิบายยาว' },
  { step: '2️⃣', title: 'บอกเหตุผลสั้นๆ', example: '"ฉันไม่สูบ" / "พ่อแม่ห้าม"' },
  { step: '3️⃣', title: 'เสนอทางเลือก', example: '"ไปกินข้าวกันมั้ย?" / "ไปเล่นบาสกัน!"' },
  { step: '4️⃣', title: 'ถ้าตื๊อต่อ — เดินออก', example: 'ไม่ต้องเถียง ไม่ต้องอธิบาย เดินเลย' },
];

interface VideoEntry {
  id: string;            // YouTube video ID
  title: string;
  desc: string;
}

const VIDEOS: VideoEntry[] = [
  {
    id: 'E57yixiwb7k',
    title: '"บุหรี่ไฟฟ้า รู้ไว้ ร้ายจัด"',
    desc: 'ผลกระทบที่ซ่อนใต้รูปลักษณ์น่ารัก — โรค EVALI ในเยาวชน',
  },
  {
    id: 'mVJjCOdWRpQ',
    title: 'สสส. บุหรี่ไฟฟ้า — หนูทดลอง',
    desc: 'หนังสั้นจาก สสส. (Eng Subtitle)',
  },
];

const COLOR_MAP: Record<DangerCard['color'], { bg: string; border: string; text: string; chip: string }> = {
  detective: { bg: 'from-detective-50 to-white',   border: 'border-detective-200', text: 'text-detective-700', chip: 'bg-detective-100 text-detective-700' },
  candy:     { bg: 'from-candy-50 to-white',       border: 'border-candy-200',     text: 'text-candy-600',     chip: 'bg-candy-100 text-candy-600' },
  warning:   { bg: 'from-warning-50 to-white',     border: 'border-warning-200',   text: 'text-warning-600',   chip: 'bg-warning-100 text-warning-600' },
  mint:      { bg: 'from-mint-50 to-white',        border: 'border-mint-200',      text: 'text-mint-600',      chip: 'bg-mint-100 text-mint-600' },
  danger:    { bg: 'from-danger-50 to-white',      border: 'border-danger-100',    text: 'text-danger-500',    chip: 'bg-danger-100 text-danger-500' },
};

export default function Knowledge() {
  const nav = useNavigate();

  return (
    <div className="min-h-full pb-10 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-candy-200/40 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-warning-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-20 w-72 h-72 bg-mint-200/40 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-md shadow-sm border-b border-detective-100/50
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

      <main className="max-w-md mx-auto px-4 pt-4">
        {/* ===== Intro Hero ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hero mb-5 text-center"
        >
          <div className="text-5xl mb-2 animate-float inline-block">🚭</div>
          <h1 className="font-display font-bold text-2xl text-detective-700 mb-2">
            "บุหรี่ไฟฟ้า รู้ไว้ ร้ายจัด"
          </h1>
          <p className="text-sm text-gray-700 leading-relaxed">
            ผลกระทบจากบุหรี่ไฟฟ้าที่ <b>ซ่อนภายใต้รูปลักษณ์น่ารัก</b> และการตลาดที่เย้ายวน
            ไม่คำนึงถึงสุขภาพของผู้ตกเป็นเหยื่อ ปัจจุบันพบ <b>เยาวชน คนรุ่นใหม่</b>
            เข้ารับการรักษาจาก <b className="text-danger-500">"โรคปอดอักเสบเฉียบพลันจากบุหรี่ไฟฟ้า (EVALI)"</b>
            เป็นจำนวนมาก
          </p>
        </motion.div>

        {/* ===== Videos — embed YouTube ===== */}
        <div className="mb-6">
          <h3 className="font-display font-bold text-detective-700 mb-2 flex items-center gap-2">
            <span className="text-2xl">🎬</span> วิดีโอแนะนำ
          </h3>
          <div className="space-y-3">
            {VIDEOS.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="card overflow-hidden p-0"
              >
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${v.id}`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-detective-700 text-sm">{v.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{v.desc}</p>
                  <a
                    href={`https://www.youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-candy-500 font-semibold mt-1 inline-block hover:underline"
                  >
                    🔗 เปิดใน YouTube →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ===== Dangers ===== */}
        <div className="mb-6">
          <h3 className="font-display font-bold text-detective-700 mb-2 flex items-center gap-2">
            <span className="text-2xl">⚠️</span> ภัยอันตราย 6 ข้อต้องรู้
          </h3>
          <div className="space-y-2">
            {DANGERS.map((d, i) => {
              const c = COLOR_MAP[d.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className={`rounded-3xl p-4 border-2 ${c.border} bg-gradient-to-br ${c.bg} shadow-glow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{d.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-display font-bold ${c.text} text-base leading-tight mb-1`}>
                        {d.title}
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{d.body}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ===== สูตรปฏิเสธ ===== */}
        <div className="mb-6">
          <h3 className="font-display font-bold text-detective-700 mb-2 flex items-center gap-2">
            <span className="text-2xl">✋</span> สูตรปฏิเสธง่ายๆ
          </h3>
          <div className="card-hero">
            <p className="text-sm text-gray-700 mb-3">
              ถ้ามีคนชวนสูบ vape ลองทำตาม 4 ขั้นนี้:
            </p>
            <div className="space-y-2">
              {REJECT_TIPS.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-start gap-3 bg-white/80 rounded-2xl p-3 border border-detective-100"
                >
                  <div className="text-2xl">{t.step}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-detective-700 text-sm">{t.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 italic">"{t.example}"</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Help line ===== */}
        <div className="mb-6">
          <h3 className="font-display font-bold text-detective-700 mb-2 flex items-center gap-2">
            <span className="text-2xl">📞</span> ขอความช่วยเหลือ
          </h3>
          <div className="rounded-3xl p-4 border-2 border-mint-200 bg-gradient-to-br from-mint-50 to-white shadow-glow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-mint-100 flex items-center justify-center text-2xl">
                  📱
                </div>
                <div className="flex-1">
                  <p className="font-bold text-mint-600 text-base">1600</p>
                  <p className="text-xs text-gray-600">สายเลิกบุหรี่ — โทรฟรี 24 ชั่วโมง</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-warning-100 flex items-center justify-center text-2xl">
                  ☎️
                </div>
                <div className="flex-1">
                  <p className="font-bold text-warning-600 text-base">1422</p>
                  <p className="text-xs text-gray-600">สายด่วน สสส. — แจ้งเบาะแสร้านขาย vape</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-candy-100 flex items-center justify-center text-2xl">
                  👨‍⚕️
                </div>
                <div className="flex-1">
                  <p className="font-bold text-candy-600 text-base">บอกผู้ใหญ่ที่เชื่อใจ</p>
                  <p className="text-xs text-gray-600">พ่อแม่ ครู หมอ — ไม่ต้องอายที่จะขอความช่วยเหลือ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Play CTA ===== */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => { sfx.click(); nav('/'); }}
          className="btn-primary w-full text-base"
        >
          🎮 กลับไปเล่นเกม
        </motion.button>

        <p className="text-[11px] text-center text-detective-400 font-semibold mt-6">
          🎓 Walailak University — SayNo:สู้บุหรี่ไฟฟ้า
        </p>
      </main>
    </div>
  );
}
