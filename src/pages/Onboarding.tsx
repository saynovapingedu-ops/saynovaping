import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import AvatarFolder from '../components/AvatarFolder';

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
    <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-candy-200/40 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 bg-warning-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-mint-200/40 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === step
                ? 'w-12 bg-gradient-to-r from-detective-500 to-candy-500 shadow-glow-sm'
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
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-detective-600 via-candy-500
                           to-warning-500 bg-clip-text text-transparent mb-2">
              นักสืบสุขภาพ
            </h1>
            <p className="text-gray-600 mb-1 font-medium">🚭 ภารกิจรู้ทันบุหรี่ไฟฟ้า</p>
            <div className="card-hero mt-6 mx-2">
              <p className="text-sm text-gray-700 leading-relaxed">
                เกมสนุก ฝึกทักษะปฏิเสธ <b>บุหรี่ไฟฟ้า</b><br/>
                สำหรับเยาวชน ม.ต้น<br/>
                เล่นจบรับ Certificate น่ารักๆ 🏆
              </p>
              <p className="text-[11px] text-detective-500 font-semibold mt-3">
                🎓 Walailak University — SayNo:สู้บุหรี่ไฟฟ้า
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
            <p className="text-sm text-gray-500 mb-4">อ่านสบายๆ ก่อนเริ่มเกม</p>

            <div className="card text-sm text-gray-700 leading-relaxed space-y-3 mb-4">
              <div>
                <p className="font-bold text-detective-700 mb-1">🎮 เกมนี้คืออะไร?</p>
                <p>เกมนี้เป็นเกมเพื่อการศึกษา <b>เกี่ยวกับบุหรี่ไฟฟ้า</b> โดยเฉพาะ
                ออกแบบให้น้องๆ ม.ต้น ได้เรียนรู้พิษภัยและฝึกทักษะปฏิเสธอย่างสนุกสนาน</p>
              </div>

              <div>
                <p className="font-bold text-detective-700 mb-1">🚫 เราไม่เก็บข้อมูลอะไรของน้องเลย</p>
                <ul className="space-y-1 pl-2">
                  <li>• <b>ไม่เก็บ</b> ชื่อจริง นามสกุล อายุ ชั้นปี</li>
                  <li>• <b>ไม่เก็บ</b> เบอร์โทร อีเมล ที่อยู่ โรงเรียน</li>
                  <li>• <b>ไม่เก็บ</b> รูปถ่าย หรือเอกสารยืนยันตัวตน</li>
                  <li>• <b>ไม่ขาย</b> ข้อมูลให้บุคคลที่สาม</li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-detective-700 mb-1">📦 แล้วเก็บอะไรบ้าง?</p>
                <ul className="space-y-1 pl-2">
                  <li>• <b>ชื่อเล่นในเกม</b> ที่น้องตั้งเอง (เป็นชื่อสมมุติได้)</li>
                  <li>• <b>คะแนนเกม</b> และด่านที่ผ่านแล้ว — เพื่อให้กลับมาเล่นต่อได้</li>
                  <li>• User ID ถูก <b>เข้ารหัสด้วย SHA-256</b> ระบุตัวตนกลับไม่ได้</li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-detective-700 mb-1">🎯 ใช้ข้อมูลทำอะไร?</p>
                <ul className="space-y-1 pl-2">
                  <li>• บันทึก progress ของเกม</li>
                  <li>• ออก Certificate น่ารักๆ ตอนเล่นจบ</li>
                  <li>• ไม่ใช้เพื่อการตลาด หรือส่งข้อความรบกวน</li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-detective-700 mb-1">🗑️ อยากลบข้อมูลออก?</p>
                <p>กดปุ่ม "ลบข้อมูล" ในหน้าโปรไฟล์ได้ตลอด ข้อมูลจะหายทันที</p>
              </div>

              <p className="text-[11px] text-gray-500 italic pt-2 border-t border-detective-100">
                เว็บนี้เป็นเครื่องมือเพื่อการศึกษาเท่านั้น ไม่มีการขาย/โฆษณาสินค้า
                ผลิตโดย Walailak University เพื่อรณรงค์ "สู้บุหรี่ไฟฟ้า"
              </p>
            </div>

            <label className="flex items-start gap-3 mb-24 cursor-pointer bg-detective-50/70 rounded-2xl p-3 border-2 border-detective-100">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-1 w-5 h-5 accent-detective-500" />
              <span className="text-sm text-gray-700 font-medium">
                ฉันอ่านและเข้าใจ <b>ยินยอม</b>ให้เก็บเฉพาะข้อมูลที่ระบุข้างต้น
                เพื่อใช้กับเกมนี้เท่านั้น
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
  );
}
