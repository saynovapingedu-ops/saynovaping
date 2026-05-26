import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import AvatarFolder from '../components/AvatarFolder';
import BrandHeader from '../components/BrandHeader';

function PDPAAccordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/90 rounded-2xl border border-detective-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-left p-3 flex items-center gap-2 active:bg-detective-50"
      >
        <span className="text-detective-400 text-sm transition-transform"
              style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>▸</span>
        <span className="font-semibold text-sm text-detective-700 flex-1">{title}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 text-xs text-gray-700 leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(1);
  const [customAvatarId, setCustomAvatarId] = useState<string | undefined>(undefined);
  const [consent, setConsent] = useState(false);
  const navigate = useNavigate();
  const initProfile = usePlayerStore(s => s.initProfile);
  const setInitialized = usePlayerStore(s => s.setInitialized);

  const handlePickAvatar = (preset: number, customId?: string) => {
    if (customId) {
      setCustomAvatarId(customId);
    } else {
      setAvatar(preset);
      setCustomAvatarId(undefined);
    }
  };

  const handleFinish = () => {
    initProfile({
      nickname: nickname.trim() || 'นักสืบ',
      grade: '',
      school: '',
      avatar,
      customAvatarId,
      consentAt: new Date().toISOString(),
    });
    setInitialized(true);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md md:max-w-lg mx-auto relative">
      <BrandHeader />

      <div className="flex flex-col flex-1 p-6">
      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === step
                ? 'w-12 bg-gradient-to-r from-detective-500 to-detective-600 shadow-glow-sm'
                : i < step
                ? 'w-6 bg-detective-300'
                : 'w-6 bg-detective-100'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col items-center text-center justify-center">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="text-8xl mb-4 drop-shadow-lg"
            >
              🔍
            </motion.div>
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-detective-600
                           to-warning-500 bg-clip-text text-transparent mb-2
                           leading-[1.4] pt-1 pb-2 overflow-visible">
              นักสืบสุขภาพ
            </h1>
            <p className="text-gray-600 mb-1 font-medium">🚭 ภารกิจรู้ทันบุหรี่ไฟฟ้า</p>
            <div className="card-hero mt-6 mx-2">
              <p className="text-sm text-gray-700 leading-relaxed">
                เกมสนุก ฝึกทักษะปฏิเสธ <b>บุหรี่ไฟฟ้า</b><br/>
                สำหรับเยาวชน ม.ต้น<br/>
                เล่นจบรับเกียรติบัตรน่ารักๆ 🏆
              </p>
              <p className="text-[11px] text-detective-500 font-semibold mt-3">
                🚭 SayNo:สู้บุหรี่ไฟฟ้า
              </p>
            </div>
            <button onClick={() => setStep(1)} className="btn-primary mt-8 w-full text-base">
              เริ่มเลย! ✨
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col">
            <h2 className="text-2xl font-display font-bold text-detective-700 mb-1">✏️ ตั้งชื่อเล่นของเรา</h2>
            <p className="text-sm text-gray-500 mb-5">แค่ชื่อเล่นก็พอ ไม่ต้องบอกชื่อจริง</p>

            <label className="text-sm font-semibold text-gray-700">ชื่อในเกม</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              placeholder="เช่น น้องเอ, นักสืบจุก"
              className="w-full p-3 mt-1 mb-4 rounded-2xl border-2 border-detective-100 bg-white/90
                         focus:border-detective-500 focus:shadow-glow-sm outline-none transition-all"
            />

            <label className="text-sm font-semibold text-gray-700 mb-2 block">เลือกอวตารน่ารักๆ</label>
            <div className="mb-24">
              <AvatarFolder preset={avatar} customId={customAvatarId} onPick={handlePickAvatar} />
            </div>

            <div className="sticky bottom-0 -mx-6 px-6 pt-3
                            pb-[max(0.75rem,env(safe-area-inset-bottom))]
                            mt-auto bg-gradient-to-t from-white via-white/95 to-white/0
                            backdrop-blur-sm">
              <button onClick={() => setStep(2)} disabled={!nickname.trim()}
                className="btn-primary w-full">
                ต่อไป →
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col">
            <h2 className="text-xl font-display font-bold text-detective-700 mb-1">🛡️ ความเป็นส่วนตัว (PDPA)</h2>
            <p className="text-xs text-gray-500 mb-3">กดแถบเพื่ออ่านรายละเอียดเพิ่มเติม แต่ละหัวข้อ</p>

            {/* TL;DR ใหญ่ๆ อยู่ด้านบน — เห็นทันทีไม่ต้อง scroll */}
            <div className="card-hero mb-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                <b className="text-detective-700">🚫 เราไม่เก็บข้อมูลส่วนตัว</b><br/>
                เกมเพื่อการศึกษาเรื่อง <b>บุหรี่ไฟฟ้า</b> สำหรับ ม.ต้น
                เก็บแค่ "ชื่อเล่น" และ "คะแนน" เพื่อบันทึกความคืบหน้า
              </p>
            </div>

            <div className="space-y-1.5 mb-3">
              <PDPAAccordion title="🚫 ไม่ส่งอะไรออกจากเครื่อง?">
                <ul className="space-y-0.5 pl-1">
                  <li>• เบอร์โทร อีเมล ที่อยู่ โรงเรียน</li>
                  <li>• รูปถ่าย เอกสารยืนยันตัวตน</li>
                  <li>• ไม่บังคับกรอกชื่อจริง</li>
                  <li>• ไม่ขายข้อมูลให้บุคคลที่สาม</li>
                </ul>
              </PDPAAccordion>

              <PDPAAccordion title="📦 เก็บแค่อะไร?">
                <ul className="space-y-0.5 pl-1">
                  <li>• <b>ชื่อเล่น</b> ที่น้องตั้งเอง (เป็นชื่อสมมุติได้)</li>
                  <li>• <b>คะแนนเกม</b> และด่านที่ผ่าน</li>
                  <li>• User ID เข้ารหัส SHA-256 ระบุตัวตนไม่ได้</li>
                  <li>• <b>ชื่อจริง</b> (เฉพาะถ้าเลือกใส่เพื่อพิมพ์เกียรติบัตร) — เก็บ<b>ในเครื่องนี้เท่านั้น</b> เข้ารหัสไว้ ลบได้ทุกเมื่อ</li>
                </ul>
              </PDPAAccordion>

              <PDPAAccordion title="🎯 ใช้ข้อมูลทำอะไร?">
                <ul className="space-y-0.5 pl-1">
                  <li>• บันทึกความคืบหน้าของเกม</li>
                  <li>• ออกเกียรติบัตรน่ารักๆ ตอนเล่นจบ</li>
                  <li>• ไม่ใช้เพื่อการตลาด/ส่งข้อความรบกวน</li>
                </ul>
              </PDPAAccordion>

              <PDPAAccordion title="🗑️ อยากลบข้อมูลออก?">
                <p>กดปุ่ม "ลบข้อมูล" ในหน้าโปรไฟล์ได้ตลอด ข้อมูลจะหายทันที</p>
              </PDPAAccordion>
            </div>

            <label className="flex items-start gap-3 mb-24 cursor-pointer bg-detective-50/70 rounded-2xl p-3 border-2 border-detective-100">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-1 w-5 h-5 accent-detective-500" />
              <span className="text-sm text-gray-700 font-medium">
                ฉันเข้าใจ <b>ยินยอม</b>ให้เก็บข้อมูลตามที่ระบุ เพื่อใช้กับเกมนี้เท่านั้น
              </span>
            </label>

            <div className="sticky bottom-0 -mx-6 px-6 pt-3
                            pb-[max(0.75rem,env(safe-area-inset-bottom))]
                            mt-auto bg-gradient-to-t from-white via-white/95 to-white/0
                            backdrop-blur-sm">
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← กลับ</button>
                <button onClick={handleFinish} disabled={!consent} className="btn-primary flex-1">
                  เริ่มเล่น ✨
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
